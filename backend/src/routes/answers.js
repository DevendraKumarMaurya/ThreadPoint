import express from 'express';
import { prisma, pool, isPostgresAvailable, memoryStore, syncMemoryUserReputation, createNotification, evaluateAndAwardBadges } from '../lib/db.js';
import { requireAuth } from '../middleware/auth.js';
import { validateAnswer } from '../middleware/validate.js';

const router = express.Router();

// POST /api/questions/:questionId/answers
router.post('/questions/:questionId/answers', requireAuth, validateAnswer, async (req, res) => {
  try {
    const questionId = parseInt(req.params.questionId, 10);
    const { body } = req.body;
    const user_id = req.user.id;

    if (isNaN(questionId)) {
      return res.status(400).json({ error: 'Invalid question ID' });
    }

    if (isPostgresAvailable) {
      // Check question exists
      const qCheck = await pool.query('SELECT id, user_id, title FROM "Question" WHERE id = $1', [questionId]);
      if (qCheck.rows.length === 0) {
        return res.status(404).json({ error: 'Question does not exist' });
      }

      const aRes = await pool.query(
        `INSERT INTO "Answer" (question_id, user_id, body, updated_at)
         VALUES ($1, $2, $3, NOW())
         RETURNING id, question_id, user_id, user_id AS author_id, body, is_accepted, created_at`,
        [questionId, user_id, body]
      );

      // Trigger notification to question author
      if (qCheck.rows[0].user_id !== user_id) {
        await createNotification({
          recipient_id: qCheck.rows[0].user_id,
          actor_id: user_id,
          type: 'answer',
          target_type: 'question',
          target_id: questionId,
          title: 'New answer to your question',
          message: `${req.user.username} posted an answer to "${qCheck.rows[0].title.slice(0, 50)}..."`,
        });
      }

      // Check and award badges for contributor
      await evaluateAndAwardBadges(user_id);

      return res.status(201).json({
        message: 'Answer posted successfully',
        answer: aRes.rows[0],
      });
    }

    // Memory fallback
    const question = memoryStore.questions.find(q => q.id === questionId);
    if (!question) {
      return res.status(404).json({ error: 'Question does not exist' });
    }

    const newId = memoryStore.answers.length > 0 ? Math.max(...memoryStore.answers.map(a => a.id)) + 1 : 1;
    const author = memoryStore.users.find(u => u.id === user_id);

    const newAnswer = {
      id: newId,
      question_id: questionId,
      user_id,
      author_id: user_id,
      author_username: author ? author.username : req.user.username,
      author_avatar: author ? author.avatar_url : null,
      author_reputation: author ? author.reputation_score : 1,
      body,
      is_accepted: false,
      net_votes: 0,
      created_at: new Date(),
      updated_at: new Date(),
    };

    memoryStore.answers.push(newAnswer);

    if ((question.user_id || question.author_id) !== user_id) {
      createNotification({
        recipient_id: question.user_id || question.author_id,
        actor_id: user_id,
        type: 'answer',
        target_type: 'question',
        target_id: questionId,
        title: 'New answer to your question',
        message: `${req.user.username} posted an answer to "${question.title.slice(0, 50)}..."`,
      });
    }

    evaluateAndAwardBadges(user_id);

    res.status(201).json({
      message: 'Answer posted successfully',
      answer: newAnswer,
    });
  } catch (err) {
    console.error('Post answer error:', err);
    res.status(500).json({ error: 'Failed to post answer' });
  }
});

// PATCH /api/answers/:id/accept
// Marks an answer as accepted. Enforced by database trigger & partial unique index
router.patch('/answers/:id/accept', requireAuth, async (req, res) => {
  try {
    const answerId = parseInt(req.params.id, 10);
    const userId = req.user.id;

    if (isNaN(answerId)) {
      return res.status(400).json({ error: 'Invalid answer ID' });
    }

    if (isPostgresAvailable) {
      // Find answer and question author
      const aRes = await pool.query(
        `SELECT a.id, a.question_id, a.user_id AS answer_author_id, a.is_accepted, q.user_id AS question_author_id
         FROM "Answer" a
         JOIN "Question" q ON a.question_id = q.id
         WHERE a.id = $1`,
        [answerId]
      );

      if (aRes.rows.length === 0) {
        return res.status(404).json({ error: 'Answer not found' });
      }

      const answer = aRes.rows[0];

      // Check authorization: ONLY the original question author may accept an answer (FR5)
      if (answer.question_author_id !== userId) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'Only the author of the question can accept an answer',
        });
      }

      const newAcceptedState = !answer.is_accepted;

      // If accepting this answer, unaccept any previous answer for the same question first
      if (newAcceptedState) {
        await pool.query(
          'UPDATE "Answer" SET is_accepted = FALSE WHERE question_id = $1 AND id <> $2',
          [answer.question_id, answerId]
        );
      }

      // Update answer - this fires the PostgreSQL trigger for reputation & constraint check
      const updateRes = await pool.query(
        'UPDATE "Answer" SET is_accepted = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
        [newAcceptedState, answerId]
      );

      // Fetch freshly computed reputations for question author and answer author
      const repRes = await pool.query(
        `SELECT
           q_author.id AS question_author_id, q_author.reputation_score AS question_author_reputation,
           a_author.id AS answer_author_id, a_author.reputation_score AS answer_author_reputation
         FROM "Answer" a
         JOIN "Question" q ON a.question_id = q.id
         JOIN "User" q_author ON q.user_id = q_author.id
         JOIN "User" a_author ON a.user_id = a_author.id
         WHERE a.id = $1`,
        [answerId]
      );
      const repData = repRes.rows[0] || {};

      if (newAcceptedState && repData.answer_author_id) {
        await createNotification({
          recipient_id: repData.answer_author_id,
          actor_id: userId,
          type: 'accept',
          target_type: 'answer',
          target_id: answerId,
          title: 'Answer accepted',
          message: `${req.user.username} marked your answer as the accepted solution (+15 reputation)`,
        });

        await evaluateAndAwardBadges(repData.answer_author_id);
        await evaluateAndAwardBadges(repData.question_author_id);
      }

      return res.json({
        message: newAcceptedState ? 'Answer marked as accepted' : 'Answer unaccepted',
        answer: updateRes.rows[0],
        question_author_id: repData.question_author_id,
        question_author_reputation: repData.question_author_reputation,
        answer_author_id: repData.answer_author_id,
        answer_author_reputation: repData.answer_author_reputation,
      });
    }

    // Memory fallback
    const answer = memoryStore.answers.find(a => a.id === answerId);
    if (!answer) {
      return res.status(404).json({ error: 'Answer not found' });
    }

    const question = memoryStore.questions.find(q => q.id === answer.question_id);
    if (!question) {
      return res.status(404).json({ error: 'Associated question not found' });
    }

    if ((question.user_id || question.author_id) !== userId) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Only the author of the question can accept an answer',
      });
    }

    const newAcceptedState = !answer.is_accepted;

    if (newAcceptedState) {
      memoryStore.answers
        .filter(a => a.question_id === answer.question_id && a.id !== answerId)
        .forEach(a => {
          a.is_accepted = false;
        });
    }

    answer.is_accepted = newAcceptedState;
    answer.updated_at = new Date();

    const aAuthorId = answer.user_id || answer.author_id;
    const qAuthorId = question.user_id || question.author_id;
    const aRep = syncMemoryUserReputation(aAuthorId);
    const qRep = syncMemoryUserReputation(qAuthorId);

    if (newAcceptedState && aAuthorId !== userId) {
      createNotification({
        recipient_id: aAuthorId,
        actor_id: userId,
        type: 'accept',
        target_type: 'answer',
        target_id: answerId,
        title: 'Answer accepted',
        message: `${req.user.username} marked your answer as the accepted solution (+15 reputation)`,
      });

      evaluateAndAwardBadges(aAuthorId);
      evaluateAndAwardBadges(qAuthorId);
    }

    res.json({
      message: newAcceptedState ? 'Answer marked as accepted' : 'Answer unaccepted',
      answer,
      question_author_id: qAuthorId,
      question_author_reputation: qRep,
      answer_author_id: aAuthorId,
      answer_author_reputation: aRep,
    });
  } catch (err) {
    console.error('Accept answer error:', err);
    res.status(500).json({ error: 'Failed to update accepted status: ' + err.message });
  }
});

// PATCH /api/answers/:id - Edit an answer body
router.patch('/answers/:id', requireAuth, async (req, res) => {
  try {
    const answerId = parseInt(req.params.id, 10);
    const userId = req.user.id;
    const { body } = req.body;

    if (isNaN(answerId)) {
      return res.status(400).json({ error: 'Invalid answer ID' });
    }

    if (!body || !body.trim()) {
      return res.status(400).json({ error: 'Answer body cannot be empty' });
    }

    if (isPostgresAvailable) {
      const aCheck = await pool.query('SELECT user_id FROM "Answer" WHERE id = $1', [answerId]);
      if (aCheck.rows.length === 0) return res.status(404).json({ error: 'Answer not found' });
      if (aCheck.rows[0].user_id !== userId) return res.status(403).json({ error: 'Not authorized to edit this answer' });

      const updated = await pool.query(
        'UPDATE "Answer" SET body = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
        [body.trim(), answerId]
      );

      return res.json({
        message: 'Answer updated successfully',
        answer: updated.rows[0],
      });
    }

    // Memory fallback
    const answer = memoryStore.answers.find(a => a.id === answerId);
    if (!answer) return res.status(404).json({ error: 'Answer not found' });
    if ((answer.user_id || answer.author_id) !== userId) {
      return res.status(403).json({ error: 'Not authorized to edit this answer' });
    }

    answer.body = body.trim();
    answer.updated_at = new Date();

    res.json({
      message: 'Answer updated successfully',
      answer,
    });
  } catch (err) {
    console.error('Update answer error:', err);
    res.status(500).json({ error: 'Failed to update answer' });
  }
});

// DELETE /api/answers/:id
router.delete('/answers/:id', requireAuth, async (req, res) => {
  try {
    const answerId = parseInt(req.params.id, 10);
    const userId = req.user.id;

    if (isPostgresAvailable) {
      const aRes = await pool.query('SELECT user_id FROM "Answer" WHERE id = $1', [answerId]);
      if (aRes.rows.length === 0) return res.status(404).json({ error: 'Answer not found' });
      if (aRes.rows[0].user_id !== userId) return res.status(403).json({ error: 'Not authorized' });

      await pool.query('DELETE FROM "Answer" WHERE id = $1', [answerId]);
      return res.json({ message: 'Answer deleted successfully' });
    }

    const idx = memoryStore.answers.findIndex(a => a.id === answerId);
    if (idx === -1) return res.status(404).json({ error: 'Answer not found' });
    if ((memoryStore.answers[idx].user_id || memoryStore.answers[idx].author_id) !== userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    memoryStore.answers.splice(idx, 1);
    res.json({ message: 'Answer deleted successfully' });
  } catch (err) {
    console.error('Delete answer error:', err);
    res.status(500).json({ error: 'Failed to delete answer' });
  }
});

export default router;

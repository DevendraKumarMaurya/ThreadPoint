export function validateQuestion(req, res, next) {
  const { title, body, tags } = req.body;
  const errors = [];

  if (!title || typeof title !== 'string' || title.trim().length < 10) {
    errors.push('Title is required and must be at least 10 characters');
  }

  if (!body || typeof body !== 'string' || body.trim().length < 20) {
    errors.push('Body is required and must be at least 20 characters');
  }

  if (!tags || !Array.isArray(tags) || tags.length === 0) {
    errors.push('At least one tag is required');
  } else if (tags.length > 5) {
    errors.push('A maximum of 5 tags is allowed');
  }

  if (errors.length > 0) {
    return res.status(400).json({ error: 'Validation failed', errors });
  }

  next();
}

export function validateAnswer(req, res, next) {
  const { body } = req.body;
  if (!body || typeof body !== 'string' || body.trim().length < 15) {
    return res.status(400).json({
      error: 'Validation failed',
      message: 'Answer body is required and must be at least 15 characters',
    });
  }
  next();
}

export function validateVote(req, res, next) {
  const { target_type, target_id, value } = req.body;
  const errors = [];

  if (!['question', 'answer'].includes(target_type)) {
    errors.push('target_type must be either "question" or "answer"');
  }

  if (!target_id || isNaN(parseInt(target_id, 10))) {
    errors.push('target_id must be a valid integer ID');
  }

  if (![-1, 0, 1].includes(Number(value))) {
    errors.push('value must be 1 (upvote), -1 (downvote), or 0 (remove vote)');
  }

  if (errors.length > 0) {
    return res.status(400).json({ error: 'Validation failed', errors });
  }

  next();
}

export function validateComment(req, res, next) {
  const { target_type, target_id, body } = req.body;
  const errors = [];

  if (!['question', 'answer'].includes(target_type)) {
    errors.push('target_type must be either "question" or "answer"');
  }

  if (!target_id || isNaN(parseInt(target_id, 10))) {
    errors.push('target_id must be a valid integer ID');
  }

  if (!body || typeof body !== 'string' || body.trim().length < 3) {
    errors.push('Comment body must be at least 3 characters');
  }

  if (errors.length > 0) {
    return res.status(400).json({ error: 'Validation failed', errors });
  }

  next();
}

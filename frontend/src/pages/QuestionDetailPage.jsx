import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MessageSquare } from 'lucide-react';
import {
  fetchQuestionDetail,
  postAnswer,
  toggleAcceptAnswer,
  castVote,
  postComment,
  fetchComments,
  updateQuestion,
  deleteQuestion,
  updateAnswer,
  deleteAnswer,
  submitReport,
} from '../api/client';
import { useAuth } from '../context/AuthContext';

// Modular Question Detail Components
import QuestionHeader from '../components/question/QuestionHeader';
import QuestionMainCard from '../components/question/QuestionMainCard';
import AnswerCard from '../components/question/AnswerCard';
import AnswerComposer from '../components/question/AnswerComposer';
import ReportModal from '../components/question/ReportModal';

export default function QuestionDetailPage({ questionId: propQuestionId, onNavigate: propOnNavigate }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const questionId = propQuestionId || id;

  const onNavigate = propOnNavigate || ((view, opts) => {
    if (view === 'feed' || view === 'questions') navigate('/feed');
    else if (view === 'profile') navigate(`/users/${opts}`);
    else if (view === 'tags') navigate('/tags');
    else navigate(`/${view}`);
  });

  const {
    currentUser,
    userVotes,
    setUserVotes,
    updateUserReputation,
    bookmarkedIds,
    toggleBookmarkItem,
    openAuthModal,
  } = useAuth();

  const isBookmarked = bookmarkedIds?.has(Number(questionId));
  const [question, setQuestion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Question editing state
  const [isEditingQuestion, setIsEditingQuestion] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editBody, setEditBody] = useState('');
  const [editTags, setEditTags] = useState('');
  const [editQuestionTab, setEditQuestionTab] = useState('write');
  const [savingQuestion, setSavingQuestion] = useState(false);

  // Answer editing state
  const [editingAnswerId, setEditingAnswerId] = useState(null);
  const [editAnswerText, setEditAnswerText] = useState('');
  const [savingAnswer, setSavingAnswer] = useState(false);

  // Moderation / Reporting state
  const [reportingTarget, setReportingTarget] = useState(null);
  const [reportReason, setReportReason] = useState('spam');
  const [reportDetails, setReportDetails] = useState('');
  const [submittingReport, setSubmittingReport] = useState(false);
  const [reportSuccess, setReportSuccess] = useState('');

  // Answer composer state
  const [answerBody, setAnswerBody] = useState('');
  const [answerTab, setAnswerTab] = useState('write');
  const [submittingAnswer, setSubmittingAnswer] = useState(false);

  // Comments state
  const [commentsMap, setCommentsMap] = useState({});

  const loadQuestion = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchQuestionDetail(questionId);
      setQuestion(data);

      // Load comments for question
      const qComments = await fetchComments('question', questionId);
      setCommentsMap(prev => ({ ...prev, [`question-${questionId}`]: qComments.comments || [] }));

      // Load comments for each answer
      for (const a of (data.answers || [])) {
        const aComments = await fetchComments('answer', a.id);
        setCommentsMap(prev => ({ ...prev, [`answer-${a.id}`]: aComments.comments || [] }));
      }
    } catch (err) {
      console.error('Question detail error:', err);
      setError('Failed to load question details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (questionId) {
      loadQuestion();
    }
  }, [questionId]);

  const handleVote = async (targetType, targetId, direction) => {
    if (!currentUser) {
      if (openAuthModal) openAuthModal();
      return;
    }

    const voteKey = `${targetType}-${targetId}`;
    const currentVal = Number(userVotes[voteKey]) || 0;
    const newVal = currentVal === direction ? 0 : direction;
    const delta = newVal - currentVal;

    // Optimistically update UI vote indicators and net votes
    setUserVotes(prev => ({ ...prev, [voteKey]: newVal }));
    if (targetType === 'question') {
      setQuestion(prev => prev ? ({ ...prev, net_votes: (Number(prev.net_votes) || 0) + delta }) : prev);
    } else {
      setQuestion(prev => prev ? ({
        ...prev,
        answers: (prev.answers || []).map(a => a.id === targetId ? {
          ...a,
          net_votes: (Number(a.net_votes) || 0) + delta,
        } : a),
      }) : prev);
    }

    try {
      const res = await castVote({
        target_type: targetType,
        target_id: targetId,
        value: newVal,
      });

      if (res.current_user_vote !== undefined) {
        setUserVotes(prev => ({ ...prev, [voteKey]: Number(res.current_user_vote) }));
      }

      if (targetType === 'question') {
        setQuestion(prev => ({
          ...prev,
          net_votes: Number(res.net_votes),
          author_reputation: res.target_author_reputation !== undefined ? res.target_author_reputation : prev.author_reputation,
        }));
        if (currentUser?.id === (res.target_author_id || question?.user_id || question?.author_id) && res.target_author_reputation !== undefined) {
          updateUserReputation(res.target_author_reputation);
        }
      } else {
        setQuestion(prev => ({
          ...prev,
          answers: (prev.answers || []).map(a => a.id === targetId ? {
            ...a,
            net_votes: Number(res.net_votes),
            author_reputation: res.target_author_reputation !== undefined ? res.target_author_reputation : a.author_reputation,
          } : a),
        }));
        if (currentUser?.id === res.target_author_id && res.target_author_reputation !== undefined) {
          updateUserReputation(res.target_author_reputation);
        }
      }
    } catch (err) {
      console.error('Vote failed:', err);
      // Revert optimistic updates on failure
      setUserVotes(prev => ({ ...prev, [voteKey]: currentVal }));
      if (targetType === 'question') {
        setQuestion(prev => prev ? ({ ...prev, net_votes: (Number(prev.net_votes) || 0) - delta }) : prev);
      } else {
        setQuestion(prev => prev ? ({
          ...prev,
          answers: (prev.answers || []).map(a => a.id === targetId ? {
            ...a,
            net_votes: (Number(a.net_votes) || 0) - delta,
          } : a),
        }) : prev);
      }
    }
  };

  const handleAcceptAnswer = async (answerId) => {
    if (!currentUser || Number(currentUser.id) !== Number(question?.author_id || question?.user_id)) {
      alert('Only the original question author can mark an answer as accepted.');
      return;
    }

    try {
      const res = await toggleAcceptAnswer(answerId);
      if (res) {
        if (currentUser?.id === res.question_author_id && res.question_author_reputation !== undefined) {
          updateUserReputation(res.question_author_reputation);
        } else if (currentUser?.id === res.answer_author_id && res.answer_author_reputation !== undefined) {
          updateUserReputation(res.answer_author_reputation);
        }
      }
      await loadQuestion();
    } catch (err) {
      alert(err.message || 'Failed to update accepted solution');
    }
  };

  const handlePostAnswer = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!answerBody.trim() || answerBody.length < 15) {
      alert('Answer must be at least 15 characters long.');
      return;
    }

    setSubmittingAnswer(true);
    try {
      await postAnswer(questionId, { body: answerBody });
      setAnswerBody('');
      setAnswerTab('write');
      await loadQuestion();
    } catch (err) {
      alert(err.message || 'Failed to post answer');
    } finally {
      setSubmittingAnswer(false);
    }
  };

  const startEditingQuestion = () => {
    setEditTitle(question.title);
    setEditBody(question.body);
    setEditTags((question.tags || []).map(t => typeof t === 'object' ? t.name : t).join(', '));
    setEditQuestionTab('write');
    setIsEditingQuestion(true);
  };

  const handleSaveQuestionEdit = async () => {
    if (!editTitle.trim() || !editBody.trim()) {
      alert('Question title and body cannot be empty.');
      return;
    }
    const tagsArray = editTags.split(',').map(t => t.trim().toLowerCase()).filter(Boolean);
    if (tagsArray.length === 0) {
      alert('Please provide at least one topic tag.');
      return;
    }

    setSavingQuestion(true);
    try {
      await updateQuestion(question.id, {
        title: editTitle.trim(),
        body: editBody.trim(),
        tags: tagsArray,
      });
      setIsEditingQuestion(false);
      await loadQuestion();
    } catch (err) {
      alert(err.message || 'Failed to update question');
    } finally {
      setSavingQuestion(false);
    }
  };

  const handleDeleteQuestion = async () => {
    if (!window.confirm('Are you sure you want to permanently delete this question? This action cannot be undone.')) {
      return;
    }
    try {
      await deleteQuestion(question.id);
      onNavigate('feed');
    } catch (err) {
      alert(err.message || 'Failed to delete question');
    }
  };

  const startEditingAnswer = (answer) => {
    setEditingAnswerId(answer.id);
    setEditAnswerText(answer.body);
  };

  const handleSaveAnswerEdit = async (answerId) => {
    if (!editAnswerText.trim() || editAnswerText.length < 10) {
      alert('Answer text must be at least 10 characters.');
      return;
    }
    setSavingAnswer(true);
    try {
      await updateAnswer(answerId, { body: editAnswerText.trim() });
      setEditingAnswerId(null);
      await loadQuestion();
    } catch (err) {
      alert(err.message || 'Failed to update answer');
    } finally {
      setSavingAnswer(false);
    }
  };

  const handleDeleteAnswer = async (answerId) => {
    if (!window.confirm('Are you sure you want to permanently delete this answer?')) {
      return;
    }
    try {
      await deleteAnswer(answerId);
      await loadQuestion();
    } catch (err) {
      alert(err.message || 'Failed to delete answer');
    }
  };

  const handleOpenReport = (targetType, targetId, title) => {
    if (!currentUser) {
      if (openAuthModal) openAuthModal();
      return;
    }
    setReportingTarget({ target_type: targetType, target_id: targetId, title });
    setReportReason('spam');
    setReportDetails('');
    setReportSuccess('');
  };

  const handleSubmitReport = async () => {
    if (!reportingTarget) return;
    setSubmittingReport(true);
    try {
      await submitReport({
        target_type: reportingTarget.target_type,
        target_id: reportingTarget.target_id,
        reason: reportReason,
        details: reportDetails,
      });
      setReportSuccess('Thank you. Your report has been submitted to moderators for review.');
      setTimeout(() => {
        setReportingTarget(null);
        setReportSuccess('');
      }, 2000);
    } catch (err) {
      alert(err.message || 'Failed to submit report');
    } finally {
      setSubmittingReport(false);
    }
  };

  const handlePostComment = async (targetType, targetId, body, parentCommentId = null) => {
    if (!body || !body.trim()) return;

    try {
      await postComment({
        target_type: targetType,
        target_id: targetId,
        body: body.trim(),
        parent_comment_id: parentCommentId,
      });

      const updated = await fetchComments(targetType, targetId);
      setCommentsMap(prev => ({ ...prev, [`${targetType}-${targetId}`]: updated.comments || [] }));
    } catch (err) {
      alert(err.message || 'Failed to post comment');
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-16 text-center border border-slate-200">
        <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-sm font-medium text-slate-600">Loading question details...</p>
      </div>
    );
  }

  if (error || !question) {
    return (
      <div className="bg-white rounded-2xl p-10 text-center border border-slate-200">
        <p className="text-red-600 font-semibold mb-3">{error || 'Question not found'}</p>
        <button
          onClick={() => onNavigate('feed')}
          className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700 inline-flex items-center gap-1.5 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Feed
        </button>
      </div>
    );
  }

  const isQuestionAuthor = Boolean(currentUser?.id && Number(currentUser.id) === Number(question.author_id || question.user_id));

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col gap-8 pb-16">
      {/* 1. Breadcrumb and Question Header */}
      <QuestionHeader
        question={question}
        questionId={questionId}
        currentUser={currentUser}
        isQuestionAuthor={isQuestionAuthor}
        isEditingQuestion={isEditingQuestion}
        startEditingQuestion={startEditingQuestion}
        handleDeleteQuestion={handleDeleteQuestion}
        handleOpenReport={handleOpenReport}
        isBookmarked={isBookmarked}
        toggleBookmarkItem={toggleBookmarkItem}
        onNavigate={onNavigate}
      />

      {/* 2. Question Main Card (Votes, Body / Edit Mode, Tags, Comments) */}
      <QuestionMainCard
        question={question}
        currentUser={currentUser}
        userVotes={userVotes}
        isEditingQuestion={isEditingQuestion}
        setIsEditingQuestion={setIsEditingQuestion}
        editTitle={editTitle}
        setEditTitle={setEditTitle}
        editBody={editBody}
        setEditBody={setEditBody}
        editTags={editTags}
        setEditTags={setEditTags}
        editQuestionTab={editQuestionTab}
        setEditQuestionTab={setEditQuestionTab}
        savingQuestion={savingQuestion}
        handleSaveQuestionEdit={handleSaveQuestionEdit}
        handleVote={handleVote}
        comments={commentsMap[`question-${question.id}`] || []}
        onPostComment={handlePostComment}
        openAuthModal={openAuthModal}
        onNavigate={onNavigate}
      />

      {/* 3. Answers List Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <h2 className="font-sans font-bold text-xl text-slate-900 flex items-center gap-2">
            <span>{question.answers ? question.answers.length : 0}</span>
            <span>Solutions & Answers</span>
          </h2>
          <span className="text-xs font-mono text-slate-400">
            Sorted by Accepted & Highest Net Upvotes
          </span>
        </div>

        {question.answers && question.answers.length > 0 ? (
          <div className="space-y-6">
            {question.answers.map((answer) => (
              <AnswerCard
                key={answer.id}
                answer={answer}
                question={question}
                currentUser={currentUser}
                userVotes={userVotes}
                isQuestionAuthor={isQuestionAuthor}
                editingAnswerId={editingAnswerId}
                setEditingAnswerId={setEditingAnswerId}
                editAnswerText={editAnswerText}
                setEditAnswerText={setEditAnswerText}
                savingAnswer={savingAnswer}
                startEditingAnswer={startEditingAnswer}
                handleSaveAnswerEdit={handleSaveAnswerEdit}
                handleDeleteAnswer={handleDeleteAnswer}
                handleVote={handleVote}
                handleAcceptAnswer={handleAcceptAnswer}
                handleOpenReport={handleOpenReport}
                comments={commentsMap[`answer-${answer.id}`] || []}
                onPostComment={handlePostComment}
                openAuthModal={openAuthModal}
                onNavigate={onNavigate}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-10 text-center border border-slate-200 text-slate-400 text-sm">
            <MessageSquare className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="font-semibold text-slate-700">No solutions provided yet</p>
            <p className="text-xs text-slate-400 mt-1">Be the first to provide an architectural explanation or code snippet!</p>
          </div>
        )}
      </div>

      {/* 4. Markdown Answer Composer */}
      <AnswerComposer
        answerBody={answerBody}
        setAnswerBody={setAnswerBody}
        answerTab={answerTab}
        setAnswerTab={setAnswerTab}
        submittingAnswer={submittingAnswer}
        currentUser={currentUser}
        handlePostAnswer={handlePostAnswer}
      />

      {/* 5. Content Moderation / Report Modal Dialog */}
      <ReportModal
        reportingTarget={reportingTarget}
        onClose={() => setReportingTarget(null)}
        reportReason={reportReason}
        setReportReason={setReportReason}
        reportDetails={reportDetails}
        setReportDetails={setReportDetails}
        submittingReport={submittingReport}
        reportSuccess={reportSuccess}
        onSubmitReport={handleSubmitReport}
      />
    </div>
  );
}

// ThreadPoint API Client

export const API_BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

export function getApiUrl(endpoint) {
  if (!endpoint) return API_BASE_URL;
  if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) return endpoint;
  return `${API_BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
}

export function getHeaders(customHeaders = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('threadpoint_token') : null;
  const headers = {
    'Content-Type': 'application/json',
    ...(customHeaders || {}),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export async function apiFetch(url, options = {}) {
  const fullUrl = getApiUrl(url);
  const headers = getHeaders(options.headers);
  const res = await fetch(fullUrl, {
    ...options,
    headers,
  });

  if (res.status === 401) {
    const existingToken = typeof window !== 'undefined' ? localStorage.getItem('threadpoint_token') : null;
    if (existingToken) {
      console.warn('[API Client] 401 Unauthorized received — clearing stale credentials from localStorage');
      localStorage.removeItem('threadpoint_token');
      localStorage.removeItem('threadpoint_user');
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('threadpoint:auth-expired', {
          detail: { url, status: 401 }
        }));
      }
    }
  }

  return res;
}

export async function fetchQuestions({ sort = 'interesting', tag = '', page = 1, limit = 20 } = {}) {
  const params = new URLSearchParams();
  if (sort) params.set('sort', sort);
  if (tag) params.set('tag', tag);
  if (page) params.set('page', page);
  if (limit) params.set('limit', limit);

  const res = await apiFetch(`/api/questions?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch questions');
  return res.json();
}

export async function fetchQuestionDetail(id) {
  const res = await apiFetch(`/api/questions/${id}`);
  if (!res.ok) throw new Error('Failed to fetch question detail');
  return res.json();
}

export async function createQuestion({ title, body, tags }) {
  const res = await apiFetch('/api/questions', {
    method: 'POST',
    body: JSON.stringify({ title, body, tags }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to create question');
  return data;
}

export async function postAnswer(questionId, { body }) {
  const res = await apiFetch(`/api/questions/${questionId}/answers`, {
    method: 'POST',
    body: JSON.stringify({ body }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to post answer');
  return data;
}

export async function toggleAcceptAnswer(answerId) {
  const res = await apiFetch(`/api/answers/${answerId}/accept`, {
    method: 'PATCH',
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || data.error || 'Failed to update accepted status');
  return data;
}

export async function castVote({ target_type, target_id, value }) {
  const res = await apiFetch('/api/votes', {
    method: 'POST',
    body: JSON.stringify({ target_type, target_id, value }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to cast vote');
  return data;
}

export async function fetchMyVotes() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('threadpoint_token') : null;
  if (!token) return { votes: [] };

  try {
    const res = await apiFetch('/api/votes/my-votes');
    if (!res.ok) return { votes: [] };
    return res.json();
  } catch (e) {
    return { votes: [] };
  }
}

export async function fetchComments(target_type, target_id) {
  const res = await apiFetch(`/api/comments?target_type=${target_type}&target_id=${target_id}`);
  if (!res.ok) throw new Error('Failed to fetch comments');
  return res.json();
}

export async function postComment({ target_type, target_id, body, parent_comment_id }) {
  const res = await apiFetch('/api/comments', {
    method: 'POST',
    body: JSON.stringify({ target_type, target_id, body, parent_comment_id }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to post comment');
  return data;
}

export async function fetchTags() {
  const res = await apiFetch('/api/tags');
  if (!res.ok) throw new Error('Failed to fetch tags');
  return res.json();
}

export async function fetchTagDetail(name) {
  const res = await apiFetch(`/api/tags/${encodeURIComponent(name)}`);
  if (!res.ok) throw new Error('Failed to fetch tag details');
  return res.json();
}

export async function searchQuestions(query, type = 'all') {
  const params = new URLSearchParams({ q: query });
  if (type && type !== 'all') params.set('type', type);
  const res = await apiFetch(`/api/search?${params.toString()}`);
  if (!res.ok) throw new Error('Search failed');
  return res.json();
}

export const searchAll = searchQuestions;

export async function fetchLeaderboard() {
  const res = await apiFetch('/api/users/leaderboard');
  if (!res.ok) throw new Error('Failed to fetch leaderboard');
  return res.json();
}

export async function fetchUserProfile(identifier) {
  const res = await apiFetch(`/api/users/${encodeURIComponent(identifier)}`);
  if (!res.ok) throw new Error('Failed to fetch user profile');
  return res.json();
}

export async function toggleFollowUser(identifier) {
  const res = await apiFetch(`/api/users/${encodeURIComponent(identifier)}/follow`, {
    method: 'POST',
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to update follow status');
  return data;
}

export async function fetchFollowers(identifier) {
  const res = await apiFetch(`/api/users/${encodeURIComponent(identifier)}/followers`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to fetch followers');
  return data;
}

export async function fetchFollowing(identifier) {
  const res = await apiFetch(`/api/users/${encodeURIComponent(identifier)}/following`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to fetch following users');
  return data;
}

export async function fetchHealth() {
  const res = await fetch(getApiUrl('/api/health'));
  if (!res.ok) throw new Error('Health check failed');
  return res.json();
}

export async function demoSwitch(userIdentifier) {
  const payload = typeof userIdentifier === 'number'
    ? { id: userIdentifier }
    : { username: userIdentifier };

  const res = await fetch(getApiUrl('/api/auth/demo-switch'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to switch demo user');
  return data;
}

export async function fetchCurrentUser() {
  try {
    const res = await apiFetch('/api/auth/me');
    if (!res.ok) return null;
    return res.json();
  } catch (e) {
    return null;
  }
}

export async function fetchBookmarks() {
  const res = await apiFetch('/api/bookmarks');
  if (!res.ok) throw new Error('Failed to fetch bookmarks');
  return res.json();
}

export async function fetchBookmarkIds() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('threadpoint_token') : null;
  if (!token) return { ids: [] };
  try {
    const res = await apiFetch('/api/bookmarks/ids');
    if (!res.ok) return { ids: [] };
    return res.json();
  } catch (e) {
    return { ids: [] };
  }
}

export async function toggleBookmark(questionId) {
  const res = await apiFetch(`/api/bookmarks/${questionId}`, {
    method: 'POST',
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to toggle bookmark');
  return data;
}

export async function googleLogin(credential) {
  const res = await fetch(getApiUrl('/api/auth/google'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ credential }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Google authentication failed');
  return data;
}

export async function sendEmailOtp(email, purpose = 'email_verification') {
  const res = await fetch(getApiUrl('/api/auth/send-otp'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, purpose }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to send OTP code');
  return data;
}

export async function resendEmailOtp(email, purpose = 'email_verification') {
  const res = await fetch(getApiUrl('/api/auth/resend-otp'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, purpose }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to resend code');
  return data;
}

export async function verifyEmailOtp(email, otp, purpose = 'email_verification') {
  const res = await fetch(getApiUrl('/api/auth/verify-otp'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, otp, purpose }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Verification failed');
  return data;
}

export async function setUserPassword(newPassword) {
  const res = await apiFetch('/api/auth/set-password', {
    method: 'POST',
    body: JSON.stringify({ newPassword }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to set password');
  return data;
}

export async function updateQuestion(id, { title, body, tags }) {
  const res = await apiFetch(`/api/questions/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ title, body, tags }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to update question');
  return data;
}

export async function deleteQuestion(id) {
  const res = await apiFetch(`/api/questions/${id}`, {
    method: 'DELETE',
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to delete question');
  return data;
}

export async function updateAnswer(id, { body }) {
  const res = await apiFetch(`/api/answers/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ body }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to update answer');
  return data;
}

export async function deleteAnswer(id) {
  const res = await apiFetch(`/api/answers/${id}`, {
    method: 'DELETE',
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to delete answer');
  return data;
}

export async function updateUserProfile({ username, bio, avatar_url, location, github_url, website_url }) {
  const res = await apiFetch('/api/users/profile', {
    method: 'PATCH',
    body: JSON.stringify({ username, bio, avatar_url, location, github_url, website_url }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to update profile');
  return data;
}

export async function fetchNotifications() {
  const res = await apiFetch('/api/notifications');
  if (!res.ok) throw new Error('Failed to fetch notifications');
  return res.json();
}

export async function markNotificationRead(id) {
  const res = await apiFetch(`/api/notifications/${id}/read`, {
    method: 'PATCH',
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to mark notification as read');
  return data;
}

export async function markAllNotificationsRead() {
  const res = await apiFetch('/api/notifications/read-all', {
    method: 'PATCH',
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to mark notifications as read');
  return data;
}

export async function fetchBadges() {
  const res = await apiFetch('/api/badges');
  if (!res.ok) throw new Error('Failed to fetch badges');
  return res.json();
}

export async function fetchUserBadges(identifier) {
  const res = await apiFetch(`/api/badges/user/${encodeURIComponent(identifier)}`);
  if (!res.ok) throw new Error('Failed to fetch user badges');
  return res.json();
}

export async function fetchWatchedTags() {
  const res = await apiFetch('/api/tags/watched');
  if (!res.ok) throw new Error('Failed to fetch watched tags');
  return res.json();
}

export async function toggleWatchTag(name) {
  const res = await apiFetch(`/api/tags/${encodeURIComponent(name)}/watch`, {
    method: 'POST',
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to toggle tag watch');
  return data;
}

export async function submitReport({ target_type, target_id, reason, details }) {
  const res = await apiFetch('/api/reports', {
    method: 'POST',
    body: JSON.stringify({ target_type, target_id, reason, details }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to submit report');
  return data;
}

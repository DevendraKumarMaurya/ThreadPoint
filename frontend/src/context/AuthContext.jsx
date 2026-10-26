import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  demoSwitch,
  fetchUserProfile,
  fetchCurrentUser,
  fetchLeaderboard,
  fetchBookmarkIds,
  toggleBookmark,
  fetchMyVotes,
  googleLogin,
  sendEmailOtp,
  verifyEmailOtp,
  resendEmailOtp,
  setUserPassword,
  getApiUrl,
} from '../api/client';

const AuthContext = createContext(null);

export const DEMO_USERS = [
  {
    id: 3,
    username: 'carol_dba',
    email: 'carol@example.com',
    avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
    bio: 'Senior Backend Architect. Cloud infrastructure & database triggers.',
    reputation_score: 61,
    is_email_verified: true,
    auth_provider: 'local',
  },
  {
    id: 1,
    username: 'alice_dev',
    email: 'alice@example.com',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
    bio: 'Distributed systems & PostgreSQL query tuning specialist.',
    reputation_score: 43,
    is_email_verified: true,
    auth_provider: 'local',
  },
  {
    id: 4,
    username: 'david_fullstack',
    email: 'david@example.com',
    avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80',
    bio: 'TypeScript fanatic & frontend performance enthusiast.',
    reputation_score: 33,
    is_email_verified: true,
    auth_provider: 'local',
  },
  {
    id: 2,
    username: 'bob_sql',
    email: 'bob@example.com',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
    bio: 'Full-stack PERN engineer. Passionate about clean code and reactive state.',
    reputation_score: 28,
    is_email_verified: true,
    auth_provider: 'local',
  },
];

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('threadpoint_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return DEMO_USERS[0];
      }
    }
    return DEMO_USERS[0];
  });

  const [token, setToken] = useState(() => {
    return localStorage.getItem('threadpoint_token') || 'demo_jwt_token_carol_dba';
  });

  const [demoUsers, setDemoUsers] = useState(DEMO_USERS);
  const [userVotes, setUserVotes] = useState({});
  const [bookmarkedIds, setBookmarkedIds] = useState(new Set());
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [otpModalState, setOtpModalState] = useState({
    isOpen: false,
    email: '',
    purpose: 'email_verification',
    onSuccess: null,
  });

  const openAuthModal = useCallback(() => setIsAuthModalOpen(true), []);
  const closeAuthModal = useCallback(() => setIsAuthModalOpen(false), []);

  const openOtpModal = useCallback(({ email, purpose = 'email_verification', onSuccess = null }) => {
    setOtpModalState({
      isOpen: true,
      email: email || currentUser?.email || '',
      purpose,
      onSuccess,
    });
  }, [currentUser?.email]);

  const closeOtpModal = useCallback(() => {
    setOtpModalState(prev => ({ ...prev, isOpen: false }));
  }, []);

  const loginWithGoogle = async (credential) => {
    try {
      const data = await googleLogin(credential);
      if (data?.token && data?.user) {
        try {
          localStorage.setItem('threadpoint_token', data.token);
          localStorage.setItem('threadpoint_user', JSON.stringify(data.user));
        } catch (e) {}
        setCurrentUser(data.user);
        setToken(data.token);
      }
      return data;
    } catch (err) {
      console.error('Google login error in AuthContext:', err);
      throw err;
    }
  };

  const sendOtp = async (email, purpose = 'email_verification') => {
    return await sendEmailOtp(email || currentUser?.email, purpose);
  };

  const verifyOtp = async (email, code, purpose = 'email_verification') => {
    const res = await verifyEmailOtp(email || currentUser?.email, code, purpose);
    if (res && (res.success || res.is_email_verified)) {
      setCurrentUser(prev => {
        const updated = prev ? { ...prev, is_email_verified: true } : prev;
        if (updated) {
          try {
            localStorage.setItem('threadpoint_user', JSON.stringify(updated));
          } catch (e) {}
        }
        return updated;
      });
    }
    return res;
  };

  const updatePassword = async (newPassword) => {
    const res = await setUserPassword(newPassword);
    if (res && res.user) {
      setCurrentUser(res.user);
    }
    return res;
  };

  const refreshUserVotes = useCallback(async () => {
    if (!currentUser?.id) {
      setUserVotes({});
      return;
    }
    try {
      const data = await fetchMyVotes();
      if (data && data.votes) {
        const votesMap = {};
        data.votes.forEach(v => {
          votesMap[`${v.target_type}-${v.target_id}`] = Number(v.value);
        });
        setUserVotes(votesMap);
      }
    } catch (e) {
      console.warn('Failed to load user votes:', e);
    }
  }, [currentUser?.id, token]);

  useEffect(() => {
    refreshUserVotes();
  }, [refreshUserVotes]);

  const refreshBookmarks = useCallback(async () => {
    if (!currentUser?.id) {
      setBookmarkedIds(new Set());
      return;
    }
    try {
      const data = await fetchBookmarkIds();
      if (data && data.ids) {
        setBookmarkedIds(new Set(data.ids));
      }
    } catch (e) {
      console.warn('Failed to load bookmark ids:', e);
    }
  }, [currentUser?.id]);

  useEffect(() => {
    refreshBookmarks();
  }, [refreshBookmarks]);

  const toggleBookmarkItem = async (questionId) => {
    if (!currentUser) return false;
    const isCurrentlyBookmarked = bookmarkedIds.has(questionId);

    // Optimistic UI update
    setBookmarkedIds(prev => {
      const next = new Set(prev);
      if (isCurrentlyBookmarked) next.delete(questionId);
      else next.add(questionId);
      return next;
    });

    try {
      const res = await toggleBookmark(questionId);
      return res.bookmarked;
    } catch (err) {
      // Revert optimistic update
      setBookmarkedIds(prev => {
        const next = new Set(prev);
        if (isCurrentlyBookmarked) next.add(questionId);
        else next.delete(questionId);
        return next;
      });
      throw err;
    }
  };

  // Synchronize currentUser to localStorage
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('threadpoint_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('threadpoint_user');
    }
  }, [currentUser]);

  // Synchronize token to localStorage
  useEffect(() => {
    if (token) {
      localStorage.setItem('threadpoint_token', token);
    } else {
      localStorage.removeItem('threadpoint_token');
    }
  }, [token]);

  // Refresh live user reputations from leaderboard and current user profile on mount
  const refreshLiveScores = useCallback(async () => {
    try {
      const data = await fetchLeaderboard();
      if (data && data.leaderboard && data.leaderboard.length > 0) {
        setDemoUsers(prev =>
          prev.map(du => {
            const live = data.leaderboard.find(u => u.id === du.id || u.username.toLowerCase() === du.username.toLowerCase());
            return live ? { ...du, reputation_score: live.reputation_score } : du;
          })
        );
      }
    } catch (err) {
      console.warn('Failed to refresh demo scores:', err);
    }

    if (currentUser?.id) {
      try {
        const uData = await fetchUserProfile(currentUser.id);
        if (uData && uData.user) {
          setCurrentUser(prev => {
            const merged = {
              ...(prev || {}),
              ...uData.user,
              is_email_verified: Boolean(uData.user.is_email_verified),
              reputation_score: uData.user.reputation_score,
            };
            try {
              localStorage.setItem('threadpoint_user', JSON.stringify(merged));
            } catch (e) {}
            return merged;
          });
        }
      } catch (err) {
        console.warn('Failed to refresh current user score:', err);
      }
    }
  }, [currentUser?.id]);

  useEffect(() => {
    refreshLiveScores();
  }, []);

  // Handle stale / expired session events dispatched by apiFetch
  useEffect(() => {
    const handleAuthExpired = () => {
      console.warn('[AuthContext] Session expired or invalid token — resetting to demo user');
      localStorage.removeItem('threadpoint_token');
      localStorage.removeItem('threadpoint_user');
      setCurrentUser(DEMO_USERS[0]);
      setToken('demo_jwt_token_carol_dba');
      setUserVotes({});
      setBookmarkedIds(new Set());
    };

    window.addEventListener('threadpoint:auth-expired', handleAuthExpired);
    return () => {
      window.removeEventListener('threadpoint:auth-expired', handleAuthExpired);
    };
  }, []);

  // Synchronize authenticated session from /api/auth/me on initial app load
  useEffect(() => {
    let isMounted = true;
    async function syncAuthSession() {
      const storedToken = localStorage.getItem('threadpoint_token');
      if (!storedToken || storedToken.startsWith('demo_jwt_')) return;
      try {
        const data = await fetchCurrentUser();
        if (isMounted) {
          if (data && data.user) {
            setCurrentUser(prev => {
              const merged = {
                ...(prev || {}),
                ...data.user,
                is_email_verified: Boolean(data.user.is_email_verified),
              };
              try {
                localStorage.setItem('threadpoint_user', JSON.stringify(merged));
              } catch (e) {}
              return merged;
            });
          } else {
            console.warn('[AuthContext] /api/auth/me returned null — clearing stale session');
            localStorage.removeItem('threadpoint_token');
            localStorage.removeItem('threadpoint_user');
            setCurrentUser(DEMO_USERS[0]);
            setToken('demo_jwt_token_carol_dba');
            setUserVotes({});
            setBookmarkedIds(new Set());
          }
        }
      } catch (err) {
        console.warn('Failed to sync auth session:', err);
      }
    }
    syncAuthSession();
    return () => { isMounted = false; };
  }, []);

  const switchUser = async (user) => {
    try {
      const res = await demoSwitch(user.id || user.username);
      if (res && res.user && res.token) {
        try {
          localStorage.setItem('threadpoint_token', res.token);
          localStorage.setItem('threadpoint_user', JSON.stringify(res.user));
        } catch (e) {}
        setCurrentUser(res.user);
        setToken(res.token);
        return;
      }
    } catch (err) {
      console.warn('Backend demo-switch fallback:', err);
    }

    // Client fallback
    const demoToken = `demo_jwt_token_${user.username}`;
    try {
      localStorage.setItem('threadpoint_token', demoToken);
      localStorage.setItem('threadpoint_user', JSON.stringify(user));
    } catch (e) {}
    setCurrentUser(user);
    setToken(demoToken);
  };

  const login = async (emailOrUsername, password) => {
    try {
      const res = await fetch(getApiUrl('/api/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailOrUsername, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');

      // Persist credentials synchronously before setting state
      try {
        localStorage.setItem('threadpoint_token', data.token);
        localStorage.setItem('threadpoint_user', JSON.stringify(data.user));
      } catch (e) {}

      setCurrentUser(data.user);
      setToken(data.token);
      return data;
    } catch (err) {
      const matched = demoUsers.find(
        u => u.username.toLowerCase() === emailOrUsername.toLowerCase() ||
             u.email.toLowerCase() === emailOrUsername.toLowerCase()
      );
      if (matched) {
        await switchUser(matched);
        return { user: matched, token: `demo_jwt_${matched.username}` };
      }
      throw err;
    }
  };

  const register = async (username, email, password, bio) => {
    const res = await fetch(getApiUrl('/api/auth/register'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password, bio }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Registration failed');

    // Persist credentials synchronously before setting state
    try {
      localStorage.setItem('threadpoint_token', data.token);
      localStorage.setItem('threadpoint_user', JSON.stringify(data.user));
    } catch (e) {}

    setCurrentUser(data.user);
    setToken(data.token);
    return data;
  };

  const logout = () => {
    setCurrentUser(null);
    setToken('');
    setUserVotes({});
    setBookmarkedIds(new Set());
  };

  const updateUserReputation = useCallback((newRep) => {
    if (newRep === undefined || newRep === null) return;
    setCurrentUser(prev => {
      if (!prev || prev.reputation_score === newRep) return prev;
      const updated = { ...prev, reputation_score: newRep };
      try {
        localStorage.setItem('threadpoint_user', JSON.stringify(updated));
      } catch (e) {}
      setDemoUsers(users =>
        users.map(u => (u.id === prev.id && u.reputation_score !== newRep ? { ...u, reputation_score: newRep } : u))
      );
      return updated;
    });
  }, []);

  const updateCurrentUserData = useCallback((partialData) => {
    if (!partialData) return;
    setCurrentUser(prev => {
      if (!prev) return prev;
      const updated = { ...prev, ...partialData };
      try {
        localStorage.setItem('threadpoint_user', JSON.stringify(updated));
      } catch (e) {}
      setDemoUsers(users =>
        users.map(u => (u.id === prev.id ? { ...u, ...partialData } : u))
      );
      return updated;
    });
  }, []);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        demoUsers,
        token,
        login,
        loginWithGoogle,
        register,
        logout,
        switchUser,
        updateUserReputation,
        updateCurrentUserData,
        refreshLiveScores,
        userVotes,
        setUserVotes,
        refreshUserVotes,
        bookmarkedIds,
        toggleBookmarkItem,
        refreshBookmarks,
        isAuthModalOpen,
        openAuthModal,
        closeAuthModal,
        otpModalState,
        openOtpModal,
        closeOtpModal,
        sendOtp,
        verifyOtp,
        updatePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

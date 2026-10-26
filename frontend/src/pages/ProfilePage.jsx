
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'motion/react';
import { User } from 'lucide-react';
import {
  fetchUserProfile,
  toggleFollowUser,
  fetchFollowers,
  fetchFollowing,
  updateUserProfile,
  fetchUserBadges,
} from '../api/client';
import { useAuth } from '../context/AuthContext';

// Modular Profile Components
import ProfileHeader from '../components/profile/ProfileHeader';
import ProfileSecurityCard from '../components/profile/ProfileSecurityCard';
import ProfileQuestionsTab from '../components/profile/ProfileQuestionsTab';
import ProfileAnswersTab from '../components/profile/ProfileAnswersTab';
import ProfileBadgesTab from '../components/profile/ProfileBadgesTab';
import ProfileUsersListTab from '../components/profile/ProfileUsersListTab';
import EditProfileModal from '../components/profile/EditProfileModal';

export default function ProfilePage({ userId: propUserId, onNavigate: propOnNavigate }) {
  const { username, id } = useParams();
  const navigate = useNavigate();
  const {
    currentUser,
    updateUserReputation,
    updateCurrentUserData,
    openOtpModal,
    updatePassword,
    sendOtp,
    openAuthModal,
  } = useAuth();

  const targetIdentifier = propUserId || username || id || currentUser?.username || currentUser?.id;

  const onNavigate = propOnNavigate || ((view, opts) => {
    if (view === 'feed' || view === 'questions') navigate('/feed');
    else if (view === 'question') navigate(`/questions/${opts}`);
    else if (view === 'profile') navigate(`/users/${opts || currentUser?.username || currentUser?.id || 'me'}`);
    else navigate(`/${view}`);
  });

  const [profile, setProfile] = useState(null);
  const [activeTab, setActiveTab] = useState('questions'); // 'questions' | 'answers' | 'badges' | 'followers' | 'following'
  const [loading, setLoading] = useState(Boolean(targetIdentifier));
  const [error, setError] = useState(null);

  // Follower & Following State
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  // Followers & Following Lists
  const [followers, setFollowers] = useState([]);
  const [followersLoading, setFollowersLoading] = useState(false);
  const [following, setFollowing] = useState([]);
  const [followingLoading, setFollowingLoading] = useState(false);

  // Badges State
  const [userBadges, setUserBadges] = useState([]);
  const [badgesLoading, setBadgesLoading] = useState(false);

  // Edit Profile Modal State
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [editBio, setEditBio] = useState('');
  const [editAvatarUrl, setEditAvatarUrl] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editGithubUrl, setEditGithubUrl] = useState('');
  const [editWebsiteUrl, setEditWebsiteUrl] = useState('');
  const [profileSaveLoading, setProfileSaveLoading] = useState(false);
  const [profileSaveError, setProfileSaveError] = useState('');
  const [profileSaveSuccess, setProfileSaveSuccess] = useState('');

  // Security & Password Form State
  const [isPasswordFormOpen, setIsPasswordFormOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [verifyLoading, setVerifyLoading] = useState(false);

  useEffect(() => {
    if (!targetIdentifier) {
      setLoading(false);
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError(null);

    fetchUserProfile(targetIdentifier)
      .then(data => {
        if (!isMounted) return;
        setProfile(data);
        if (data?.user) {
          setFollowerCount(data.user.follower_count || 0);
          setFollowingCount(data.user.following_count || 0);
          setIsFollowing(Boolean(data.user.is_following));

          if (currentUser?.id === data.user.id) {
            if (currentUser.reputation_score !== data.user.reputation_score) {
              updateUserReputation(data.user.reputation_score);
            }
          }
        }
      })
      .catch(err => {
        if (!isMounted) return;
        console.error('Profile fetch error:', err);
        setError(err.message || 'Failed to load user profile');
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [targetIdentifier]);

  // Load followers/following lists and badges on tab switch
  useEffect(() => {
    if (!profile?.user) return;
    const userKey = profile.user.username || profile.user.id;

    if (activeTab === 'followers') {
      setFollowersLoading(true);
      fetchFollowers(userKey)
        .then(data => setFollowers(data.followers || []))
        .catch(err => console.error('Fetch followers error:', err))
        .finally(() => setFollowersLoading(false));
    } else if (activeTab === 'following') {
      setFollowingLoading(true);
      fetchFollowing(userKey)
        .then(data => setFollowing(data.following || []))
        .catch(err => console.error('Fetch following error:', err))
        .finally(() => setFollowingLoading(false));
    } else if (activeTab === 'badges' || userBadges.length === 0) {
      setBadgesLoading(true);
      fetchUserBadges(userKey)
        .then(data => setUserBadges(data.badges || []))
        .catch(err => console.error('Fetch badges error:', err))
        .finally(() => setBadgesLoading(false));
    }
  }, [activeTab, profile?.user?.id]);

  if (!targetIdentifier && !currentUser) {
    return (
      <div className="bg-white rounded-2xl p-10 text-center border border-slate-200 max-w-md mx-auto my-12 shadow-xs">
        <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <User className="w-6 h-6" />
        </div>
        <h2 className="text-base font-bold text-slate-900 mb-1">Sign In to View Profile</h2>
        <p className="text-slate-500 text-xs mb-6">
          You need to be signed in to view your contributor profile, personal stats, and reputation score.
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => onNavigate('login')}
            className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700 transition-colors cursor-pointer"
          >
            Sign In
          </button>
          <button
            onClick={() => onNavigate('feed')}
            className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-200 transition-colors cursor-pointer"
          >
            Browse Questions
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-16 text-center border border-slate-200 max-w-md mx-auto my-12 shadow-xs">
        <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-sm font-medium text-slate-600">Loading user profile & activity...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl p-10 text-center border border-red-100 shadow-xs max-w-md mx-auto my-12">
        <p className="text-red-600 text-sm font-semibold mb-2">Failed to load profile</p>
        <p className="text-slate-500 text-xs mb-5">{error}</p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => {
              setLoading(true);
              setError(null);
              fetchUserProfile(targetIdentifier)
                .then(data => {
                  setProfile(data);
                  if (data?.user) {
                    setFollowerCount(data.user.follower_count || 0);
                    setFollowingCount(data.user.following_count || 0);
                    setIsFollowing(Boolean(data.user.is_following));

                    if (currentUser?.id === data.user.id) {
                      if (currentUser.reputation_score !== data.user.reputation_score) {
                        updateUserReputation(data.user.reputation_score);
                      }
                    }
                  }
                })
                .catch(err => setError(err.message))
                .finally(() => setLoading(false));
            }}
            className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700 transition-colors cursor-pointer"
          >
            Try Again
          </button>
          <button
            onClick={() => onNavigate('feed')}
            className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-200 transition-colors cursor-pointer"
          >
            Return to Feed
          </button>
        </div>
      </div>
    );
  }

  if (!profile || !profile.user) {
    return (
      <div className="bg-white rounded-2xl p-10 text-center border border-slate-200 max-w-md mx-auto my-12 shadow-xs">
        <p className="text-slate-800 font-semibold mb-1">User profile not found.</p>
        <p className="text-slate-500 text-xs mb-5">The requested user profile does not exist or has been deleted.</p>
        <button
          onClick={() => onNavigate('feed')}
          className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700 transition-colors cursor-pointer"
        >
          Return to Feed
        </button>
      </div>
    );
  }

  const { user, questions = [], answers = [] } = profile || {};
  const isCurrentUser = Boolean(
    currentUser && user && (
      String(currentUser.id) === String(user.id) ||
      currentUser.username?.toLowerCase() === user.username?.toLowerCase() ||
      (currentUser.email && user.email && currentUser.email.toLowerCase() === user.email.toLowerCase())
    )
  );

  const handleToggleFollow = async () => {
    if (!currentUser) {
      openAuthModal();
      return;
    }
    if (isCurrentUser) return;
    setFollowLoading(true);
    try {
      const res = await toggleFollowUser(user.username || user.id);
      setIsFollowing(res.following);
      setFollowerCount(res.follower_count);
      if (res.following_count !== undefined) {
        setFollowingCount(res.following_count);
      }
      if (activeTab === 'followers') {
        const followersRes = await fetchFollowers(user.username || user.id);
        setFollowers(followersRes.followers || []);
      }
    } catch (err) {
      console.error('Follow toggle error:', err);
    } finally {
      setFollowLoading(false);
    }
  };

  const handleTriggerOtp = async () => {
    setVerifyLoading(true);
    try {
      await sendOtp(user.email, 'email_verification');
      openOtpModal({
        email: user.email,
        onSuccess: () => {
          setProfile(prev => (prev ? {
            ...prev,
            user: { ...prev.user, is_email_verified: true },
          } : prev));
        },
      });
    } catch (err) {
      console.error('Trigger OTP error:', err);
    } finally {
      setVerifyLoading(false);
    }
  };

  const handleSetPassword = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match.');
      return;
    }

    setPasswordLoading(true);
    try {
      await updatePassword(newPassword);
      setPasswordSuccess('Password configured successfully.');
      setNewPassword('');
      setConfirmPassword('');
      setProfile(prev => (prev ? {
        ...prev,
        user: { ...prev.user, auth_provider: 'both' },
      } : prev));
      setTimeout(() => {
        setIsPasswordFormOpen(false);
        setPasswordSuccess('');
      }, 2500);
    } catch (err) {
      setPasswordError(err.message || 'Failed to update password.');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleOpenEditProfile = () => {
    setEditBio(user.bio || '');
    setEditAvatarUrl(user.avatar_url || '');
    setEditLocation(user.location || '');
    setEditGithubUrl(user.github_url || '');
    setEditWebsiteUrl(user.website_url || '');
    setProfileSaveError('');
    setProfileSaveSuccess('');
    setIsEditProfileOpen(true);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setProfileSaveLoading(true);
    setProfileSaveError('');
    setProfileSaveSuccess('');

    try {
      const res = await updateUserProfile({
        bio: editBio,
        avatar_url: editAvatarUrl,
        location: editLocation,
        github_url: editGithubUrl,
        website_url: editWebsiteUrl,
      });

      const updatedUser = res.user;
      setProfile(prev => (prev ? { ...prev, user: { ...prev.user, ...updatedUser } } : prev));
      if (updateCurrentUserData) {
        updateCurrentUserData(updatedUser);
      }
      setProfileSaveSuccess('Profile updated successfully');
      setTimeout(() => {
        setIsEditProfileOpen(false);
        setProfileSaveSuccess('');
      }, 600);
    } catch (err) {
      console.error('Save profile error:', err);
      setProfileSaveError(err.message || 'Failed to update profile');
    } finally {
      setProfileSaveLoading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-6 pb-16">
      {/* 1. Profile Header Card */}
      <ProfileHeader
        user={user}
        currentUser={currentUser}
        isCurrentUser={isCurrentUser}
        followerCount={followerCount}
        followingCount={followingCount}
        isFollowing={isFollowing}
        followLoading={followLoading}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        handleToggleFollow={handleToggleFollow}
        onOpenEditProfile={handleOpenEditProfile}
        onNavigate={onNavigate}
      />

      {/* 2. Account Security & Dual Authentication Section (Active User Only) */}
      {isCurrentUser && (
        <ProfileSecurityCard
          user={user}
          verifyLoading={verifyLoading}
          handleTriggerOtp={handleTriggerOtp}
          isPasswordFormOpen={isPasswordFormOpen}
          setIsPasswordFormOpen={setIsPasswordFormOpen}
          newPassword={newPassword}
          setNewPassword={setNewPassword}
          confirmPassword={confirmPassword}
          setConfirmPassword={setConfirmPassword}
          showNewPassword={showNewPassword}
          setShowNewPassword={setShowNewPassword}
          passwordLoading={passwordLoading}
          passwordError={passwordError}
          passwordSuccess={passwordSuccess}
          setPasswordError={setPasswordError}
          setPasswordSuccess={setPasswordSuccess}
          handleSetPassword={handleSetPassword}
        />
      )}

      {/* Activity Tabs Navigation & Content */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="flex border-b border-slate-200 bg-slate-50/50 p-2 gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('questions')}
            className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'questions'
                ? 'bg-white text-indigo-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Questions Asked ({questions.length})
          </button>
          <button
            onClick={() => setActiveTab('answers')}
            className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'answers'
                ? 'bg-white text-indigo-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Solutions & Answers ({answers.length})
          </button>
          <button
            onClick={() => setActiveTab('badges')}
            className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'badges'
                ? 'bg-white text-indigo-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Badges ({userBadges.length})
          </button>
          <button
            onClick={() => setActiveTab('followers')}
            className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'followers'
                ? 'bg-white text-indigo-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Followers ({followerCount})
          </button>
          <button
            onClick={() => setActiveTab('following')}
            className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'following'
                ? 'bg-white text-indigo-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Following ({followingCount})
          </button>
        </div>

        <div className="p-4 sm:p-6">
          <AnimatePresence mode="wait">
            {activeTab === 'questions' && (
              <ProfileQuestionsTab questions={questions} onNavigate={onNavigate} />
            )}

            {activeTab === 'answers' && (
              <ProfileAnswersTab answers={answers} onNavigate={onNavigate} />
            )}

            {activeTab === 'badges' && (
              <ProfileBadgesTab userBadges={userBadges} badgesLoading={badgesLoading} />
            )}

            {activeTab === 'followers' && (
              <ProfileUsersListTab
                users={followers}
                loading={followersLoading}
                emptyTitle="No followers yet"
                emptySubtitle={`When someone follows @${user.username}, they will appear here.`}
                tabKey="profile-followers"
                onNavigate={onNavigate}
              />
            )}

            {activeTab === 'following' && (
              <ProfileUsersListTab
                users={following}
                loading={followingLoading}
                emptyTitle="Not following anyone yet"
                emptySubtitle={`When @${user.username} follows contributors, they will appear here.`}
                tabKey="profile-following"
                onNavigate={onNavigate}
              />
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* 5. Edit Profile Modal Dialog */}
      <EditProfileModal
        isOpen={isEditProfileOpen}
        onClose={() => setIsEditProfileOpen(false)}
        editAvatarUrl={editAvatarUrl}
        setEditAvatarUrl={setEditAvatarUrl}
        editBio={editBio}
        setEditBio={setEditBio}
        editLocation={editLocation}
        setEditLocation={setEditLocation}
        editGithubUrl={editGithubUrl}
        setEditGithubUrl={setEditGithubUrl}
        editWebsiteUrl={editWebsiteUrl}
        setEditWebsiteUrl={setEditWebsiteUrl}
        profileSaveLoading={profileSaveLoading}
        profileSaveError={profileSaveError}
        profileSaveSuccess={profileSaveSuccess}
        handleSaveProfile={handleSaveProfile}
      />
    </div>
  );
}

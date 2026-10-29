import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Header from './components/layout/Header';
import Sidebar from './components/layout/Sidebar';
import CommandPalette from './components/common/CommandPalette';
import AuthModal from './components/common/AuthModal';
import OtpModal from './components/common/OtpModal';
import AccountSwitchOverlay from './components/common/AccountSwitchOverlay';

import FeedPage from './pages/FeedPage';
import QuestionDetailPage from './pages/QuestionDetailPage';
import AskPage from './pages/AskPage';
import TagsPage from './pages/TagsPage';
import LeaderboardPage from './pages/LeaderboardPage';
import ProfilePage from './pages/ProfilePage';
import BookmarksPage from './pages/BookmarksPage';
import LoginPage from './pages/LoginPage';
import SignUpPage from './pages/SignUpPage';
import SettingsPage from './pages/SettingsPage';
import FeaturesPage from './pages/FeaturesPage';

function PageMotionWrapper({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

function AnimatedRoutes({ onNavigate }) {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Navigate to="/feed" replace />} />
        <Route
          path="/feed"
          element={
            <PageMotionWrapper>
              <FeedPage onNavigate={onNavigate} />
            </PageMotionWrapper>
          }
        />
        <Route
          path="/questions"
          element={
            <PageMotionWrapper>
              <FeedPage onNavigate={onNavigate} />
            </PageMotionWrapper>
          }
        />
        <Route
          path="/questions/:id"
          element={
            <PageMotionWrapper>
              <QuestionDetailPage onNavigate={onNavigate} />
            </PageMotionWrapper>
          }
        />
        <Route
          path="/ask"
          element={
            <PageMotionWrapper>
              <AskPage onNavigate={onNavigate} />
            </PageMotionWrapper>
          }
        />
        <Route
          path="/tags"
          element={
            <PageMotionWrapper>
              <TagsPage onNavigate={onNavigate} />
            </PageMotionWrapper>
          }
        />
        <Route
          path="/bookmarks"
          element={
            <PageMotionWrapper>
              <BookmarksPage onNavigate={onNavigate} />
            </PageMotionWrapper>
          }
        />
        <Route
          path="/leaderboard"
          element={
            <PageMotionWrapper>
              <LeaderboardPage onNavigate={onNavigate} />
            </PageMotionWrapper>
          }
        />
        <Route
          path="/users/:username"
          element={
            <PageMotionWrapper>
              <ProfilePage onNavigate={onNavigate} />
            </PageMotionWrapper>
          }
        />
        <Route
          path="/profile/:username"
          element={
            <PageMotionWrapper>
              <ProfilePage onNavigate={onNavigate} />
            </PageMotionWrapper>
          }
        />
        <Route
          path="/profile"
          element={
            <PageMotionWrapper>
              <ProfilePage onNavigate={onNavigate} />
            </PageMotionWrapper>
          }
        />
        <Route
          path="/login"
          element={
            <PageMotionWrapper>
              <LoginPage />
            </PageMotionWrapper>
          }
        />
        <Route
          path="/signup"
          element={
            <PageMotionWrapper>
              <SignUpPage />
            </PageMotionWrapper>
          }
        />
        <Route
          path="/register"
          element={
            <PageMotionWrapper>
              <SignUpPage />
            </PageMotionWrapper>
          }
        />
        <Route
          path="/settings"
          element={
            <PageMotionWrapper>
              <SettingsPage onNavigate={onNavigate} />
            </PageMotionWrapper>
          }
        />
        <Route
          path="/features"
          element={
            <PageMotionWrapper>
              <FeaturesPage onNavigate={onNavigate} />
            </PageMotionWrapper>
          }
        />
        <Route
          path="/guide"
          element={
            <PageMotionWrapper>
              <FeaturesPage onNavigate={onNavigate} />
            </PageMotionWrapper>
          }
        />
        <Route
          path="/about"
          element={
            <PageMotionWrapper>
              <FeaturesPage onNavigate={onNavigate} />
            </PageMotionWrapper>
          }
        />
        <Route path="*" element={<Navigate to="/feed" replace />} />
      </Routes>
    </AnimatePresence>
  );
}

function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    currentUser,
    isAuthModalOpen,
    openAuthModal,
    closeAuthModal,
    otpModalState,
    closeOtpModal,
  } = useAuth();

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Global Ctrl+K / Cmd+K shortcut to open/toggle search command palette
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const isAuthPage = location.pathname === '/login' || location.pathname === '/signup' || location.pathname === '/register';

  const handleNavigate = (view, options) => {
    setIsMobileMenuOpen(false);

    if (view === 'question') {
      if (typeof options === 'number' || typeof options === 'string') {
        navigate(`/questions/${options}`);
      } else {
        navigate('/questions');
      }
    } else if (view === 'profile') {
      const targetUser = (typeof options === 'number' || typeof options === 'string')
        ? options
        : (currentUser?.username || currentUser?.id || 'me');
      navigate(`/users/${targetUser}`);
    } else if (view === 'feed' || view === 'questions') {
      const params = new URLSearchParams();
      if (options && typeof options === 'object') {
        if (options.sort) params.set('sort', options.sort);
        if (options.tag) params.set('tag', options.tag);
      }
      const qs = params.toString() ? `?${params.toString()}` : '';
      navigate(`/feed${qs}`);
    } else if (view === 'bookmarks') {
      navigate('/bookmarks');
    } else if (view === 'leaderboard') {
      navigate('/leaderboard');
    } else if (view === 'tags') {
      navigate('/tags');
    } else if (view === 'ask') {
      navigate('/ask');
    } else if (view === 'settings') {
      navigate('/settings');
    } else if (view === 'features' || view === 'guide' || view === 'about') {
      navigate('/features');
    } else if (view === 'login') {
      navigate('/login');
    } else if (view === 'signup' || view === 'register') {
      navigate('/signup');
    } else {
      navigate(`/${view}`);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Subtle Ambient Background Gradients */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-32 left-1/4 w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-3xl"></div>
        <div className="absolute top-1/3 -right-20 w-[500px] h-[500px] bg-emerald-500/4 rounded-full blur-3xl"></div>
      </div>

      {/* Top Header */}
      <Header
        onOpenSearch={() => setIsSearchOpen(true)}
        onNavigate={handleNavigate}
        onOpenAuth={openAuthModal}
        isMobileMenuOpen={isMobileMenuOpen}
        onToggleMobileMenu={() => setIsMobileMenuOpen(prev => !prev)}
      />

      {/* Main Layout Container */}
      <div className="flex flex-1 pt-16 relative z-10">
        {/* Left Sidebar (Desktop Static Rail + Mobile Drawer) */}
        {!isAuthPage && (
          <Sidebar
            onNavigate={handleNavigate}
            isMobileOpen={isMobileMenuOpen}
            onCloseMobile={() => setIsMobileMenuOpen(false)}
          />
        )}

        {/* Dynamic Main Content Canvas */}
        <main className={`flex-1 p-4 sm:p-6 md:p-8 min-h-[calc(100vh-4rem)] w-full min-w-0 ${!isAuthPage ? 'lg:ml-64' : ''}`}>
          <AnimatedRoutes onNavigate={handleNavigate} />
        </main>
      </div>

      {/* Overlays */}
      <CommandPalette
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onNavigate={handleNavigate}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={closeAuthModal}
      />

      <OtpModal
        isOpen={otpModalState.isOpen}
        onClose={closeOtpModal}
        email={otpModalState.email}
        purpose={otpModalState.purpose}
        onSuccess={otpModalState.onSuccess}
      />

      <AccountSwitchOverlay />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}

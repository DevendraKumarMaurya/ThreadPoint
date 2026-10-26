import React, { useState, useEffect, useRef } from 'react';
import { Bell, X, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { fetchNotifications, markNotificationRead, markAllNotificationsRead } from '../../api/client';
import { 
  isNotificationSupported, 
  getNotificationPermission, 
  requestNotificationPermission, 
  sendBrowserNotification,
  playNotificationSound 
} from '../../utils/browserNotifications';

export default function NotificationDropdown({ currentUser, onNavigate }) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [browserPermission, setBrowserPermission] = useState(() => getNotificationPermission());
  const [activeToastAlert, setActiveToastAlert] = useState(null);

  const dropdownRef = useRef(null);
  const knownNotificationIds = useRef(new Set());
  const hasInitializedRef = useRef(false);
  const toastTimeoutRef = useRef(null);

  const loadNotifications = async () => {
    if (!currentUser) return;
    try {
      const data = await fetchNotifications();
      const fetchedNotifs = data.notifications || [];
      setNotifications(fetchedNotifs);
      setUnreadCount(data.unread_count || 0);

      // On first load, record existing IDs so we do not spam alerts for past notifications
      if (!hasInitializedRef.current) {
        hasInitializedRef.current = true;
        fetchedNotifs.forEach(n => knownNotificationIds.current.add(n.id));
        return;
      }

      // Check for brand-new unread notifications
      const newItems = fetchedNotifs.filter(
        n => !n.is_read && !knownNotificationIds.current.has(n.id)
      );

      if (newItems.length > 0) {
        newItems.forEach(n => knownNotificationIds.current.add(n.id));

        // 1. Play subtle audio chime
        playNotificationSound();

        const latest = newItems[0];

        // 2. Dispatch native OS / Browser Web Notification
        sendBrowserNotification({
          title: latest.title || 'ThreadPoint Notification',
          body: latest.message || 'You have a new notification.',
          icon: latest.actor_avatar || undefined,
          tag: `tp-${latest.id}`,
          onClick: () => {
            handleNotificationClick(latest);
          }
        });

        // 3. Display in-app floating alert toast on the browser viewport
        setActiveToastAlert(latest);
        if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
        toastTimeoutRef.current = setTimeout(() => {
          setActiveToastAlert(null);
        }, 6000);
      }
    } catch (e) {
      console.error('Failed to load notifications:', e);
    }
  };

  useEffect(() => {
    if (currentUser) {
      loadNotifications();
      const interval = setInterval(loadNotifications, 25000);
      return () => clearInterval(interval);
    }
  }, [currentUser?.id]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  const handleRequestPermission = async () => {
    const perm = await requestNotificationPermission();
    setBrowserPermission(perm);
  };

  const handleNotificationClick = async (notif) => {
    if (!notif.is_read && notif.id && typeof notif.id === 'number') {
      try {
        await markNotificationRead(notif.id);
        setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, is_read: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
      } catch (err) {
        console.error('Failed to mark read:', err);
      }
    }
    setIsOpen(false);
    setActiveToastAlert(null);

    if (notif.target_type === 'question') {
      onNavigate('question', notif.target_id);
    } else if (notif.target_type === 'user') {
      onNavigate('profile', notif.actor_username || notif.actor_id);
    } else if (notif.target_id) {
      onNavigate('question', notif.target_id);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all read:', err);
    }
  };

  if (!currentUser) return null;

  return (
    <>
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => {
            setIsOpen(prev => !prev);
            if (!isOpen) loadNotifications();
          }}
          title="Notifications"
          className="relative p-2 rounded-xl text-slate-600 hover:text-indigo-600 hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold font-mono text-white ring-2 ring-white">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50"
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/50">
                <div className="flex items-center gap-2">
                  <span className="font-sans font-bold text-sm text-slate-900">Notifications</span>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-mono font-bold">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={handleMarkAllRead}
                    className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer"
                  >
                    Mark all as read
                  </button>
                )}
              </div>

              {/* Browser Alert Permission Strip */}
              {isNotificationSupported() && browserPermission !== 'granted' && (
                <div className="px-4 py-2 bg-indigo-50 border-b border-indigo-100 flex items-center justify-between text-xs">
                  <span className="text-indigo-900 text-[11px] font-medium">
                    Enable browser alerts for new votes & answers
                  </span>
                  <button
                    type="button"
                    onClick={handleRequestPermission}
                    className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-semibold transition-colors cursor-pointer shrink-0 ml-2"
                  >
                    Enable
                  </button>
                </div>
              )}

              <div className="max-h-[360px] overflow-y-auto divide-y divide-slate-100">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center">
                    <Bell className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-xs font-semibold text-slate-600">No notifications yet</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      You will receive alerts here when other developers answer, comment, accept, or follow you.
                    </p>
                  </div>
                ) : (
                  notifications.map(notif => (
                    <div
                      key={notif.id}
                      onClick={() => handleNotificationClick(notif)}
                      className={`p-3.5 hover:bg-slate-50 cursor-pointer transition-colors flex items-start gap-3 ${
                        !notif.is_read ? 'bg-indigo-50/40' : ''
                      }`}
                    >
                      <img
                        src={notif.actor_avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${notif.actor_username || 'user'}`}
                        alt=""
                        className="w-8 h-8 rounded-full object-cover shrink-0 mt-0.5"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1 mb-0.5">
                          <p className="text-xs font-bold text-slate-900 truncate">
                            {notif.title}
                          </p>
                          {!notif.is_read && (
                            <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0"></span>
                          )}
                        </div>
                        <p className="text-xs text-slate-600 leading-snug line-clamp-2">
                          {notif.message}
                        </p>
                        <span className="text-[10px] font-mono text-slate-400 mt-1 block">
                          {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · {new Date(notif.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Floating In-App Browser Alert Toast */}
      <AnimatePresence>
        {activeToastAlert && (
          <motion.div
            initial={{ opacity: 0, y: -16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed top-20 right-4 sm:right-6 z-50 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-indigo-200 p-3.5 flex items-start gap-3"
          >
            <img
              src={activeToastAlert.actor_avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${activeToastAlert.actor_username || 'user'}`}
              alt=""
              className="w-9 h-9 rounded-full object-cover shrink-0 ring-1 ring-slate-200"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1">
                <span className="text-xs font-bold text-slate-900 truncate">
                  {activeToastAlert.title || 'New Notification'}
                </span>
                <button
                  type="button"
                  onClick={() => setActiveToastAlert(null)}
                  className="text-slate-400 hover:text-slate-600 cursor-pointer p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-xs text-slate-600 mt-0.5 line-clamp-2 leading-relaxed">
                {activeToastAlert.message}
              </p>
              <div className="mt-2.5 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleNotificationClick(activeToastAlert)}
                  className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[11px] font-semibold transition-colors cursor-pointer"
                >
                  View Details
                </button>
                <button
                  type="button"
                  onClick={() => setActiveToastAlert(null)}
                  className="px-2 py-1 text-slate-500 hover:text-slate-700 text-[11px] cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

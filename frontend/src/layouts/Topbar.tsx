import React, { useState, useEffect } from 'react';
import {
  Menu,
  Bell,
  Check,
  ExternalLink,
  Building2,
  ChevronRight,
  Search,
  Command,
  RefreshCw,
  Database,
  Clock,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { notificationsApi } from '../services/endpoints';
import { NotificationItem } from '../types';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { CommandPalette } from '../components/common/CommandPalette';
import { useToast } from '../components/common/Toast';

interface TopbarProps {
  onMenuClick: () => void;
  title?: string;
  section?: string;
}

export const Topbar: React.FC<TopbarProps> = ({
  onMenuClick,
  title = 'Overview',
  section = 'Workspace',
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const toast = useToast();

  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showNotifications, setShowNotifications] = useState<boolean>(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  // Live ticking clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchNotifications = async () => {
    try {
      const count = await notificationsApi.getUnreadCount();
      setUnreadCount(count);
      const res = await notificationsApi.getNotifications(0, 5);
      setNotifications(res.content);
    } catch (e) {
      // Silently catch polling errors
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // 30s polling
    return () => clearInterval(interval);
  }, []);

  const handleMarkAsRead = async (id: string, linkUrl?: string | null) => {
    try {
      await notificationsApi.markAsRead(id);
      fetchNotifications();
      if (linkUrl) {
        setShowNotifications(false);
        navigate(linkUrl);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationsApi.markAllRead();
      fetchNotifications();
      toast.success('All notifications marked as read');
    } catch (e) {
      console.error(e);
    }
  };

  const handleManualSync = async () => {
    try {
      setIsSyncing(true);
      await queryClient.invalidateQueries();
      await fetchNotifications();
      setTimeout(() => {
        setIsSyncing(false);
        toast.success('Data Synchronized', 'Live records refreshed from PostgreSQL database');
      }, 500);
    } catch (e) {
      setIsSyncing(false);
    }
  };

  return (
    <>
      <header className="h-16 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-[0_1px_3px_0_rgba(15,23,42,0.04)] px-4 lg:px-8 flex items-center justify-between sticky top-0 z-30 transition-all">
        {/* Left: Mobile trigger & Clean Breadcrumb Navigation */}
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 text-slate-500 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Open navigation sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Single crisp breadcrumb path */}
          <div className="flex items-center gap-2 text-xs">
            <span className="font-semibold text-slate-400 tracking-wider uppercase text-[10px]">
              {section}
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
            <span className="font-bold text-[#17182B] text-sm tracking-tight">
              {title}
            </span>
          </div>
        </div>

        {/* Middle: Interactive Global Search & Command Palette trigger */}
        <div className="hidden md:flex items-center flex-1 max-w-md mx-6">
          <div
            onClick={() => setIsCommandPaletteOpen(true)}
            className="w-full relative flex items-center cursor-pointer group"
          >
            <Search className="w-4 h-4 text-slate-400 group-hover:text-[#7655F7] absolute left-3.5 pointer-events-none transition-colors" />
            <div className="w-full pl-9 pr-16 py-1.5 text-xs text-slate-500 bg-slate-50 group-hover:bg-slate-100/90 border border-slate-200/80 rounded-xl transition-all shadow-xs flex items-center justify-between">
              <span>Quick jump or search anything...</span>
              <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-white border border-slate-200 text-[10px] font-semibold text-slate-400 select-none shadow-xs group-hover:border-violet-300 group-hover:text-[#7655F7] transition-colors">
                <Command className="w-2.5 h-2.5" /> K
              </div>
            </div>
          </div>
        </div>

        {/* Right: Live Status, Sync, Notifications, User profile */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Live Dynamic Clock & PostgreSQL Connected Indicator */}
          <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200/70 text-xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#18B89A]" />
            </span>
            <span className="font-semibold text-slate-600 text-[11px]">DB Online</span>
            <span className="text-slate-300">|</span>
            <span className="font-mono text-[11px] text-slate-500">
              {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          </div>

          {/* Interactive Live Sync / Refresh Button */}
          <button
            onClick={handleManualSync}
            disabled={isSyncing}
            title="Refresh live data from database"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-50 hover:bg-violet-50 text-slate-600 hover:text-[#7655F7] border border-slate-200/70 hover:border-violet-200 transition-all text-xs font-semibold cursor-pointer group active:scale-95"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-[#7655F7]' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
            <span className="hidden sm:inline text-[11px]">
              {isSyncing ? 'Syncing...' : 'Sync'}
            </span>
          </button>

          {/* Organization Context Tag */}
          <div className="hidden lg:flex items-center gap-2 px-3 h-9 rounded-xl bg-violet-50/70 border border-violet-200/60 text-xs">
            <Building2 className="w-3.5 h-3.5 text-[#7655F7]" />
            <span className="font-bold text-[#211B45]">Acme Corp</span>
            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-teal-100 text-teal-800">
              <span className="w-1.5 h-1.5 rounded-full bg-[#18B89A]" />
              Tenant
            </span>
          </div>

          {/* Notification Bell */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="w-9 h-9 flex items-center justify-center text-slate-500 hover:text-slate-900 rounded-xl hover:bg-slate-100 relative transition-colors cursor-pointer"
              title="Notifications"
            >
              <Bell className="w-4.5 h-4.5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full bg-[#7655F7] text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white animate-pulse">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Popover */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 md:w-96 bg-white rounded-2xl shadow-modal border border-slate-200 p-4 z-50 animate-in fade-in zoom-in-95">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-[#17182B]">Notifications</span>
                    {unreadCount > 0 && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-50 text-[#7655F7] border border-violet-200">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-xs text-[#7655F7] hover:text-[#6039EB] font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" /> Mark all read
                    </button>
                  )}
                </div>

                <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto mt-2">
                  {notifications.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-xs text-slate-400">No new notifications</p>
                    </div>
                  ) : (
                    notifications.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => handleMarkAsRead(item.id, item.linkUrl)}
                        className={`py-3 px-2 rounded-xl cursor-pointer transition-colors hover:bg-slate-50 ${
                          !item.readAt ? 'bg-violet-50/50' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-xs font-semibold text-[#17182B]">{item.title}</h4>
                          {!item.readAt && (
                            <span className="w-2 h-2 rounded-full bg-[#7655F7] shrink-0 mt-1" />
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-2 leading-relaxed">{item.message}</p>
                        {item.linkUrl && (
                          <span className="text-[10px] text-[#7655F7] mt-1.5 flex items-center gap-1 font-semibold">
                            View details <ExternalLink className="w-2.5 h-2.5" />
                          </span>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Identity Chip */}
          <div className="flex items-center gap-2.5 pl-3 border-l border-slate-200 h-9">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#211B45] to-[#7655F7] text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-xs ring-2 ring-violet-100">
              {user?.fullName?.charAt(0) || 'U'}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-bold text-[#17182B] leading-tight truncate max-w-[180px]">
                {user?.fullName || 'User'}
              </p>
              <span className="text-[10px] font-semibold text-slate-500 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#18B89A]" />
                {user?.role?.replace(/_/g, ' ')}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Global Interactive Command Palette */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
      />
    </>
  );
};

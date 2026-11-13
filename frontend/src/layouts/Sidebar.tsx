import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Mail,
  ClipboardList,
  CheckSquare,
  FileText,
  CheckCircle2,
  BookOpen,
  Sparkles,
  BarChart3,
  LogOut,
  Building2,
  ShieldCheck,
  Settings,
  X,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { OnboardAiLogo } from '../components/common/OnboardAiLogo';

interface NavItemConfig {
  name: string;
  to: string;
  icon: React.ElementType;
  show: boolean;
  badge?: string;
  highlight?: boolean;
}

interface NavGroupConfig {
  title: string;
  items: NavItemConfig[];
}

export const Sidebar: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { user, logout, isHr, isManager } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navGroups: NavGroupConfig[] = [
    {
      title: 'WORKSPACE',
      items: [
        { name: 'Overview', to: '/dashboard/overview', icon: LayoutDashboard, show: true },
        { name: 'Employees', to: '/dashboard/employees', icon: Users, show: isHr || isManager },
        { name: 'Invitations', to: '/dashboard/invitations', icon: Mail, show: isHr },
        { name: 'Onboarding Plans', to: '/dashboard/plans', icon: ClipboardList, show: isHr },
        { name: 'Tasks', to: '/dashboard/tasks', icon: CheckSquare, show: true },
      ],
    },
    {
      title: 'OPERATIONS',
      items: [
        { name: 'Documents', to: '/dashboard/documents', icon: FileText, show: true },
        { name: 'Approvals', to: '/dashboard/approvals', icon: CheckCircle2, show: isHr || isManager },
        { name: 'Company Policies', to: '/dashboard/policies', icon: BookOpen, show: true },
      ],
    },
    {
      title: 'INTELLIGENCE',
      items: [
        {
          name: 'AI Assistant',
          to: '/dashboard/ai',
          icon: Sparkles,
          show: true,
          badge: 'Copilot',
          highlight: true,
        },
        { name: 'Reports', to: '/dashboard/reports', icon: BarChart3, show: isHr || isManager },
      ],
    },
    {
      title: 'ADMINISTRATION',
      items: [
        { name: 'Settings', to: '/dashboard/settings', icon: Settings, show: true },
      ],
    },
  ];

  // Clean formatted name without role duplication in parentheses
  const displayName = user?.fullName
    ? user.fullName.split('(')[0].trim()
    : 'User';

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-[#0E0A22]/60 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-[#181335] text-white border-r border-[#27204E] flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="p-4 border-b border-[#27204E] flex flex-col gap-2.5 shrink-0 bg-[#140F2E]">
          <div className="flex items-center justify-between">
            <OnboardAiLogo size="md" theme="dark" />
            <button
              onClick={onClose}
              className="lg:hidden p-1.5 text-indigo-300 hover:text-white rounded-lg hover:bg-white/10"
              aria-label="Close sidebar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Enclosed Tenant Context Badge */}
          <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-white/6 border border-white/10 text-xs text-indigo-200">
            <Building2 className="w-3.5 h-3.5 text-[#8A6DF9] shrink-0" />
            <span className="font-semibold truncate text-[11px]">Acme Corporation</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#18B89A] ml-auto shrink-0 animate-pulse" />
          </div>
        </div>

        {/* Navigation Groups */}
        <nav className="flex-1 px-3 py-3 space-y-4 overflow-y-auto">
          {navGroups.map((group) => {
            const visibleItems = group.items.filter((item) => item.show);
            if (visibleItems.length === 0) return null;

            return (
              <div key={group.title} className="space-y-1">
                {/* Section Header */}
                <div className="px-3 py-1 text-[10px] font-bold text-indigo-300/60 tracking-wider uppercase select-none">
                  {group.title}
                </div>

                {/* Items */}
                <div className="space-y-0.5">
                  {visibleItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        onClick={onClose}
                        className={({ isActive }) =>
                          `group relative flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                            isActive
                              ? 'bg-[#7655F7] text-white shadow-md shadow-violet-600/30 font-bold'
                              : item.highlight
                              ? 'text-violet-200 hover:bg-violet-600/20 hover:text-white bg-violet-500/10 border border-violet-400/20'
                              : 'text-indigo-200/80 hover:bg-white/8 hover:text-white'
                          }`
                        }
                      >
                        {({ isActive }) => (
                          <>
                            <Icon
                              className={`w-4 h-4 shrink-0 transition-colors ${
                                isActive ? 'text-white' : 'text-indigo-300/70 group-hover:text-white'
                              }`}
                            />
                            <span className="truncate">{item.name}</span>

                            {item.badge && (
                              <span
                                className={`ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider ${
                                  isActive
                                    ? 'bg-white/20 text-white'
                                    : 'bg-[#7655F7]/30 text-violet-200 border border-violet-400/30'
                                }`}
                              >
                                {item.badge}
                              </span>
                            )}
                          </>
                        )}
                      </NavLink>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        {/* User Card & Logout (Bottom) */}
        <div className="p-3 border-t border-[#27204E] bg-[#140F2E]/70 shrink-0">
          <div className="p-2.5 rounded-xl border border-white/10 bg-white/6 backdrop-blur-sm flex items-center justify-between gap-2 shadow-xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="relative">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#7655F7] to-[#A18BFF] text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-sm">
                  {displayName.charAt(0) || 'U'}
                </div>
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-[#18B89A] ring-2 ring-[#181335]" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-white truncate">{displayName}</p>
                <p className="text-[10px] text-indigo-300/80 font-medium truncate flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-[#18B89A] inline shrink-0" />
                  <span>{user?.role?.replace(/_/g, ' ')}</span>
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Sign out of account"
              className="p-1.5 text-indigo-300 hover:text-rose-400 hover:bg-rose-500/20 rounded-lg transition-colors shrink-0 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

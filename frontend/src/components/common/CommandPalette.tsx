import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
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
  Settings,
  ArrowRight,
  Command,
  X,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const { isHr, isManager } = useAuth();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) {
          onClose();
        } else {
          // Open handled by parent or listener
        }
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const allItems = [
    { name: 'Overview Dashboard', path: '/dashboard/overview', icon: LayoutDashboard, category: 'Navigation' },
    { name: 'Employees Directory', path: '/dashboard/employees', icon: Users, category: 'Navigation', visible: isHr || isManager },
    { name: 'Invitations & New Hires', path: '/dashboard/invitations', icon: Mail, category: 'Navigation', visible: isHr },
    { name: 'Onboarding Plans', path: '/dashboard/plans', icon: ClipboardList, category: 'Navigation', visible: isHr },
    { name: 'Tasks & Checklist', path: '/dashboard/tasks', icon: CheckSquare, category: 'Navigation' },
    { name: 'Document Center', path: '/dashboard/documents', icon: FileText, category: 'Operations' },
    { name: 'Approvals Inbox', path: '/dashboard/approvals', icon: CheckCircle2, category: 'Operations', visible: isHr || isManager },
    { name: 'Company Policies (RAG)', path: '/dashboard/policies', icon: BookOpen, category: 'Operations' },
    { name: 'AI Copilot & Assistant', path: '/dashboard/ai', icon: Sparkles, category: 'AI Intelligence' },
    { name: 'Analytics & Reports', path: '/dashboard/reports', icon: BarChart3, category: 'AI Intelligence', visible: isHr || isManager },
    { name: 'Organization Settings', path: '/dashboard/settings', icon: Settings, category: 'Administration' },
  ].filter((item) => item.visible !== false);

  const filteredItems = query.trim() === ''
    ? allItems
    : allItems.filter(
        (item) =>
          item.name.toLowerCase().includes(query.toLowerCase()) ||
          item.category.toLowerCase().includes(query.toLowerCase())
      );

  const handleSelect = (path: string) => {
    navigate(path);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-[#0E0A22]/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="w-full max-w-xl bg-white rounded-2xl shadow-modal border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="p-4 border-b border-slate-100 flex items-center gap-3">
          <Search className="w-5 h-5 text-[#7655F7] shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a page, command, or feature..."
            className="flex-1 text-sm text-[#17182B] placeholder:text-slate-400 focus:outline-none bg-transparent font-medium"
          />
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {filteredItems.length === 0 ? (
            <div className="text-center py-10 text-xs text-slate-400">
              No matching pages or tools found for "{query}"
            </div>
          ) : (
            filteredItems.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.path}
                  onClick={() => handleSelect(item.path)}
                  className="flex items-center justify-between px-3.5 py-2.5 rounded-xl cursor-pointer hover:bg-violet-50/70 text-slate-700 hover:text-[#7655F7] transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 group-hover:bg-violet-100/80 text-slate-600 group-hover:text-[#7655F7] flex items-center justify-center transition-colors">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#17182B] group-hover:text-[#7655F7] transition-colors">
                        {item.name}
                      </p>
                      <span className="text-[10px] text-slate-400 font-semibold">{item.category}</span>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-[#7655F7] group-hover:translate-x-0.5 transition-all" />
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-medium">
          <div className="flex items-center gap-3">
            <span>Navigation: <kbd className="px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-600">↑</kbd> <kbd className="px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-600">↓</kbd></span>
            <span>Select: <kbd className="px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-600">↵</kbd></span>
          </div>
          <span>Close: <kbd className="px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-600">ESC</kbd></span>
        </div>
      </div>
    </div>
  );
};


import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { AiCopilotWidget } from '../components/common/AiCopilotWidget';

export const DashboardLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const getPageContext = (pathname: string): { title: string; section: string } => {
    if (pathname.includes('/overview')) {
      return { title: 'Overview Dashboard', section: 'Workspace' };
    }
    if (pathname.includes('/employees')) {
      return { title: 'Employee Directory', section: 'Workspace' };
    }
    if (pathname.includes('/invitations')) {
      return { title: 'Invitation Management', section: 'Workspace' };
    }
    if (pathname.includes('/plans')) {
      return { title: 'Onboarding Plans', section: 'Workspace' };
    }
    if (pathname.includes('/tasks')) {
      return { title: 'Task Management', section: 'Workspace' };
    }
    if (pathname.includes('/documents')) {
      return { title: 'Document Center', section: 'Operations' };
    }
    if (pathname.includes('/approvals')) {
      return { title: 'Approvals Inbox', section: 'Operations' };
    }
    if (pathname.includes('/policies')) {
      return { title: 'Company Policies', section: 'Operations' };
    }
    if (pathname.includes('/ai')) {
      return { title: 'AI Assistant & Copilot', section: 'Intelligence' };
    }
    if (pathname.includes('/reports')) {
      return { title: 'Analytics & Compliance Reports', section: 'Intelligence' };
    }
    if (pathname.includes('/settings')) {
      return { title: 'Organization & Settings', section: 'Administration' };
    }
    return { title: 'Dashboard', section: 'Workspace' };
  };

  const { title, section } = getPageContext(location.pathname);

  return (
    <div className="min-h-screen bg-[#EEF2F6] flex relative">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-h-screen overflow-x-hidden">
        <Topbar
          onMenuClick={() => setSidebarOpen(true)}
          title={title}
          section={section}
        />
        <main className="flex-1 p-5 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto pb-24">
          <Outlet />
        </main>
      </div>

      {/* Floating AI Assistant Copilot Launcher */}
      <AiCopilotWidget />
    </div>
  );
};

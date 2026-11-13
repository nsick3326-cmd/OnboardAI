import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { LoginPage } from '../pages/LoginPage';
import { OverviewPage } from '../pages/OverviewPage';
import { EmployeesPage } from '../pages/EmployeesPage';
import { PlansPage } from '../pages/PlansPage';
import { TasksPage } from '../pages/TasksPage';
import { DocumentsPage } from '../pages/DocumentsPage';
import { ApprovalsPage } from '../pages/ApprovalsPage';
import { PoliciesPage } from '../pages/PoliciesPage';
import { AiAssistantPage } from '../pages/AiAssistantPage';
import { ReportsPage } from '../pages/ReportsPage';
import { SettingsPage } from '../pages/SettingsPage';
import { InvitationsPage } from '../pages/InvitationsPage';
import { AcceptInvitationPage } from '../pages/AcceptInvitationPage';
import { SetupWorkspacePage } from '../pages/SetupWorkspacePage';
import { Role } from '../types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: Role[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin" />
          <p className="text-sm font-medium text-slate-500">Loading OnboardAI...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard/overview" replace />;
  }

  return <>{children}</>;
};

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/invitations/accept" element={<AcceptInvitationPage />} />
      <Route path="/setup-workspace" element={<SetupWorkspacePage />} />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard/overview" replace />} />
        <Route path="overview" element={<OverviewPage />} />
        
        {/* HR and Manager restricted routes */}
        <Route
          path="employees"
          element={
            <ProtectedRoute allowedRoles={['HR_ADMIN', 'HR_MANAGER', 'MANAGER']}>
              <EmployeesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="invitations"
          element={
            <ProtectedRoute allowedRoles={['HR_ADMIN', 'HR_MANAGER']}>
              <InvitationsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="plans"
          element={
            <ProtectedRoute allowedRoles={['HR_ADMIN', 'HR_MANAGER']}>
              <PlansPage />
            </ProtectedRoute>
          }
        />
        <Route path="tasks" element={<TasksPage />} />
        <Route path="documents" element={<DocumentsPage />} />
        <Route
          path="approvals"
          element={
            <ProtectedRoute allowedRoles={['HR_ADMIN', 'HR_MANAGER', 'MANAGER']}>
              <ApprovalsPage />
            </ProtectedRoute>
          }
        />
        <Route path="policies" element={<PoliciesPage />} />
        <Route path="ai" element={<AiAssistantPage />} />
        <Route
          path="reports"
          element={
            <ProtectedRoute allowedRoles={['HR_ADMIN', 'HR_MANAGER', 'MANAGER']}>
              <ReportsPage />
            </ProtectedRoute>
          }
        />
        <Route path="settings" element={<SettingsPage />} />
      </Route>

      <Route path="/" element={<Navigate to="/dashboard/overview" replace />} />
      <Route path="*" element={<Navigate to="/dashboard/overview" replace />} />
    </Routes>
  );
};

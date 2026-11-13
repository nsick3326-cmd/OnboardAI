import { api } from './api';
import {
  ApiResponse,
  PagedResponse,
  UserSummary,
  Employee,
  OnboardingPlan,
  OnboardingAssignment,
  OnboardingTask,
  DocumentItem,
  ApprovalItem,
  CompanyPolicy,
  OverviewMetrics,
  OnboardingTrend,
  DepartmentBreakdown,
  NotificationItem,
  AuditLogItem,
  DocumentExtractionResult,
  ChecklistGenerationResult,
  ChecklistSuggestion,
  PolicyAnswerResult,
  CopilotAnswerResult,
  TaskCategory,
  TaskStatus,
  DocumentVerificationStatus,
  ApprovalStatus,
  OnboardingStatus,
  Role,
  InvitationItem,
  InvitationStatus,
  CreateInvitationRequest,
  AcceptInvitationRequest,
  InvitationValidationResponse,
  SetupWorkspaceRequest,
  SetupWorkspaceResponse,
  SetupStatusResponse,
} from '../types';

export const authApi = {
  login: async (email: string, password: string, selectedRole?: Role) => {
    const res = await api.post<ApiResponse<{ token: string; user: UserSummary }>>('/auth/login', {
      email,
      password,
      selectedRole,
    });
    return res.data.data;
  },
  resetPassword: async (email: string, newPassword: string) => {
    const res = await api.post<ApiResponse<string>>('/auth/reset-password', { email, newPassword });
    return res.data;
  },
  getSetupStatus: async () => {
    const res = await api.get<ApiResponse<SetupStatusResponse>>('/auth/setup-status');
    return res.data.data;
  },
  setupWorkspace: async (data: SetupWorkspaceRequest) => {
    const res = await api.post<ApiResponse<SetupWorkspaceResponse>>('/auth/setup-workspace', data);
    return res.data.data;
  },
  me: async () => {
    const res = await api.get<ApiResponse<UserSummary>>('/auth/me');
    return res.data.data;
  },
  logout: async () => {
    const res = await api.post<ApiResponse<string>>('/auth/logout');
    return res.data;
  },
};

export const invitationsApi = {
  create: async (data: CreateInvitationRequest) => {
    const res = await api.post<InvitationItem>('/invitations', data);
    return res.data;
  },
  getInvitations: async (params?: { status?: InvitationStatus; search?: string; page?: number; size?: number }) => {
    const res = await api.get<PagedResponse<InvitationItem>>('/invitations', { params });
    return res.data;
  },
  getInvitationById: async (id: string) => {
    const res = await api.get<InvitationItem>(`/invitations/${id}`);
    return res.data;
  },
  resend: async (id: string) => {
    const res = await api.post<InvitationItem>(`/invitations/${id}/resend`);
    return res.data;
  },
  revoke: async (id: string) => {
    const res = await api.post<InvitationItem>(`/invitations/${id}/revoke`);
    return res.data;
  },
  validateToken: async (token: string) => {
    const res = await api.get<InvitationValidationResponse>('/invitations/validate', { params: { token } });
    return res.data;
  },
  accept: async (data: AcceptInvitationRequest) => {
    const res = await api.post<InvitationItem>('/invitations/accept', data);
    return res.data;
  },
};

export const employeesApi = {
  getEmployees: async (params?: { department?: string; status?: OnboardingStatus; managerId?: string; search?: string; page?: number; size?: number }) => {
    const res = await api.get<ApiResponse<PagedResponse<Employee>>>('/employees', { params });
    return res.data.data;
  },
  getEmployeeById: async (id: string) => {
    const res = await api.get<ApiResponse<Employee>>(`/employees/${id}`);
    return res.data.data;
  },
  createEmployee: async (data: {
    fullName: string;
    email: string;
    employeeCode: string;
    department: string;
    jobTitle: string;
    managerId?: string | null;
    employmentStartDate: string;
    onboardingPlanId?: string | null;
  }) => {
    const res = await api.post<ApiResponse<Employee>>('/employees', data);
    return res.data.data;
  },
  updateEmployee: async (id: string, data: Partial<Employee>) => {
    const res = await api.put<ApiResponse<Employee>>(`/employees/${id}`, data);
    return res.data.data;
  },
  updateStatus: async (id: string, status: OnboardingStatus) => {
    const res = await api.patch<ApiResponse<Employee>>(`/employees/${id}/status`, { status });
    return res.data.data;
  },
  deactivateEmployee: async (id: string) => {
    const res = await api.delete<ApiResponse<string>>(`/employees/${id}`);
    return res.data;
  },
};

export const plansApi = {
  getPlans: async (page = 0, size = 15) => {
    const res = await api.get<ApiResponse<PagedResponse<OnboardingPlan>>>('/onboarding-plans', { params: { page, size } });
    return res.data.data;
  },
  getActivePlans: async () => {
    const res = await api.get<ApiResponse<OnboardingPlan[]>>('/onboarding-plans/active');
    return res.data.data;
  },
  getPlanById: async (id: string) => {
    const res = await api.get<ApiResponse<OnboardingPlan>>(`/onboarding-plans/${id}`);
    return res.data.data;
  },
  createPlan: async (data: any) => {
    const res = await api.post<ApiResponse<OnboardingPlan>>('/onboarding-plans', data);
    return res.data.data;
  },
  assignPlan: async (planId: string, employeeId: string, startDate?: string) => {
    const res = await api.post<ApiResponse<OnboardingAssignment>>(`/onboarding-plans/${planId}/assignments`, { employeeId, startDate });
    return res.data.data;
  },
  getEmployeeAssignment: async (employeeId: string) => {
    const res = await api.get<ApiResponse<OnboardingAssignment>>(`/employees/${employeeId}/onboarding`);
    return res.data.data;
  },
};

export const tasksApi = {
  getTasks: async (params?: { employeeId?: string; category?: TaskCategory; status?: TaskStatus; overdue?: boolean; page?: number; size?: number }) => {
    const res = await api.get<ApiResponse<PagedResponse<OnboardingTask>>>('/tasks', { params });
    return res.data.data;
  },
  getTaskById: async (id: string) => {
    const res = await api.get<ApiResponse<OnboardingTask>>(`/tasks/${id}`);
    return res.data.data;
  },
  updateTaskStatus: async (id: string, status: TaskStatus, comments?: string) => {
    const res = await api.patch<ApiResponse<OnboardingTask>>(`/tasks/${id}/status`, { status, comments });
    return res.data.data;
  },
  createTask: async (data: any) => {
    const res = await api.post<ApiResponse<OnboardingTask>>('/tasks', data);
    return res.data.data;
  },
};

export const documentsApi = {
  getEmployeeDocuments: async (employeeId: string) => {
    const res = await api.get<ApiResponse<DocumentItem[]>>(`/employees/${employeeId}/documents`);
    return res.data.data;
  },
  getAllDocuments: async (status?: DocumentVerificationStatus, page = 0, size = 15) => {
    const res = await api.get<ApiResponse<PagedResponse<DocumentItem>>>('/documents', { params: { status, page, size } });
    return res.data.data;
  },
  getDocumentById: async (id: string) => {
    const res = await api.get<ApiResponse<DocumentItem>>(`/documents/${id}`);
    return res.data.data;
  },
  uploadDocument: async (employeeId: string, documentType: string, file: File) => {
    const formData = new FormData();
    formData.append('documentType', documentType);
    formData.append('file', file);
    const res = await api.post<ApiResponse<DocumentItem>>(`/employees/${employeeId}/documents`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.data;
  },
  downloadDocumentUrl: (id: string) => `/api/v1/documents/${id}/download`,
  verifyDocument: async (id: string) => {
    const res = await api.post<ApiResponse<DocumentItem>>(`/documents/${id}/verify`);
    return res.data.data;
  },
  rejectDocument: async (id: string, reason: string) => {
    const res = await api.post<ApiResponse<DocumentItem>>(`/documents/${id}/reject`, { reason });
    return res.data.data;
  },
};

export const approvalsApi = {
  getApprovals: async (status?: ApprovalStatus, page = 0, size = 15) => {
    const res = await api.get<ApiResponse<PagedResponse<ApprovalItem>>>('/approvals', { params: { status, page, size } });
    return res.data.data;
  },
  approve: async (id: string, comments = 'Approved') => {
    const res = await api.post<ApiResponse<ApprovalItem>>(`/approvals/${id}/approve`, { comments });
    return res.data.data;
  },
  reject: async (id: string, comments: string) => {
    const res = await api.post<ApiResponse<ApprovalItem>>(`/approvals/${id}/reject`, { comments });
    return res.data.data;
  },
};

export const policiesApi = {
  getPolicies: async (page = 0, size = 15) => {
    const res = await api.get<ApiResponse<PagedResponse<CompanyPolicy>>>('/policies', { params: { page, size } });
    return res.data.data;
  },
  getPolicyById: async (id: string) => {
    const res = await api.get<ApiResponse<CompanyPolicy>>(`/policies/${id}`);
    return res.data.data;
  },
  createPolicy: async (data: { title: string; category: string; description?: string; content: string }) => {
    const res = await api.post<ApiResponse<CompanyPolicy>>('/policies', data);
    return res.data.data;
  },
  publishPolicy: async (id: string) => {
    const res = await api.post<ApiResponse<CompanyPolicy>>(`/policies/${id}/publish`);
    return res.data.data;
  },
};

export const aiApi = {
  extractDocument: async (documentId: string) => {
    const res = await api.post<ApiResponse<DocumentExtractionResult>>(`/ai/documents/${documentId}/extract`);
    return res.data.data;
  },
  generateChecklist: async (employeeId: string, additionalFocus?: string) => {
    const res = await api.post<ApiResponse<ChecklistGenerationResult>>('/ai/onboarding-checklists/generate', {
      employeeId,
      additionalFocus,
    });
    return res.data.data;
  },
  approveChecklist: async (employeeId: string, selectedSuggestions: ChecklistSuggestion[]) => {
    const res = await api.post<ApiResponse<OnboardingTask[]>>(`/ai/onboarding-checklists/${employeeId}/approve`, {
      selectedSuggestions,
    });
    return res.data.data;
  },
  askPolicyAssistant: async (question: string) => {
    const res = await api.post<ApiResponse<PolicyAnswerResult>>('/ai/policy-assistant/ask', { question });
    return res.data.data;
  },
  askCopilot: async (question: string, taskId?: string) => {
    const res = await api.post<ApiResponse<CopilotAnswerResult>>('/ai/onboarding-copilot/ask', { question, taskId });
    return res.data.data;
  },
};

export const analyticsApi = {
  getOverview: async () => {
    const res = await api.get<ApiResponse<OverviewMetrics>>('/analytics/overview');
    return res.data.data;
  },
  getTrends: async () => {
    const res = await api.get<ApiResponse<OnboardingTrend[]>>('/analytics/onboarding-trends');
    return res.data.data;
  },
  getTaskBreakdown: async () => {
    const res = await api.get<ApiResponse<DepartmentBreakdown[]>>('/analytics/task-breakdown');
    return res.data.data;
  },
};

export const notificationsApi = {
  getNotifications: async (page = 0, size = 15) => {
    const res = await api.get<ApiResponse<PagedResponse<NotificationItem>>>('/notifications', { params: { page, size } });
    return res.data.data;
  },
  getUnreadCount: async () => {
    const res = await api.get<ApiResponse<{ unreadCount: number }>>('/notifications/unread-count');
    return res.data.data.unreadCount;
  },
  markAsRead: async (id: string) => {
    const res = await api.patch<ApiResponse<NotificationItem>>(`/notifications/${id}/read`);
    return res.data.data;
  },
  markAllRead: async () => {
    const res = await api.post<ApiResponse<string>>('/notifications/mark-all-read');
    return res.data;
  },
};

export const auditApi = {
  getLogs: async (page = 0, size = 20) => {
    const res = await api.get<ApiResponse<PagedResponse<AuditLogItem>>>('/audit-logs', { params: { page, size } });
    return res.data.data;
  },
};

export type Role = 'HR_ADMIN' | 'HR_MANAGER' | 'MANAGER' | 'EMPLOYEE';

export interface UserSummary {
  id: string;
  organizationId: string;
  fullName: string;
  email: string;
  role: Role;
  employeeId?: string | null;
}

export type OnboardingStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'BLOCKED' | 'COMPLETED';

export interface Employee {
  id: string;
  organizationId: string;
  userId?: string | null;
  fullName?: string;
  email?: string;
  phoneNumber?: string;
  employmentType?: string;
  employeeCode: string;
  department: string;
  jobTitle: string;
  managerId?: string | null;
  managerName?: string;
  employmentStartDate: string;
  onboardingStatus: OnboardingStatus;
  invitationStatus?: string;
  completionPercentage: number;
  createdAt: string;
}

export type TaskCategory = 'DOCUMENTATION' | 'IT_SETUP' | 'TRAINING' | 'COMPLIANCE' | 'HR_MEETING' | 'GENERAL';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type TaskStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'BLOCKED' | 'COMPLETED';

export interface OnboardingTask {
  id: string;
  organizationId: string;
  assignmentId: string;
  employeeId: string;
  employeeName?: string;
  title: string;
  description?: string;
  category: TaskCategory;
  priority: TaskPriority;
  assignedToUserId?: string | null;
  dueDate?: string;
  status: TaskStatus;
  required: boolean;
  documentRequired: boolean;
  completedAt?: string | null;
  comments?: string | null;
  overdue: boolean;
  createdAt: string;
}

export interface PlanTaskTemplate {
  id?: string;
  title: string;
  description?: string;
  category: TaskCategory;
  relativeDueDays: number;
  required: boolean;
  responsibleRole: string;
  documentRequired: boolean;
  orderIndex?: number;
}

export interface OnboardingPlan {
  id: string;
  organizationId: string;
  name: string;
  description?: string;
  targetRole?: string;
  department?: string;
  active: boolean;
  taskCount: number;
  tasks?: PlanTaskTemplate[];
  createdAt: string;
}

export interface OnboardingAssignment {
  id: string;
  organizationId: string;
  employeeId: string;
  employeeName?: string;
  planId: string;
  planName?: string;
  assignedAt: string;
  startDate: string;
  dueDate?: string;
  status: OnboardingStatus;
  completionPercentage: number;
  totalTasks: number;
  completedTasks: number;
}

export type DocumentVerificationStatus = 'PENDING' | 'VERIFIED' | 'REJECTED';

export interface DocumentItem {
  id: string;
  organizationId: string;
  employeeId: string;
  employeeName?: string;
  documentType: string;
  originalFilename: string;
  contentType: string;
  fileSize: number;
  verificationStatus: DocumentVerificationStatus;
  rejectionReason?: string | null;
  extractedMetadata?: string | null;
  uploadedBy: string;
  uploadedByName?: string;
  verifiedBy?: string | null;
  verifiedAt?: string | null;
  createdAt: string;
}

export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface ApprovalItem {
  id: string;
  organizationId: string;
  employeeId: string;
  employeeName?: string;
  relatedDocumentId?: string | null;
  documentName?: string | null;
  taskId?: string | null;
  taskTitle?: string | null;
  requestedBy: string;
  requestedByName?: string;
  approverId?: string | null;
  approverName?: string | null;
  status: ApprovalStatus;
  comments?: string | null;
  decisionAt?: string | null;
  createdAt: string;
}

export interface CompanyPolicy {
  id: string;
  organizationId: string;
  title: string;
  category: string;
  description?: string;
  content: string;
  status: string;
  uploadedBy: string;
  chunkCount: number;
  createdAt: string;
}

export interface DocumentExtractionResult {
  documentType: string;
  candidateName: string;
  institutionOrEmployer: string;
  documentNumber: string;
  issueDate: string;
  expirationDate: string;
  confidence: number;
  summary: string;
  extractedFields: Record<string, string>;
  provider: string;
  fallback: boolean;
}

export interface ChecklistSuggestion {
  id: string;
  title: string;
  description: string;
  category: TaskCategory;
  priority: TaskPriority;
  relativeDueDays: number;
  rationale: string;
  required: boolean;
  documentRequired: boolean;
}

export interface ChecklistGenerationResult {
  employeeId: string;
  employeeName: string;
  role: string;
  department: string;
  suggestions: ChecklistSuggestion[];
  provider: string;
  fallback: boolean;
}

export interface PolicyCitation {
  policyId?: string;
  policyTitle: string;
  sectionTitle?: string;
  snippet: string;
}

export interface PolicyAnswerResult {
  question: string;
  answer: string;
  citations: PolicyCitation[];
  provider: string;
  fallback: boolean;
}

export interface CopilotAnswerResult {
  question: string;
  answer: string;
  suggestedNextSteps: string[];
  provider: string;
  fallback: boolean;
}

export interface OverviewMetrics {
  totalEmployees: number;
  employeesOnboarding: number;
  completedOnboardings: number;
  onboardingCompletionRate: number;
  tasksCompleted: number;
  tasksPending: number;
  tasksOverdue: number;
  pendingDocumentVerifications: number;
  pendingApprovals: number;
}

export interface OnboardingTrend {
  label: string;
  newJoiners: number;
  completed: number;
}

export interface DepartmentBreakdown {
  department: string;
  total: number;
  inProgress: number;
  completed: number;
  completionRate: number;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  linkUrl?: string | null;
  readAt?: string | null;
  createdAt: string;
}

export interface AuditLogItem {
  id: string;
  actorUserId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  details?: string | null;
  createdAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  errors?: string[];
  timestamp: string;
}

export interface PagedResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

export type InvitationStatus = 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'REVOKED';

export type EmploymentType = 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERNSHIP';

export interface InvitationItem {
  id: string;
  organizationId: string;
  employeeId?: string | null;
  fullName: string;
  email: string;
  phoneNumber?: string | null;
  department: string;
  jobTitle: string;
  role: Role;
  employmentType?: string;
  status: InvitationStatus;
  expiresAt: string;
  acceptedAt?: string | null;
  invitedByUserId?: string | null;
  invitedByName?: string | null;
  createdAt: string;
  activationLink?: string | null;
  emailSent?: boolean;
  emailStatus?: string | null;
}

export interface CreateInvitationRequest {
  fullName: string;
  email: string;
  phoneNumber?: string;
  department: string;
  jobTitle: string;
  employmentStartDate: string;
  managerId?: string | null;
  employmentType?: string;
  role?: Role;
  employeeCode?: string;
  onboardingPlanId?: string | null;
}

export interface InvitationValidationResponse {
  valid: boolean;
  invitationId?: string;
  fullName?: string;
  email?: string;
  department?: string;
  jobTitle?: string;
  role?: Role;
  employmentType?: string;
  organizationName?: string;
  expiresAt?: string;
  status?: InvitationStatus;
  message?: string;
}

export interface AcceptInvitationRequest {
  token: string;
  password: string;
}

export interface SetupWorkspaceRequest {
  organizationName: string;
  domain?: string;
  adminFullName: string;
  adminEmail: string;
  adminPassword: string;
  setupKey?: string;
}

export interface SetupWorkspaceResponse {
  organizationId: string;
  organizationName: string;
  adminUserId: string;
  adminFullName: string;
  adminEmail: string;
  token?: string;
  message: string;
}

export interface SetupStatusResponse {
  initialSetupAllowed: boolean;
  userCount: number;
  organizationCount: number;
  message: string;
}

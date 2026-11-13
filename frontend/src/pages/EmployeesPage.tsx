import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { employeesApi, plansApi, invitationsApi } from '../services/endpoints';
import { useAuth } from '../hooks/useAuth';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Select } from '../components/common/Select';
import { Modal } from '../components/common/Modal';
import { StatusBadge } from '../components/common/Badge';
import { TableSkeleton } from '../components/common/Skeleton';
import { EmptyState } from '../components/common/EmptyState';
import { Employee, OnboardingStatus, Role, InvitationItem } from '../types';
import {
  Users,
  UserPlus,
  Mail,
  Search,
  Filter,
  Eye,
  Trash2,
  Calendar,
  Briefcase,
  ShieldAlert,
  ShieldCheck,
  Check,
  Copy,
  CheckCircle2,
  ExternalLink,
  Clock,
  Phone,
} from 'lucide-react';

export const EmployeesPage: React.FC = () => {
  const { isHr, isHrAdmin } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('');
  const [status, setStatus] = useState<string>('');
  const [page, setPage] = useState(0);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [createdSuccessInvitation, setCreatedSuccessInvitation] = useState<InvitationItem | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    department: 'Engineering',
    jobTitle: '',
    employmentStartDate: new Date().toISOString().split('T')[0],
    employmentType: 'FULL_TIME',
    role: 'EMPLOYEE' as Role,
    managerId: '',
    onboardingPlanId: '',
  });

  const { data: employeesData, isLoading } = useQuery({
    queryKey: ['employees', search, department, status, page],
    queryFn: () =>
      employeesApi.getEmployees({
        search: search || undefined,
        department: department || undefined,
        status: (status as OnboardingStatus) || undefined,
        page,
        size: 10,
      }),
  });

  const { data: allEmployees } = useQuery({
    queryKey: ['all-employees-managers'],
    queryFn: () => employeesApi.getEmployees({ size: 100 }),
    enabled: isAddModalOpen,
  });

  const { data: activePlans } = useQuery({
    queryKey: ['active-plans'],
    queryFn: plansApi.getActivePlans,
  });

  const createMutation = useMutation({
    mutationFn: invitationsApi.create,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['invitations'] });
      queryClient.invalidateQueries({ queryKey: ['analytics-overview'] });
      setIsAddModalOpen(false);
      setCreatedSuccessInvitation(data);
      setFormData({
        fullName: '',
        email: '',
        phoneNumber: '',
        department: 'Engineering',
        jobTitle: '',
        employmentStartDate: new Date().toISOString().split('T')[0],
        employmentType: 'FULL_TIME',
        role: 'EMPLOYEE',
        managerId: '',
        onboardingPlanId: '',
      });
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: employeesApi.deactivateEmployee,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['analytics-overview'] });
      setSelectedEmployee(null);
    },
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      fullName: formData.fullName,
      email: formData.email,
      phoneNumber: formData.phoneNumber || undefined,
      department: formData.department,
      jobTitle: formData.jobTitle,
      employmentStartDate: formData.employmentStartDate,
      employmentType: formData.employmentType,
      role: formData.role,
      managerId: formData.managerId || null,
      onboardingPlanId: formData.onboardingPlanId || null,
    });
  };

  const handleCopyLink = (link?: string | null) => {
    if (!link) return;
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-navy-900 tracking-tight">Employee Directory</h2>
          <p className="text-xs text-slate-500 mt-0.5">Manage new joiners, team assignments, and onboarding lifecycles</p>
        </div>
        {isHr && (
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              leftIcon={<Mail className="w-4 h-4 text-violet-600" />}
              onClick={() => navigate('/dashboard/invitations')}
            >
              Manage Invitations
            </Button>
            <Button
              variant="violet"
              leftIcon={<UserPlus className="w-4 h-4" />}
              onClick={() => setIsAddModalOpen(true)}
            >
              Add Employee
            </Button>
          </div>
        )}
      </div>

      {/* Filter and search controls */}
      <Card className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search by code, title..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
              className="w-full pl-9 pr-3.5 py-2 text-sm text-navy-900 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>

          <select
            value={department}
            onChange={(e) => {
              setDepartment(e.target.value);
              setPage(0);
            }}
            className="w-full px-3.5 py-2 text-sm text-navy-900 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
          >
            <option value="">All Departments</option>
            <option value="Engineering">Engineering</option>
            <option value="Product & Design">Product & Design</option>
            <option value="Human Resources">Human Resources</option>
            <option value="Operations">Operations</option>
            <option value="Sales">Sales</option>
          </select>

          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(0);
            }}
            className="w-full px-3.5 py-2 text-sm text-navy-900 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
          >
            <option value="">All Statuses</option>
            <option value="NOT_STARTED">Not Started</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
            <option value="BLOCKED">Blocked</option>
          </select>
        </div>
      </Card>

      {/* Employees Table */}
      <Card>
        {isLoading ? (
          <TableSkeleton rows={5} />
        ) : !employeesData?.content || employeesData.content.length === 0 ? (
          <EmptyState
            icon={<Users className="w-10 h-10 text-slate-300" />}
            title="No employees found"
            description="Try modifying your search filter criteria or create a new employee profile."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Department & Role</th>
                  <th className="py-3 px-4">Start Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Progress</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {employeesData.content.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50/50 transition-standard">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-violet-100 text-violet-700 font-bold flex items-center justify-center text-xs shrink-0">
                          {emp.fullName?.charAt(0) || emp.employeeCode.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <p className="font-semibold text-navy-900">{emp.fullName || emp.employeeCode}</p>
                            {emp.invitationStatus === 'PENDING' && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                                <Clock className="w-2.5 h-2.5" />
                                Pending Activation
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400">{emp.email || emp.employeeCode}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-medium text-navy-900">{emp.jobTitle}</p>
                      <p className="text-[11px] text-slate-500">{emp.department}</p>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">{emp.employmentStartDate}</td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={emp.onboardingStatus} />
                    </td>
                    <td className="py-3.5 px-4 w-36">
                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px] text-slate-600 font-medium">
                          <span>{emp.completionPercentage}%</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-violet-600 h-1.5 rounded-full"
                            style={{ width: `${emp.completionPercentage}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Button
                        variant="secondary"
                        size="sm"
                        leftIcon={<Eye className="w-3.5 h-3.5" />}
                        onClick={() => setSelectedEmployee(emp)}
                      >
                        Details
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination Controls */}
            {employeesData.totalPages > 1 && (
              <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>
                  Page {employeesData.page + 1} of {employeesData.totalPages} ({employeesData.totalElements} total)
                </span>
                <div className="flex gap-1.5">
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={employeesData.page === 0}
                    onClick={() => setPage(page - 1)}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={employeesData.last}
                    onClick={() => setPage(page + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Add Employee & Send Invitation Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add & Invite Employee"
        description="Create an employee record and dispatch an account invitation with a secure activation link."
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <Input
            label="Full Name *"
            placeholder="e.g. Rachel Green"
            value={formData.fullName}
            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Work Email *"
              type="email"
              placeholder="rachel@acme.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
            <Input
              label="Phone Number (Optional)"
              type="tel"
              placeholder="+1 (555) 019-2834"
              value={formData.phoneNumber || ''}
              onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Department *"
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              options={[
                { label: 'Engineering', value: 'Engineering' },
                { label: 'Product & Design', value: 'Product & Design' },
                { label: 'Human Resources', value: 'Human Resources' },
                { label: 'Operations', value: 'Operations' },
                { label: 'Sales & Marketing', value: 'Sales & Marketing' },
                { label: 'Finance & Legal', value: 'Finance & Legal' },
              ]}
              required
            />
            <Input
              label="Designation / Job Title *"
              placeholder="e.g. Senior Software Engineer"
              value={formData.jobTitle}
              onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Joining Date *"
              type="date"
              value={formData.employmentStartDate}
              onChange={(e) => setFormData({ ...formData, employmentStartDate: e.target.value })}
              required
            />
            <Select
              label="Employment Type *"
              value={formData.employmentType || 'FULL_TIME'}
              onChange={(e) => setFormData({ ...formData, employmentType: e.target.value })}
              options={[
                { label: 'Full Time', value: 'FULL_TIME' },
                { label: 'Part Time', value: 'PART_TIME' },
                { label: 'Contract', value: 'CONTRACT' },
                { label: 'Internship', value: 'INTERNSHIP' },
              ]}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Assigned System Role *"
              value={formData.role || 'EMPLOYEE'}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as Role })}
              options={[
                { label: 'Employee (Standard Access)', value: 'EMPLOYEE' },
                { label: 'Team Manager (Team Access)', value: 'MANAGER' },
                ...(isHrAdmin ? [{ label: 'HR Manager (HR Administration)', value: 'HR_MANAGER' }] : []),
                ...(isHrAdmin ? [{ label: 'HR Admin (Full Tenant Admin)', value: 'HR_ADMIN' }] : []),
              ]}
              required
            />
            <Select
              label="Reporting Manager (Optional)"
              value={formData.managerId || ''}
              onChange={(e) => setFormData({ ...formData, managerId: e.target.value })}
              options={[
                { label: '-- Select Manager --', value: '' },
                ...(allEmployees?.content?.map((emp) => ({
                  label: `${emp.fullName || emp.employeeCode} (${emp.jobTitle})`,
                  value: emp.id,
                })) || []),
              ]}
            />
          </div>

          <Select
            label="Assign Onboarding Plan (Optional)"
            value={formData.onboardingPlanId || ''}
            onChange={(e) => setFormData({ ...formData, onboardingPlanId: e.target.value })}
            options={[
              { label: '-- Select Plan (Optional) --', value: '' },
              ...(activePlans?.map((p) => ({ label: `${p.name} (${p.taskCount} tasks)`, value: p.id })) || []),
            ]}
          />

          <div className="p-3 bg-violet-50/70 border border-violet-100 rounded-xl text-xs text-violet-800 flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-violet-600 shrink-0 mt-0.5" />
            <p>
              The employee account is created in pending status without a default password. An invitation token with a 7-day expiration will be issued for self-activation.
            </p>
          </div>

          {createMutation.isError && (
            <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-xl border border-rose-200">
              {(createMutation.error as any)?.response?.data?.message ||
                createMutation.error.message ||
                'Failed to add employee and generate invitation.'}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <Button type="button" variant="secondary" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="violet" isLoading={createMutation.isPending}>
              Create & Send Invitation
            </Button>
          </div>
        </form>
      </Modal>

      {/* Success Invitation Modal with Activation Link Copy */}
      {createdSuccessInvitation && (
        <Modal
          isOpen={!!createdSuccessInvitation}
          onClose={() => setCreatedSuccessInvitation(null)}
          title="Employee Added & Invitation Sent!"
          description="Employee profile and invitation have been generated."
        >
          <div className="space-y-4">
            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900 space-y-1">
              <div className="flex items-center gap-2 font-bold text-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>New Hire: {createdSuccessInvitation.fullName}</span>
              </div>
              <p>Email: <strong>{createdSuccessInvitation.email}</strong></p>
              <p>Assigned Role: <strong>{createdSuccessInvitation.role}</strong></p>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1">
              <span className="font-semibold text-slate-800">
                Delivery Status: {createdSuccessInvitation.emailSent ? 'Email Sent via SMTP' : 'Development Link Ready'}
              </span>
              <p>{createdSuccessInvitation.emailStatus || 'Invitation active.'}</p>
            </div>

            {createdSuccessInvitation.activationLink && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-navy-900">Secure Activation Link</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={createdSuccessInvitation.activationLink}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-mono"
                  />
                  <Button
                    variant="violet"
                    size="sm"
                    leftIcon={copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    onClick={() => handleCopyLink(createdSuccessInvitation.activationLink)}
                  >
                    {copiedLink ? 'Copied!' : 'Copy'}
                  </Button>
                </div>
                <p className="text-[11px] text-slate-400">
                  Share this secure single-use link with the candidate to activate their account and set their password.
                </p>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
              <Button
                variant="secondary"
                onClick={() => setCreatedSuccessInvitation(null)}
              >
                Close
              </Button>
              {createdSuccessInvitation.activationLink && (
                <a
                  href={createdSuccessInvitation.activationLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-3 py-2 text-xs font-semibold rounded-lg bg-violet-50 text-violet-700 hover:bg-violet-100 transition-standard"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Test Activation Link
                </a>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Employee Details Modal */}
      {selectedEmployee && (
        <Modal
          isOpen={!!selectedEmployee}
          onClose={() => setSelectedEmployee(null)}
          title={`Employee Profile: ${selectedEmployee.fullName || selectedEmployee.employeeCode}`}
          description={`Code: ${selectedEmployee.employeeCode} | Department: ${selectedEmployee.department}`}
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50 rounded-xl text-xs">
              <div>
                <span className="text-slate-500">Email:</span>
                <p className="font-semibold text-navy-900">{selectedEmployee.email || 'N/A'}</p>
              </div>
              <div>
                <span className="text-slate-500">Job Title:</span>
                <p className="font-semibold text-navy-900">{selectedEmployee.jobTitle}</p>
              </div>
              <div>
                <span className="text-slate-500">Start Date:</span>
                <p className="font-semibold text-navy-900">{selectedEmployee.employmentStartDate}</p>
              </div>
              <div>
                <span className="text-slate-500">Status:</span>
                <div className="mt-0.5">
                  <StatusBadge status={selectedEmployee.onboardingStatus} />
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-xs font-semibold text-navy-900">Overall Onboarding Progress</span>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-violet-600 h-2 rounded-full"
                  style={{ width: `${selectedEmployee.completionPercentage}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-500 text-right">{selectedEmployee.completionPercentage}% completed</p>
            </div>

            {isHrAdmin && (
              <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                <span className="text-xs text-slate-500">Deactivating disables user login access</span>
                <Button
                  variant="danger"
                  size="sm"
                  leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                  isLoading={deactivateMutation.isPending}
                  onClick={() => deactivateMutation.mutate(selectedEmployee.id)}
                >
                  Deactivate Account
                </Button>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};

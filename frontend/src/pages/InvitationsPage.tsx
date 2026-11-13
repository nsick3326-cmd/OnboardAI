import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { invitationsApi, employeesApi, plansApi } from '../services/endpoints';
import { useAuth } from '../hooks/useAuth';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Select } from '../components/common/Select';
import { Modal } from '../components/common/Modal';
import { TableSkeleton } from '../components/common/Skeleton';
import { EmptyState } from '../components/common/EmptyState';
import {
  InvitationItem,
  InvitationStatus,
  Role,
  CreateInvitationRequest,
} from '../types';
import {
  Mail,
  UserPlus,
  Search,
  RefreshCw,
  XCircle,
  Copy,
  Check,
  ExternalLink,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Building2,
  ShieldCheck,
  Calendar,
  Briefcase,
  Phone,
  Send,
  Info,
} from 'lucide-react';

export const InvitationsPage: React.FC = () => {
  const { isHr, isHrAdmin, user } = useAuth();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<InvitationStatus | ''>('');
  const [page, setPage] = useState(0);

  // Modals
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [selectedInvitation, setSelectedInvitation] = useState<InvitationItem | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [createdSuccessInvitation, setCreatedSuccessInvitation] = useState<InvitationItem | null>(null);

  // Invite Form State
  const [formData, setFormData] = useState<CreateInvitationRequest>({
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

  const { data: invitationsData, isLoading } = useQuery({
    queryKey: ['invitations', statusFilter, search, page],
    queryFn: () =>
      invitationsApi.getInvitations({
        status: statusFilter || undefined,
        search: search || undefined,
        page,
        size: 10,
      }),
  });

  const { data: employeesData } = useQuery({
    queryKey: ['employees-for-managers'],
    queryFn: () => employeesApi.getEmployees({ size: 100 }),
  });

  const { data: activePlans } = useQuery({
    queryKey: ['active-plans'],
    queryFn: plansApi.getActivePlans,
  });

  // Create Invitation Mutation
  const inviteMutation = useMutation({
    mutationFn: invitationsApi.create,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['invitations'] });
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      setIsInviteModalOpen(false);
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

  // Resend Mutation
  const resendMutation = useMutation({
    mutationFn: invitationsApi.resend,
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['invitations'] });
      if (selectedInvitation && selectedInvitation.id === updated.id) {
        setSelectedInvitation(updated);
      }
    },
  });

  // Revoke Mutation
  const revokeMutation = useMutation({
    mutationFn: invitationsApi.revoke,
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['invitations'] });
      if (selectedInvitation && selectedInvitation.id === updated.id) {
        setSelectedInvitation(updated);
      }
    },
  });

  const handleCopyLink = (link?: string | null) => {
    if (!link) return;
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    inviteMutation.mutate({
      ...formData,
      managerId: formData.managerId || null,
      onboardingPlanId: formData.onboardingPlanId || null,
    });
  };

  // Metrics
  const totalCount = invitationsData?.totalElements || 0;
  const pendingCount = invitationsData?.content?.filter((i) => i.status === 'PENDING').length || 0;
  const acceptedCount = invitationsData?.content?.filter((i) => i.status === 'ACCEPTED').length || 0;

  const getStatusBadge = (status: InvitationStatus) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200/60">
            <Clock className="w-3 h-3 text-amber-500 animate-pulse" />
            Pending
          </span>
        );
      case 'ACCEPTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200/80">
            <CheckCircle2 className="w-3 h-3 text-[#18B89A]" />
            Accepted / Active
          </span>
        );
      case 'EXPIRED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
            <AlertTriangle className="w-3 h-3 text-slate-400" />
            Expired
          </span>
        );
      case 'REVOKED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200/60">
            <XCircle className="w-3 h-3 text-rose-500" />
            Revoked
          </span>
        );
    }
  };

  const getRoleBadge = (role: Role) => {
    switch (role) {
      case 'HR_ADMIN':
        return <span className="px-2 py-0.5 rounded-lg text-[11px] font-bold bg-[#211B45] text-white">HR Admin</span>;
      case 'HR_MANAGER':
        return <span className="px-2 py-0.5 rounded-lg text-[11px] font-bold bg-violet-100 text-[#7655F7] border border-violet-200">HR Manager</span>;
      case 'MANAGER':
        return <span className="px-2 py-0.5 rounded-lg text-[11px] font-bold bg-indigo-50 text-indigo-800 border border-indigo-200">Team Manager</span>;
      case 'EMPLOYEE':
        return <span className="px-2 py-0.5 rounded-lg text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">Employee</span>;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#17182B] tracking-tight flex items-center gap-2">
            <Mail className="w-5 h-5 text-[#7655F7]" />
            Employee Invitation Management
          </h2>
          <p className="text-xs text-[#727A91] mt-0.5">
            Issue secure account invitations, track onboarding activation status, and re-issue links
          </p>
        </div>
        {isHr && (
          <Button
            variant="violet"
            leftIcon={<UserPlus className="w-4 h-4" />}
            onClick={() => setIsInviteModalOpen(true)}
          >
            Invite New Employee
          </Button>
        )}
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <Card className="p-4 flex items-center gap-3" hoverable>
          <div className="w-10 h-10 rounded-xl bg-violet-50 text-[#7655F7] flex items-center justify-center font-bold">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-[#727A91] font-medium">Total Invitations</p>
            <p className="text-lg font-bold text-[#17182B]">{totalCount}</p>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-3" hoverable>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-[#727A91] font-medium">Pending Activation</p>
            <p className="text-lg font-bold text-amber-700">{pendingCount}</p>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-3" hoverable>
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5 text-[#18B89A]" />
          </div>
          <div>
            <p className="text-xs text-[#727A91] font-medium">Activated Accounts</p>
            <p className="text-lg font-bold text-teal-800">{acceptedCount}</p>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-3" hoverable>
          <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-600 flex items-center justify-center font-bold">
            <ShieldCheck className="w-5 h-5 text-[#7655F7]" />
          </div>
          <div>
            <p className="text-xs text-[#727A91] font-medium">Security Validation</p>
            <p className="text-xs font-semibold text-slate-700">SHA-256 Hashed</p>
          </div>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, email, department..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
              className="w-full pl-9 pr-3.5 py-2 text-sm text-navy-900 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as InvitationStatus | '');
              setPage(0);
            }}
            className="w-full px-3.5 py-2 text-sm text-navy-900 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
          >
            <option value="">All Statuses</option>
            <option value="PENDING">Pending Activation</option>
            <option value="ACCEPTED">Accepted / Activated</option>
            <option value="EXPIRED">Expired</option>
            <option value="REVOKED">Revoked</option>
          </select>

          <div className="flex items-center justify-end text-xs text-slate-500">
            <span>Showing page {page + 1}</span>
          </div>
        </div>
      </Card>

      {/* Invitations Table */}
      <Card>
        {isLoading ? (
          <TableSkeleton rows={5} />
        ) : !invitationsData?.content || invitationsData.content.length === 0 ? (
          <EmptyState
            icon={<Mail className="w-10 h-10 text-slate-300" />}
            title="No invitations found"
            description="Create your first employee onboarding invitation to start inviting new hires."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Candidate</th>
                  <th className="py-3 px-4">Role & Department</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Expires</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invitationsData.content.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/50 transition-standard">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-violet-100 text-violet-700 font-bold flex items-center justify-center text-xs shrink-0">
                          {inv.fullName?.charAt(0) || 'U'}
                        </div>
                        <div>
                          <p className="font-semibold text-navy-900">{inv.fullName}</p>
                          <p className="text-[11px] text-slate-400">{inv.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        {getRoleBadge(inv.role)}
                      </div>
                      <p className="font-medium text-navy-900">{inv.jobTitle}</p>
                      <p className="text-[11px] text-slate-500">{inv.department}</p>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      <span className="capitalize">{inv.employmentType?.toLowerCase().replace('_', ' ') || 'Full Time'}</span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      <div className="flex items-center gap-1 text-[11px]">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span>{new Date(inv.expiresAt).toLocaleDateString()}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      {getStatusBadge(inv.status)}
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-1.5">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setSelectedInvitation(inv)}
                      >
                        Details
                      </Button>
                      {inv.status === 'PENDING' && (
                        <>
                          <Button
                            variant="secondary"
                            size="sm"
                            leftIcon={<RefreshCw className="w-3 h-3" />}
                            isLoading={resendMutation.isPending && resendMutation.variables === inv.id}
                            onClick={() => resendMutation.mutate(inv.id)}
                            title="Resend invitation (invalidates old token)"
                          >
                            Resend
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            leftIcon={<XCircle className="w-3 h-3" />}
                            isLoading={revokeMutation.isPending && revokeMutation.variables === inv.id}
                            onClick={() => {
                              if (window.confirm(`Are you sure you want to revoke the invitation for ${inv.fullName}?`)) {
                                revokeMutation.mutate(inv.id);
                              }
                            }}
                            title="Revoke invitation"
                          >
                            Revoke
                          </Button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination Controls */}
            {invitationsData.totalPages > 1 && (
              <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>
                  Page {invitationsData.page + 1} of {invitationsData.totalPages} ({invitationsData.totalElements} total)
                </span>
                <div className="flex gap-1.5">
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={invitationsData.page === 0}
                    onClick={() => setPage(page - 1)}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={invitationsData.last}
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

      {/* Invite New Employee Modal */}
      <Modal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        title="Invite New Employee"
        description="Provision an employee profile and send a secure account activation link."
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <Input
            label="Full Name *"
            value={formData.fullName}
            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            placeholder="e.g. Alex Morgan"
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Work Email *"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="alex.morgan@company.com"
              required
            />
            <Input
              label="Phone Number (Optional)"
              type="tel"
              value={formData.phoneNumber || ''}
              onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
              placeholder="+1 (555) 012-3456"
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
              value={formData.jobTitle}
              onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
              placeholder="e.g. Senior Frontend Engineer"
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
                ...(employeesData?.content?.map((emp) => ({
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
              { label: '-- Select Onboarding Plan --', value: '' },
              ...(activePlans?.map((p) => ({
                label: `${p.name} (${p.taskCount} tasks)`,
                value: p.id,
              })) || []),
            ]}
          />

          <div className="p-3 bg-violet-50/60 rounded-xl border border-violet-100 flex items-start gap-2.5 text-xs text-violet-800">
            <ShieldCheck className="w-4 h-4 text-violet-600 shrink-0 mt-0.5" />
            <p>
              A single-use, cryptographically secure activation token will be generated. The candidate will set their own password during activation.
            </p>
          </div>

          {inviteMutation.isError && (
            <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-xl border border-rose-200">
              {(inviteMutation.error as any)?.response?.data?.message ||
                inviteMutation.error.message ||
                'Failed to create invitation. Please verify input.'}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <Button type="button" variant="secondary" onClick={() => setIsInviteModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="violet" isLoading={inviteMutation.isPending}>
              Send Invitation
            </Button>
          </div>
        </form>
      </Modal>

      {/* Success Invitation Creation Modal with Activation Link Copy */}
      {createdSuccessInvitation && (
        <Modal
          isOpen={!!createdSuccessInvitation}
          onClose={() => setCreatedSuccessInvitation(null)}
          title="Invitation Generated Successfully!"
          description="The employee profile has been created and an activation link has been prepared."
        >
          <div className="space-y-4">
            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900 space-y-1">
              <div className="flex items-center gap-2 font-bold text-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Candidate Invited: {createdSuccessInvitation.fullName}</span>
              </div>
              <p>Work Email: <strong>{createdSuccessInvitation.email}</strong></p>
              <p>Assigned Role: <strong>{createdSuccessInvitation.role}</strong></p>
            </div>

            {/* Email delivery note */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1">
              <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                <Info className="w-3.5 h-3.5 text-violet-600" />
                <span>Delivery Status: {createdSuccessInvitation.emailSent ? 'Delivered via SMTP' : 'Development Link Ready'}</span>
              </div>
              <p>{createdSuccessInvitation.emailStatus || 'Invitation token active.'}</p>
            </div>

            {/* Activation Link */}
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
                  Share this secure single-use activation link with the candidate to let them activate their account and set their password.
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

      {/* Invitation Details Modal */}
      {selectedInvitation && (
        <Modal
          isOpen={!!selectedInvitation}
          onClose={() => setSelectedInvitation(null)}
          title={`Invitation: ${selectedInvitation.fullName}`}
          description={`Recipient: ${selectedInvitation.email} | Status: ${selectedInvitation.status}`}
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50 rounded-xl text-xs">
              <div>
                <span className="text-slate-500">Designation / Role:</span>
                <p className="font-semibold text-navy-900">{selectedInvitation.jobTitle} ({selectedInvitation.role})</p>
              </div>
              <div>
                <span className="text-slate-500">Department:</span>
                <p className="font-semibold text-navy-900">{selectedInvitation.department}</p>
              </div>
              <div>
                <span className="text-slate-500">Phone:</span>
                <p className="font-semibold text-navy-900">{selectedInvitation.phoneNumber || 'N/A'}</p>
              </div>
              <div>
                <span className="text-slate-500">Employment Type:</span>
                <p className="font-semibold text-navy-900 capitalize">{selectedInvitation.employmentType?.toLowerCase() || 'Full time'}</p>
              </div>
              <div>
                <span className="text-slate-500">Invitation Sent:</span>
                <p className="font-semibold text-navy-900">{new Date(selectedInvitation.createdAt).toLocaleString()}</p>
              </div>
              <div>
                <span className="text-slate-500">Expires At:</span>
                <p className="font-semibold text-navy-900">{new Date(selectedInvitation.expiresAt).toLocaleString()}</p>
              </div>
            </div>

            {selectedInvitation.activationLink && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-navy-900">Secure Activation URL</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={selectedInvitation.activationLink}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-mono"
                  />
                  <Button
                    variant="violet"
                    size="sm"
                    leftIcon={copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    onClick={() => handleCopyLink(selectedInvitation.activationLink)}
                  >
                    {copiedLink ? 'Copied!' : 'Copy'}
                  </Button>
                </div>
              </div>
            )}

            <div className="flex justify-between items-center pt-4 border-t border-slate-100">
              <div className="flex items-center gap-2">
                {selectedInvitation.status === 'PENDING' && (
                  <>
                    <Button
                      variant="secondary"
                      size="sm"
                      leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
                      isLoading={resendMutation.isPending}
                      onClick={() => resendMutation.mutate(selectedInvitation.id)}
                    >
                      Resend
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      leftIcon={<XCircle className="w-3.5 h-3.5" />}
                      isLoading={revokeMutation.isPending}
                      onClick={() => {
                        if (window.confirm(`Are you sure you want to revoke the invitation for ${selectedInvitation.fullName}?`)) {
                          revokeMutation.mutate(selectedInvitation.id);
                        }
                      }}
                    >
                      Revoke
                    </Button>
                  </>
                )}
              </div>
              <Button variant="secondary" onClick={() => setSelectedInvitation(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

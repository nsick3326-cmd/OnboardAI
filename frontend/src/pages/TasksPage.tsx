import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tasksApi, employeesApi } from '../services/endpoints';
import { useAuth } from '../hooks/useAuth';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Select } from '../components/common/Select';
import { Modal } from '../components/common/Modal';
import { StatusBadge, Badge } from '../components/common/Badge';
import { TableSkeleton } from '../components/common/Skeleton';
import { EmptyState } from '../components/common/EmptyState';
import { OnboardingTask, TaskCategory, TaskStatus, TaskPriority } from '../types';
import {
  CheckSquare,
  Plus,
  Clock,
  Calendar,
  FileText,
  AlertCircle,
  MessageSquare,
  CheckCircle2,
  Filter,
} from 'lucide-react';

export const TasksPage: React.FC = () => {
  const { user, isHr, isManager } = useAuth();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'MY' | 'ALL'>('MY');
  const [category, setCategory] = useState<string>('');
  const [status, setStatus] = useState<string>('');
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [page, setPage] = useState(0);

  // Modals
  const [statusModalTask, setStatusModalTask] = useState<OnboardingTask | null>(null);
  const [targetStatus, setTargetStatus] = useState<TaskStatus>('COMPLETED');
  const [taskComments, setTaskComments] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Create Task form state
  const [createForm, setCreateForm] = useState({
    employeeId: '',
    title: '',
    description: '',
    category: 'GENERAL' as TaskCategory,
    priority: 'MEDIUM' as TaskPriority,
    dueDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
    required: true,
    documentRequired: false,
  });

  const { data: employeesData } = useQuery({
    queryKey: ['employees-for-tasks'],
    queryFn: () => employeesApi.getEmployees({ page: 0, size: 50 }),
    enabled: isHr || isManager,
  });

  const { data: tasksData, isLoading } = useQuery({
    queryKey: ['tasks', activeTab, category, status, overdueOnly, page],
    queryFn: () =>
      tasksApi.getTasks({
        category: (category as TaskCategory) || undefined,
        status: (status as TaskStatus) || undefined,
        overdue: overdueOnly ? true : undefined,
        page,
        size: 15,
      }),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, newStatus, comments }: { id: string; newStatus: TaskStatus; comments?: string }) =>
      tasksApi.updateTaskStatus(id, newStatus, comments),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['analytics-overview'] });
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      setStatusModalTask(null);
      setTaskComments('');
    },
  });

  const createTaskMutation = useMutation({
    mutationFn: tasksApi.createTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['analytics-overview'] });
      setIsCreateModalOpen(false);
      setCreateForm({
        employeeId: '',
        title: '',
        description: '',
        category: 'GENERAL',
        priority: 'MEDIUM',
        dueDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
        required: true,
        documentRequired: false,
      });
    },
  });

  const handleOpenStatusModal = (task: OnboardingTask, nextStatus: TaskStatus) => {
    setStatusModalTask(task);
    setTargetStatus(nextStatus);
    setTaskComments(task.comments || '');
  };

  const handleStatusSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!statusModalTask) return;
    updateStatusMutation.mutate({
      id: statusModalTask.id,
      newStatus: targetStatus,
      comments: taskComments,
    });
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createTaskMutation.mutate(createForm);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-navy-900 tracking-tight">Onboarding Tasks</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Complete assigned onboarding checkpoints, track dependencies, and record verification notes
          </p>
        </div>
        {isHr && (
          <Button
            variant="violet"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => setIsCreateModalOpen(true)}
          >
            Add Task
          </Button>
        )}
      </div>

      {/* Filter and tab bar */}
      <Card className="p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          {/* Tabs */}
          <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => {
                setActiveTab('MY');
                setPage(0);
              }}
              className={`px-4 py-1.5 rounded-lg transition-standard ${
                activeTab === 'MY' ? 'bg-white text-navy-900 shadow-xs' : 'text-slate-500 hover:text-navy-900'
              }`}
            >
              {isHr ? 'Assigned to Me' : 'My Onboarding Tasks'}
            </button>
            {(isHr || isManager) && (
              <button
                onClick={() => {
                  setActiveTab('ALL');
                  setPage(0);
                }}
                className={`px-4 py-1.5 rounded-lg transition-standard ${
                  activeTab === 'ALL' ? 'bg-white text-navy-900 shadow-xs' : 'text-slate-500 hover:text-navy-900'
                }`}
              >
                All Organization Tasks
              </button>
            )}
          </div>

          {/* Overdue checkbox */}
          <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={overdueOnly}
              onChange={(e) => {
                setOverdueOnly(e.target.checked);
                setPage(0);
              }}
              className="rounded text-violet-600 focus:ring-0"
            />
            <span>Show Overdue Only</span>
          </label>
        </div>

        {/* Filter controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setPage(0);
            }}
            className="w-full px-3 py-2 text-xs text-navy-900 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-violet-500"
          >
            <option value="">All Categories</option>
            <option value="DOCUMENTATION">Documentation</option>
            <option value="IT_SETUP">IT Setup</option>
            <option value="TRAINING">Training</option>
            <option value="COMPLIANCE">Compliance</option>
            <option value="HR_MEETING">HR Meeting</option>
            <option value="GENERAL">General</option>
          </select>

          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(0);
            }}
            className="w-full px-3 py-2 text-xs text-navy-900 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-violet-500"
          >
            <option value="">All Statuses</option>
            <option value="NOT_STARTED">Not Started</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
            <option value="BLOCKED">Blocked</option>
          </select>
        </div>
      </Card>

      {/* Task List */}
      <Card>
        {isLoading ? (
          <TableSkeleton rows={6} />
        ) : !tasksData?.content || tasksData.content.length === 0 ? (
          <EmptyState
            icon={<CheckSquare className="w-10 h-10 text-slate-300" />}
            title="No onboarding tasks match filters"
            description="You are caught up or there are no tasks fitting your selected category criteria."
          />
        ) : (
          <div className="divide-y divide-slate-100">
            {tasksData.content.map((task) => (
              <div
                key={task.id}
                className="p-4 hover:bg-slate-50/60 transition-standard flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-navy-900 text-sm">{task.title}</span>
                    <Badge variant="purple">{task.category}</Badge>
                    <Badge
                      variant={
                        task.priority === 'HIGH' || task.priority === 'URGENT'
                          ? 'danger'
                          : task.priority === 'MEDIUM'
                          ? 'warning'
                          : 'default'
                      }
                    >
                      {task.priority}
                    </Badge>
                    {task.overdue && <Badge variant="danger">OVERDUE</Badge>}
                    {task.documentRequired && (
                      <span className="inline-flex items-center gap-1 text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 font-medium">
                        <FileText className="w-3 h-3" /> Doc Required
                      </span>
                    )}
                  </div>

                  {task.description && (
                    <p className="text-xs text-slate-600 leading-relaxed">{task.description}</p>
                  )}

                  {task.comments && (
                    <div className="flex items-start gap-1.5 text-xs text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-100">
                      <MessageSquare className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                      <span>{task.comments}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-4 text-[11px] text-slate-400 pt-1">
                    {task.dueDate && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Due: {task.dueDate}
                      </span>
                    )}
                    {task.employeeName && <span>Employee: {task.employeeName}</span>}
                  </div>
                </div>

                {/* Status action buttons */}
                <div className="flex items-center gap-2 shrink-0 self-start md:self-center">
                  <StatusBadge status={task.status} />

                  {task.status !== 'COMPLETED' ? (
                    <>
                      {task.status !== 'IN_PROGRESS' && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleOpenStatusModal(task, 'IN_PROGRESS')}
                        >
                          Start
                        </Button>
                      )}
                      <Button
                        variant="violet"
                        size="sm"
                        leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
                        onClick={() => handleOpenStatusModal(task, 'COMPLETED')}
                      >
                        Complete
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                        onClick={() => handleOpenStatusModal(task, 'BLOCKED')}
                      >
                        Blocked
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenStatusModal(task, 'IN_PROGRESS')}
                    >
                      Reopen
                    </Button>
                  )}
                </div>
              </div>
            ))}

            {/* Pagination */}
            {tasksData.totalPages > 1 && (
              <div className="px-4 py-3 flex items-center justify-between text-xs text-slate-500">
                <span>
                  Page {tasksData.page + 1} of {tasksData.totalPages} ({tasksData.totalElements} tasks)
                </span>
                <div className="flex gap-1.5">
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={tasksData.page === 0}
                    onClick={() => setPage(page - 1)}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={tasksData.last}
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

      {/* Status Update & Comments Modal */}
      {statusModalTask && (
        <Modal
          isOpen={!!statusModalTask}
          onClose={() => setStatusModalTask(null)}
          title={`Update Task: ${targetStatus}`}
          description={statusModalTask.title}
        >
          <form onSubmit={handleStatusSubmit} className="space-y-4">
            <p className="text-xs text-slate-600">
              Confirm transitioning this task from <span className="font-semibold">{statusModalTask.status}</span> to{' '}
              <span className="font-semibold text-violet-700">{targetStatus}</span>.
            </p>

            <Input
              label="Notes or Completion Comments"
              placeholder="e.g. Uploaded passport copy and completed MFA setup..."
              value={taskComments}
              onChange={(e) => setTaskComments(e.target.value)}
              required={targetStatus === 'BLOCKED'}
              helperText={targetStatus === 'BLOCKED' ? 'Please provide the reason why this task is blocked' : undefined}
            />

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
              <Button type="button" variant="secondary" onClick={() => setStatusModalTask(null)}>
                Cancel
              </Button>
              <Button type="submit" variant="violet" isLoading={updateStatusMutation.isPending}>
                Save Status
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Add Task Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Add Onboarding Task"
        description="Attach an ad-hoc requirement to an employee's onboarding assignment"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <Select
            label="Target Employee"
            value={createForm.employeeId}
            onChange={(e) => setCreateForm({ ...createForm, employeeId: e.target.value })}
            options={[
              { label: '-- Select Employee --', value: '' },
              ...(employeesData?.content.map((emp) => ({
                label: `${emp.fullName || emp.employeeCode} (${emp.employeeCode})`,
                value: emp.id,
              })) || []),
            ]}
            required
          />

          <Input
            label="Task Title"
            placeholder="e.g. Enroll in Benefits Portal"
            value={createForm.title}
            onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
            required
          />

          <Input
            label="Description & Instructions"
            placeholder="Details on what the employee or HR manager needs to do..."
            value={createForm.description}
            onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
          />

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Category"
              value={createForm.category}
              onChange={(e) => setCreateForm({ ...createForm, category: e.target.value as TaskCategory })}
              options={[
                { label: 'Documentation', value: 'DOCUMENTATION' },
                { label: 'IT Setup', value: 'IT_SETUP' },
                { label: 'Training', value: 'TRAINING' },
                { label: 'Compliance', value: 'COMPLIANCE' },
                { label: 'HR Meeting', value: 'HR_MEETING' },
                { label: 'General', value: 'GENERAL' },
              ]}
            />
            <Select
              label="Priority"
              value={createForm.priority}
              onChange={(e) => setCreateForm({ ...createForm, priority: e.target.value as TaskPriority })}
              options={[
                { label: 'Low', value: 'LOW' },
                { label: 'Medium', value: 'MEDIUM' },
                { label: 'High', value: 'HIGH' },
                { label: 'Urgent', value: 'URGENT' },
              ]}
            />
          </div>

          <Input
            label="Due Date"
            type="date"
            value={createForm.dueDate}
            onChange={(e) => setCreateForm({ ...createForm, dueDate: e.target.value })}
            required
          />

          <div className="flex items-center gap-4 text-xs pt-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={createForm.required}
                onChange={(e) => setCreateForm({ ...createForm, required: e.target.checked })}
                className="rounded text-violet-600 focus:ring-0"
              />
              <span>Counts toward 100% completion</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={createForm.documentRequired}
                onChange={(e) => setCreateForm({ ...createForm, documentRequired: e.target.checked })}
                className="rounded text-violet-600 focus:ring-0"
              />
              <span>Document Upload Required</span>
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <Button type="button" variant="secondary" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="violet"
              isLoading={createTaskMutation.isPending}
              disabled={!createForm.employeeId}
            >
              Create Task
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

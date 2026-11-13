import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { plansApi, employeesApi } from '../services/endpoints';
import { useAuth } from '../hooks/useAuth';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Select } from '../components/common/Select';
import { Modal } from '../components/common/Modal';
import { Badge } from '../components/common/Badge';
import { Skeleton } from '../components/common/Skeleton';
import { EmptyState } from '../components/common/EmptyState';
import { OnboardingPlan, TaskCategory } from '../types';
import {
  ClipboardList,
  Plus,
  Trash2,
  Calendar,
  CheckCircle,
  FileText,
  UserCheck,
  Clock,
  Layers,
} from 'lucide-react';

export const PlansPage: React.FC = () => {
  const { isHr } = useAuth();
  const queryClient = useQueryClient();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedPlanForAssign, setSelectedPlanForAssign] = useState<OnboardingPlan | null>(null);
  const [assignEmployeeId, setAssignEmployeeId] = useState('');
  const [assignStartDate, setAssignStartDate] = useState(new Date().toISOString().split('T')[0]);

  // Dynamic template tasks form state
  const [planForm, setPlanForm] = useState({
    name: '',
    description: '',
    targetRole: '',
    department: 'Engineering',
    tasks: [
      {
        title: 'Submit Identity Proof & Tax Documentation',
        description: 'Upload valid passport/driver license and tax withholding form.',
        category: 'DOCUMENTATION' as TaskCategory,
        relativeDueDays: 2,
        required: true,
        responsibleRole: 'EMPLOYEE',
        documentRequired: true,
      },
      {
        title: 'Workstation Setup & 2FA Configuration',
        description: 'Configure corporate security credentials and password manager.',
        category: 'IT_SETUP' as TaskCategory,
        relativeDueDays: 3,
        required: true,
        responsibleRole: 'EMPLOYEE',
        documentRequired: false,
      },
    ],
  });

  const { data: plansData, isLoading } = useQuery({
    queryKey: ['onboarding-plans'],
    queryFn: () => plansApi.getPlans(0, 50),
  });

  const { data: employeesData } = useQuery({
    queryKey: ['employees-for-assignment'],
    queryFn: () => employeesApi.getEmployees({ page: 0, size: 50 }),
    enabled: !!selectedPlanForAssign,
  });

  const createPlanMutation = useMutation({
    mutationFn: plansApi.createPlan,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboarding-plans'] });
      queryClient.invalidateQueries({ queryKey: ['active-plans'] });
      setIsCreateModalOpen(false);
      setPlanForm({
        name: '',
        description: '',
        targetRole: '',
        department: 'Engineering',
        tasks: [
          {
            title: 'Initial Document Submission',
            description: '',
            category: 'DOCUMENTATION',
            relativeDueDays: 2,
            required: true,
            responsibleRole: 'EMPLOYEE',
            documentRequired: true,
          },
        ],
      });
    },
  });

  const assignMutation = useMutation({
    mutationFn: ({ planId, employeeId, startDate }: { planId: string; employeeId: string; startDate: string }) =>
      plansApi.assignPlan(planId, employeeId, startDate),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['analytics-overview'] });
      setSelectedPlanForAssign(null);
    },
  });

  const handleAddTaskTemplate = () => {
    setPlanForm({
      ...planForm,
      tasks: [
        ...planForm.tasks,
        {
          title: '',
          description: '',
          category: 'GENERAL',
          relativeDueDays: 5,
          required: true,
          responsibleRole: 'EMPLOYEE',
          documentRequired: false,
        },
      ],
    });
  };

  const handleRemoveTaskTemplate = (index: number) => {
    setPlanForm({
      ...planForm,
      tasks: planForm.tasks.filter((_, i) => i !== index),
    });
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createPlanMutation.mutate(planForm);
  };

  const handleAssignSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlanForAssign || !assignEmployeeId) return;
    assignMutation.mutate({
      planId: selectedPlanForAssign.id,
      employeeId: assignEmployeeId,
      startDate: assignStartDate,
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-navy-900 tracking-tight">Onboarding Plans</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Design reusable task tracks and deploy automated onboarding workflows
          </p>
        </div>
        {isHr && (
          <Button
            variant="violet"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => setIsCreateModalOpen(true)}
          >
            Create Plan
          </Button>
        )}
      </div>

      {/* Plans List */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : !plansData?.content || plansData.content.length === 0 ? (
        <EmptyState
          icon={<ClipboardList className="w-10 h-10 text-slate-300" />}
          title="No onboarding plans defined"
          description="Create your first onboarding plan blueprint with customized task templates."
          action={
            <Button variant="violet" onClick={() => setIsCreateModalOpen(true)}>
              Create Plan
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {plansData.content.map((plan) => (
            <Card key={plan.id} className="flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-navy-900">{plan.name}</h3>
                    <div className="flex items-center gap-2">
                      <Badge variant="purple">{plan.department || 'All Departments'}</Badge>
                      {plan.targetRole && <Badge variant="default">{plan.targetRole}</Badge>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100">
                    <Layers className="w-3.5 h-3.5 text-violet-600" />
                    <span>{plan.taskCount} Templates</span>
                  </div>
                </div>

                <p className="text-xs text-slate-600 mb-4 line-clamp-2">{plan.description}</p>

                {/* Templates Preview */}
                {plan.tasks && plan.tasks.length > 0 && (
                  <div className="border-t border-slate-100 pt-3 space-y-2">
                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      Workflow Blueprint Steps
                    </p>
                    <div className="space-y-1.5 max-h-40 overflow-y-auto">
                      {plan.tasks.map((tpl, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between text-xs py-1.5 px-2.5 rounded-lg bg-slate-50/70 border border-slate-100"
                        >
                          <div className="flex items-center gap-2 truncate mr-2">
                            <span className="w-4 h-4 rounded-full bg-violet-100 text-violet-700 text-[10px] font-bold flex items-center justify-center shrink-0">
                              {i + 1}
                            </span>
                            <span className="font-medium text-navy-900 truncate">{tpl.title}</span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {tpl.documentRequired && (
                              <span title="Document Required">
                                <FileText className="w-3.5 h-3.5 text-amber-500" />
                              </span>
                            )}
                            <span className="text-[11px] text-slate-400">+{tpl.relativeDueDays}d</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Card Footer Actions */}
              <div className="pt-4 mt-4 border-t border-slate-100 flex justify-between items-center">
                <span className="text-[11px] text-slate-400">Active Blueprint</span>
                {isHr && (
                  <Button
                    variant="violet"
                    size="sm"
                    leftIcon={<UserCheck className="w-3.5 h-3.5" />}
                    onClick={() => setSelectedPlanForAssign(plan)}
                  >
                    Assign to Employee
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create Plan Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create Onboarding Plan"
        description="Define a reusable track and its sequential task templates"
        maxWidth="xl"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <Input
            label="Plan Name"
            placeholder="e.g. Senior Frontend Engineer Track"
            value={planForm.name}
            onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Department"
              value={planForm.department}
              onChange={(e) => setPlanForm({ ...planForm, department: e.target.value })}
              options={[
                { label: 'Engineering', value: 'Engineering' },
                { label: 'Product & Design', value: 'Product & Design' },
                { label: 'Human Resources', value: 'Human Resources' },
                { label: 'Operations', value: 'Operations' },
                { label: 'Sales', value: 'Sales' },
              ]}
            />
            <Input
              label="Target Role"
              placeholder="e.g. Frontend Engineer"
              value={planForm.targetRole}
              onChange={(e) => setPlanForm({ ...planForm, targetRole: e.target.value })}
            />
          </div>

          <Input
            label="Plan Description"
            placeholder="Brief overview of track objectives..."
            value={planForm.description}
            onChange={(e) => setPlanForm({ ...planForm, description: e.target.value })}
          />

          {/* Dynamic Task Templates */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-navy-800">Task Templates ({planForm.tasks.length})</label>
              <button
                type="button"
                onClick={handleAddTaskTemplate}
                className="text-xs text-violet-600 hover:text-violet-700 font-semibold flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add Step
              </button>
            </div>

            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {planForm.tasks.map((task, idx) => (
                <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-400">#{idx + 1}</span>
                    <input
                      type="text"
                      placeholder="Task Title (e.g. Setup VPN)"
                      value={task.title}
                      onChange={(e) => {
                        const updated = [...planForm.tasks];
                        updated[idx].title = e.target.value;
                        setPlanForm({ ...planForm, tasks: updated });
                      }}
                      className="flex-1 px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-violet-500"
                      required
                    />
                    {planForm.tasks.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveTaskTemplate(idx)}
                        className="text-slate-400 hover:text-rose-600 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <select
                      value={task.category}
                      onChange={(e) => {
                        const updated = [...planForm.tasks];
                        updated[idx].category = e.target.value as TaskCategory;
                        setPlanForm({ ...planForm, tasks: updated });
                      }}
                      className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs"
                    >
                      <option value="DOCUMENTATION">Documentation</option>
                      <option value="IT_SETUP">IT Setup</option>
                      <option value="TRAINING">Training</option>
                      <option value="COMPLIANCE">Compliance</option>
                      <option value="HR_MEETING">HR Meeting</option>
                      <option value="GENERAL">General</option>
                    </select>

                    <div className="flex items-center gap-1 bg-white border border-slate-200 px-2 rounded-lg">
                      <span className="text-[11px] text-slate-400">Due in:</span>
                      <input
                        type="number"
                        min="1"
                        max="90"
                        value={task.relativeDueDays}
                        onChange={(e) => {
                          const updated = [...planForm.tasks];
                          updated[idx].relativeDueDays = parseInt(e.target.value) || 1;
                          setPlanForm({ ...planForm, tasks: updated });
                        }}
                        className="w-10 text-xs text-navy-900 focus:outline-none"
                      />
                      <span className="text-[11px] text-slate-400">days</span>
                    </div>

                    <label className="flex items-center gap-1.5 bg-white border border-slate-200 px-2 rounded-lg cursor-pointer">
                      <input
                        type="checkbox"
                        checked={task.documentRequired}
                        onChange={(e) => {
                          const updated = [...planForm.tasks];
                          updated[idx].documentRequired = e.target.checked;
                          setPlanForm({ ...planForm, tasks: updated });
                        }}
                        className="rounded text-violet-600 focus:ring-0"
                      />
                      <span className="text-[11px] text-slate-600">Doc Required</span>
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <Button type="button" variant="secondary" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="violet" isLoading={createPlanMutation.isPending}>
              Create Plan
            </Button>
          </div>
        </form>
      </Modal>

      {/* Assign Plan Modal */}
      {selectedPlanForAssign && (
        <Modal
          isOpen={!!selectedPlanForAssign}
          onClose={() => setSelectedPlanForAssign(null)}
          title={`Assign Plan: ${selectedPlanForAssign.name}`}
          description={`Generates ${selectedPlanForAssign.taskCount} tasks with computed due dates for the selected employee`}
        >
          <form onSubmit={handleAssignSubmit} className="space-y-4">
            <Select
              label="Select Employee"
              value={assignEmployeeId}
              onChange={(e) => setAssignEmployeeId(e.target.value)}
              options={[
                { label: '-- Select Employee --', value: '' },
                ...(employeesData?.content.map((emp) => ({
                  label: `${emp.fullName || emp.employeeCode} (${emp.employeeCode} - ${emp.jobTitle})`,
                  value: emp.id,
                })) || []),
              ]}
              required
            />

            <Input
              label="Workflow Start Date"
              type="date"
              value={assignStartDate}
              onChange={(e) => setAssignStartDate(e.target.value)}
              required
            />

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
              <Button type="button" variant="secondary" onClick={() => setSelectedPlanForAssign(null)}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="violet"
                isLoading={assignMutation.isPending}
                disabled={!assignEmployeeId}
              >
                Instantiate & Assign Plan
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { analyticsApi, tasksApi } from '../services/endpoints';
import { useAuth } from '../hooks/useAuth';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Skeleton } from '../components/common/Skeleton';
import { StatusBadge, Badge } from '../components/common/Badge';
import { useCountUp } from '../hooks/useCountUp';
import { useToast } from '../components/common/Toast';
import {
  Users,
  UserCheck,
  Clock,
  AlertTriangle,
  FileText,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Calendar,
  Building2,
  Check,
  Filter,
  UserPlus,
  RefreshCw,
  ChevronRight,
  Layers,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export const OverviewPage: React.FC = () => {
  const { user, isEmployee, isHr } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const toast = useToast();

  const [timeHorizon, setTimeHorizon] = useState<'30D' | '90D' | '6M' | 'ALL'>('6M');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string | null>(null);

  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ['analytics-overview'],
    queryFn: analyticsApi.getOverview,
  });

  const { data: trends } = useQuery({
    queryKey: ['analytics-trends'],
    queryFn: analyticsApi.getTrends,
    enabled: !isEmployee,
  });

  const { data: departments } = useQuery({
    queryKey: ['analytics-depts'],
    queryFn: analyticsApi.getTaskBreakdown,
    enabled: !isEmployee,
  });

  const { data: myTasks } = useQuery({
    queryKey: ['my-tasks-overview'],
    queryFn: () => tasksApi.getTasks({ page: 0, size: 6 }),
  });

  // Dynamic Animated Stats using useCountUp
  const animatedTotalEmployees = useCountUp(metrics?.totalEmployees || 0);
  const animatedOnboardingEmployees = useCountUp(metrics?.employeesOnboarding || 0);
  const animatedPendingDocs = useCountUp(metrics?.pendingDocumentVerifications || 0);
  const animatedPendingApprovals = useCountUp(metrics?.pendingApprovals || 0);
  const animatedCompletionRate = useCountUp(metrics?.onboardingCompletionRate || 0);
  const animatedTasksCompleted = useCountUp(metrics?.tasksCompleted || 0);
  const animatedTasksPending = useCountUp(metrics?.tasksPending || 0);
  const animatedTasksOverdue = useCountUp(metrics?.tasksOverdue || 0);

  // Dynamic time-of-day greeting
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  // Filter trends based on selected horizon
  const filteredTrends = useMemo(() => {
    if (!trends || trends.length === 0) return [];
    if (timeHorizon === '30D') return trends.slice(-2);
    if (timeHorizon === '90D') return trends.slice(-3);
    if (timeHorizon === '6M') return trends.slice(-6);
    return trends;
  }, [trends, timeHorizon]);

  // Interactive Task Status Toggle Mutation
  const updateTaskMutation = useMutation({
    mutationFn: ({ id, newStatus }: { id: string; newStatus: any }) =>
      tasksApi.updateTaskStatus(id, newStatus),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['my-tasks-overview'] });
      queryClient.invalidateQueries({ queryKey: ['analytics-overview'] });
      if (variables.newStatus === 'COMPLETED') {
        toast.success('Task Completed! 🎉', 'Onboarding progress updated live');
      } else {
        toast.info('Task Updated', `Status reverted to ${variables.newStatus}`);
      }
    },
    onError: (err: any) => {
      toast.error('Update Failed', err.response?.data?.message || 'Could not update task');
    },
  });

  const handleToggleTask = (taskId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'COMPLETED' ? 'IN_PROGRESS' : 'COMPLETED';
    updateTaskMutation.mutate({ id: taskId, newStatus: nextStatus });
  };

  if (metricsLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-80 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Dynamic Ambient Hero Greeting Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#211B45] via-[#2F2165] to-[#181135] text-white rounded-2xl p-6 lg:p-7 shadow-dropdown border border-indigo-900/60 transition-all">
        {/* Subtle glowing ambient orb decorations */}
        <div className="absolute -top-16 -right-16 w-56 h-56 bg-violet-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 left-1/3 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-violet-400/15 text-violet-200 border border-violet-400/25 backdrop-blur-sm shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-[#A18BFF] animate-pulse-glow" />
              <span>Acme Corporation • Live Workspace</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#18B89A] live-pulse" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
              {greeting}, {user?.fullName?.split('(')[0].trim()}!
            </h2>
            <p className="text-xs sm:text-sm text-indigo-200/90 leading-relaxed">
              {isEmployee
                ? 'Your onboarding checklist is active. Complete assigned steps, upload compliance docs, and ask our AI Copilot for help.'
                : 'Monitor active cohorts, verify pending credentials, and orchestrate automated workflow plans in real-time.'}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {isEmployee ? (
              <Button
                variant="violet"
                onClick={() => navigate('/dashboard/tasks')}
                rightIcon={<ArrowRight className="w-4 h-4" />}
                className="shadow-glow-violet hover:scale-105 active:scale-95 transition-all"
              >
                Continue My Tasks
              </Button>
            ) : (
              <>
                <button
                  onClick={() => navigate('/dashboard/invitations')}
                  className="px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-sm transition-all cursor-pointer shadow-xs flex items-center gap-1.5 hover:scale-105 active:scale-95"
                >
                  <UserPlus className="w-3.5 h-3.5 text-violet-300" />
                  <span>Invite Hire</span>
                </button>
                <Button
                  variant="violet"
                  onClick={() => navigate('/dashboard/ai')}
                  leftIcon={<Sparkles className="w-4 h-4 text-violet-200 animate-pulse-glow" />}
                  className="shadow-glow-violet hover:scale-105 active:scale-95 transition-all"
                >
                  AI Copilot
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Dynamic KPI Metrics Cards with Animated Counting & Interactive Hover Lift */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isEmployee ? (
          <>
            <Card hoverable className="h-full flex flex-col justify-between card-interactive">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Onboarding Progress
                  </span>
                  <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 border border-teal-100 flex items-center justify-center shrink-0">
                    <TrendingUp className="w-5 h-5 text-[#18B89A]" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2 mt-1.5">
                  <p className="text-3xl font-extrabold text-[#17182B] tracking-tight">
                    {animatedCompletionRate}%
                  </p>
                  <span className="text-[11px] font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full">
                    Active
                  </span>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100">
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-teal-400 to-[#18B89A] h-2 rounded-full transition-all duration-700 ease-out"
                    style={{ width: `${metrics?.onboardingCompletionRate || 0}%` }}
                  />
                </div>
              </div>
            </Card>

            <Card hoverable className="h-full flex flex-col justify-between card-interactive">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Tasks Completed
                  </span>
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  </div>
                </div>
                <p className="text-3xl font-extrabold text-[#17182B] tracking-tight mt-1.5">
                  {animatedTasksCompleted}
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>{animatedTasksPending} tasks pending</span>
              </div>
            </Card>

            <Card hoverable className="h-full flex flex-col justify-between card-interactive">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Tasks Overdue
                  </span>
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 border border-amber-100 flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5 text-amber-600" />
                  </div>
                </div>
                <p className="text-3xl font-extrabold text-[#17182B] tracking-tight mt-1.5">
                  {animatedTasksOverdue}
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-1.5 text-xs text-amber-700 font-semibold">
                <Clock className="w-3.5 h-3.5 text-amber-500" />
                <span>{animatedTasksOverdue > 0 ? 'Requires attention' : 'All up to date'}</span>
              </div>
            </Card>

            <Card hoverable className="h-full flex flex-col justify-between card-interactive">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Doc Verifications
                  </span>
                  <div className="w-10 h-10 rounded-xl bg-violet-50 text-[#7655F7] border border-violet-100 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                </div>
                <p className="text-3xl font-extrabold text-[#17182B] tracking-tight mt-1.5">
                  {animatedPendingDocs}
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                <FileText className="w-3.5 h-3.5 text-slate-400" />
                <span>Documents awaiting HR review</span>
              </div>
            </Card>
          </>
        ) : (
          <>
            {/* Card 1: Total Employees */}
            <Card hoverable className="h-full flex flex-col justify-between card-interactive">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Total Employees
                  </span>
                  <div className="w-10 h-10 rounded-xl bg-slate-100 text-[#211B45] flex items-center justify-center shrink-0 border border-slate-200/80">
                    <Users className="w-5 h-5" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2 mt-1.5">
                  <p className="text-3xl font-extrabold text-[#17182B] tracking-tight">
                    {animatedTotalEmployees}
                  </p>
                  <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                    Directory
                  </span>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                <span>Active company directory</span>
              </div>
            </Card>

            {/* Card 2: Currently Onboarding */}
            <Card hoverable className="h-full flex flex-col justify-between card-interactive">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Currently Onboarding
                  </span>
                  <div className="w-10 h-10 rounded-xl bg-violet-50 text-[#7655F7] border border-violet-100 flex items-center justify-center shrink-0">
                    <UserCheck className="w-5 h-5" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2 mt-1.5">
                  <p className="text-3xl font-extrabold text-[#17182B] tracking-tight">
                    {animatedOnboardingEmployees}
                  </p>
                  <span className="text-[10px] font-bold text-[#7655F7] bg-violet-50 px-2 py-0.5 rounded-full">
                    In Flight
                  </span>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-1.5 text-xs text-teal-700 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#18B89A]" />
                <span>{metrics?.completedOnboardings || 0} completed successfully</span>
              </div>
            </Card>

            {/* Card 3: Doc Verifications */}
            <Card hoverable className="h-full flex flex-col justify-between card-interactive">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Doc Verifications
                  </span>
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                </div>
                <p className="text-3xl font-extrabold text-[#17182B] tracking-tight mt-1.5">
                  {animatedPendingDocs}
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-1.5 text-xs text-amber-700 font-semibold">
                <Clock className="w-3.5 h-3.5 text-amber-500" />
                <span>Pending compliance review</span>
              </div>
            </Card>

            {/* Card 4: Pending Approvals */}
            <Card hoverable className="h-full flex flex-col justify-between card-interactive">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Pending Approvals
                  </span>
                  <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                </div>
                <p className="text-3xl font-extrabold text-[#17182B] tracking-tight mt-1.5">
                  {animatedPendingApprovals}
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" />
                <span>Sign-offs awaiting action</span>
              </div>
            </Card>
          </>
        )}
      </div>

      {/* Analytics Charts & Department Breakdown with Interactive Time Horizon Pills */}
      {!isEmployee && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          {/* Historical Trends Area Chart */}
          <Card
            className="lg:col-span-2 flex flex-col h-full card-interactive"
            bodyClassName="flex-1 flex flex-col justify-between"
            title="Onboarding Velocity & Completion Trends"
            subtitle="New hires initiated vs successful onboarding completions"
            action={
              <div className="flex items-center bg-slate-100 p-1 rounded-xl gap-1">
                {(['30D', '90D', '6M', 'ALL'] as const).map((period) => (
                  <button
                    key={period}
                    onClick={() => setTimeHorizon(period)}
                    className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                      timeHorizon === period
                        ? 'bg-white text-[#7655F7] shadow-xs'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    {period}
                  </button>
                ))}
              </div>
            }
          >
            <div className="h-72 w-full pt-2">
              {filteredTrends && filteredTrends.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={filteredTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorJoiners" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#7655F7" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#7655F7" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#18B89A" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#18B89A" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F3FA" />
                    <XAxis dataKey="label" stroke="#9BA3B8" fontSize={11} tickLine={false} />
                    <YAxis stroke="#9BA3B8" fontSize={11} allowDecimals={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#211B45',
                        borderRadius: '12px',
                        border: '1px solid #352B6C',
                        color: '#FFF',
                        fontSize: '12px',
                        boxShadow: '0 8px 20px -4px rgba(33, 27, 69, 0.2)',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="newJoiners"
                      name="New Joiners"
                      stroke="#7655F7"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#colorJoiners)"
                    />
                    <Area
                      type="monotone"
                      dataKey="completed"
                      name="Completed"
                      stroke="#18B89A"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#colorCompleted)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-slate-400">
                  No trend data recorded yet
                </div>
              )}
            </div>

            {/* Chart Legend Footer */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-600">
              <span className="text-[11px] text-slate-400">
                Live metrics from Postgres pipeline
              </span>
              <div className="flex items-center gap-6">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#7655F7]" />
                  New Joiners Initiated
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#18B89A]" />
                  Completed Onboardings
                </span>
              </div>
            </div>
          </Card>

          {/* Department Breakdown with Interactive Spotlight Filter */}
          <Card
            className="flex flex-col h-full card-interactive"
            bodyClassName="flex-1 flex flex-col justify-between"
            title="Department Progress"
            subtitle="Click a department to filter active tasks"
            action={
              selectedDeptFilter && (
                <button
                  onClick={() => setSelectedDeptFilter(null)}
                  className="text-[11px] font-bold text-[#7655F7] hover:underline"
                >
                  Clear filter
                </button>
              )
            }
          >
            <div className="space-y-3 pt-1">
              {departments && departments.length > 0 ? (
                departments.map((dept) => {
                  const isSelected = selectedDeptFilter === dept.department;
                  return (
                    <div
                      key={dept.department}
                      onClick={() =>
                        setSelectedDeptFilter(isSelected ? null : dept.department)
                      }
                      className={`p-2.5 rounded-xl transition-all cursor-pointer border ${
                        isSelected
                          ? 'bg-violet-50/80 border-violet-300 shadow-xs'
                          : 'hover:bg-slate-50 border-transparent'
                      }`}
                    >
                      <div className="flex justify-between items-center text-xs mb-1.5">
                        <span className="font-bold text-[#17182B] flex items-center gap-1.5">
                          {dept.department}
                          {isSelected && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-[#7655F7] text-white font-bold">
                              Selected
                            </span>
                          )}
                        </span>
                        <span className="text-slate-500 font-semibold text-[11px]">
                          {dept.completed}/{dept.total} ({dept.completionRate}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-[#7655F7] to-[#A18BFF] h-2 rounded-full transition-all duration-700 ease-out"
                          style={{ width: `${dept.completionRate}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-xs text-slate-400 text-center py-12">No department records yet</p>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span className="font-medium">Total Tracked</span>
              <span className="font-bold text-[#17182B]">{departments?.length || 0} Departments</span>
            </div>
          </Card>
        </div>
      )}

      {/* Recent Tasks List with Interactive 1-Click Status Toggling */}
      <Card
        noPadding
        className="card-interactive"
        title={isEmployee ? 'My Active Tasks' : 'Recent Onboarding Tasks'}
        subtitle={
          selectedDeptFilter
            ? `Showing active tasks filtered for ${selectedDeptFilter}`
            : 'Interactive checklist items — click the circle to toggle completion state'
        }
        action={
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/dashboard/tasks')}
            rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
          >
            View all tasks
          </Button>
        }
      >
        <div className="divide-y divide-slate-100">
          {myTasks?.content && myTasks.content.length > 0 ? (
            myTasks.content.map((task) => {
              const isCompleted = task.status === 'COMPLETED';
              return (
                <div
                  key={task.id}
                  className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/80 transition-colors group"
                >
                  {/* Interactive Checkbox + Title + Description */}
                  <div className="flex items-start sm:items-center gap-3.5 flex-1 min-w-0">
                    <button
                      onClick={() => handleToggleTask(task.id, task.status)}
                      title={isCompleted ? 'Mark incomplete' : 'Mark complete'}
                      className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all cursor-pointer shrink-0 mt-0.5 sm:mt-0 ${
                        isCompleted
                          ? 'bg-[#18B89A] border-[#18B89A] text-white shadow-xs'
                          : 'border-slate-300 hover:border-[#7655F7] text-transparent hover:text-slate-300'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </button>

                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`text-sm font-bold transition-all ${
                            isCompleted ? 'line-through text-slate-400' : 'text-[#17182B]'
                          }`}
                        >
                          {task.title}
                        </span>
                        <Badge variant="purple" size="sm">{task.category}</Badge>
                        {task.overdue && !isCompleted && (
                          <Badge variant="danger" size="sm">OVERDUE</Badge>
                        )}
                        {task.documentRequired && (
                          <span className="text-[10px] font-semibold text-violet-600 bg-violet-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <FileText className="w-2.5 h-2.5" /> Doc required
                          </span>
                        )}
                      </div>
                      {task.description && (
                        <p className="text-xs text-slate-500 line-clamp-1">{task.description}</p>
                      )}
                    </div>
                  </div>

                  {/* Inline Due Date and Status Badge */}
                  <div className="flex items-center gap-5 shrink-0 sm:justify-end">
                    <div className="text-xs text-slate-500 flex items-center gap-1.5 w-32 shrink-0">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{task.dueDate ? `Due: ${task.dueDate}` : 'No deadline'}</span>
                    </div>

                    <div className="w-32 shrink-0 flex justify-end">
                      <StatusBadge status={task.status} />
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-xs text-slate-400 text-center py-10">No active tasks found</p>
          )}
        </div>
      </Card>
    </div>
  );
};

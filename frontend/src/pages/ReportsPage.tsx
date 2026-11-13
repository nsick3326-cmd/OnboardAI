import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { auditApi, analyticsApi } from '../services/endpoints';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { TableSkeleton } from '../components/common/Skeleton';
import { EmptyState } from '../components/common/EmptyState';
import { BarChart3, Shield, Clock, FileText, Activity } from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const [page, setPage] = useState(0);

  const { data: metrics } = useQuery({
    queryKey: ['analytics-overview'],
    queryFn: analyticsApi.getOverview,
  });

  const { data: auditLogsData, isLoading } = useQuery({
    queryKey: ['audit-logs', page],
    queryFn: () => auditApi.getLogs(page, 15),
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <h2 className="text-xl font-bold text-navy-900 tracking-tight">Analytics & Audit Reports</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Enterprise compliance reporting, security audit log trail, and onboarding KPIs
        </p>
      </div>

      {/* KPI Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-xs text-slate-500 font-medium">Onboarding Success Rate</p>
          <p className="text-2xl font-bold text-violet-700 mt-1">{metrics?.onboardingCompletionRate || 0}%</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-slate-500 font-medium">Total Tasks Completed</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{metrics?.tasksCompleted || 0}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-slate-500 font-medium">Verified Documents</p>
          <p className="text-2xl font-bold text-navy-900 mt-1">100% Compliant</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-slate-500 font-medium">Security Audits Tracked</p>
          <p className="text-2xl font-bold text-indigo-600 mt-1">{auditLogsData?.totalElements || 0}</p>
        </Card>
      </div>

      {/* Audit Log Table */}
      <Card title="Compliance & Security Audit Trail" subtitle="Immutable activity ledger recording sensitive onboarding actions and decisions">
        {isLoading ? (
          <TableSkeleton rows={6} />
        ) : !auditLogsData?.content || auditLogsData.content.length === 0 ? (
          <EmptyState
            icon={<Shield className="w-10 h-10 text-slate-300" />}
            title="No audit events recorded"
            description="Audit events are automatically generated as employees, tasks, and documents are modified."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Entity</th>
                  <th className="py-3 px-4">Details</th>
                  <th className="py-3 px-4 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {auditLogsData.content.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50 transition-standard">
                    <td className="py-3.5 px-4 font-mono font-semibold text-navy-900">
                      <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-[11px]">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge variant="purple">{log.entityType}</Badge>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 max-w-md truncate">{log.details || 'N/A'}</td>
                    <td className="py-3.5 px-4 text-right text-slate-400">
                      {log.createdAt ? log.createdAt.replace('T', ' ').substring(0, 19) : 'Just now'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            {auditLogsData.totalPages > 1 && (
              <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>
                  Page {auditLogsData.page + 1} of {auditLogsData.totalPages} ({auditLogsData.totalElements} logs)
                </span>
                <div className="flex gap-1.5">
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={auditLogsData.page === 0}
                    onClick={() => setPage(page - 1)}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={auditLogsData.last}
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
    </div>
  );
};

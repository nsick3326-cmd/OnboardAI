import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { approvalsApi } from '../services/endpoints';
import { useAuth } from '../hooks/useAuth';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Modal } from '../components/common/Modal';
import { StatusBadge } from '../components/common/Badge';
import { TableSkeleton } from '../components/common/Skeleton';
import { EmptyState } from '../components/common/EmptyState';
import { ApprovalItem, ApprovalStatus } from '../types';
import { CheckCircle2, XCircle, FileText, CheckSquare, MessageSquare, Clock } from 'lucide-react';

export const ApprovalsPage: React.FC = () => {
  const { user, isHr, isManager } = useAuth();
  const queryClient = useQueryClient();

  const [statusFilter, setStatusFilter] = useState<string>('PENDING');
  const [page, setPage] = useState(0);

  // Decision Modal
  const [activeItem, setActiveItem] = useState<{ item: ApprovalItem; action: 'APPROVE' | 'REJECT' } | null>(null);
  const [comments, setComments] = useState('');

  const { data: approvalsData, isLoading } = useQuery({
    queryKey: ['approvals', statusFilter, page],
    queryFn: () =>
      approvalsApi.getApprovals((statusFilter as ApprovalStatus) || undefined, page, 15),
  });

  const approveMutation = useMutation({
    mutationFn: ({ id, comments }: { id: string; comments: string }) =>
      approvalsApi.approve(id, comments),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approvals'] });
      queryClient.invalidateQueries({ queryKey: ['analytics-overview'] });
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      setActiveItem(null);
      setComments('');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, comments }: { id: string; comments: string }) =>
      approvalsApi.reject(id, comments),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approvals'] });
      queryClient.invalidateQueries({ queryKey: ['analytics-overview'] });
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      setActiveItem(null);
      setComments('');
    },
  });

  const handleDecisionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeItem) return;

    if (activeItem.action === 'APPROVE') {
      approveMutation.mutate({ id: activeItem.item.id, comments: comments || 'Approved' });
    } else {
      rejectMutation.mutate({ id: activeItem.item.id, comments: comments || 'Rejected' });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <h2 className="text-xl font-bold text-navy-900 tracking-tight">Approvals Inbox</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Review, sign off, and verify pending onboarding requests and document submissions
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex bg-white p-1.5 rounded-xl border border-slate-200 w-fit text-xs font-semibold">
        <button
          onClick={() => {
            setStatusFilter('PENDING');
            setPage(0);
          }}
          className={`px-4 py-1.5 rounded-lg transition-standard ${
            statusFilter === 'PENDING' ? 'bg-violet-600 text-white shadow-xs' : 'text-slate-600 hover:text-navy-900'
          }`}
        >
          Pending Review
        </button>
        <button
          onClick={() => {
            setStatusFilter('APPROVED');
            setPage(0);
          }}
          className={`px-4 py-1.5 rounded-lg transition-standard ${
            statusFilter === 'APPROVED' ? 'bg-violet-600 text-white shadow-xs' : 'text-slate-600 hover:text-navy-900'
          }`}
        >
          Approved
        </button>
        <button
          onClick={() => {
            setStatusFilter('REJECTED');
            setPage(0);
          }}
          className={`px-4 py-1.5 rounded-lg transition-standard ${
            statusFilter === 'REJECTED' ? 'bg-violet-600 text-white shadow-xs' : 'text-slate-600 hover:text-navy-900'
          }`}
        >
          Rejected
        </button>
        <button
          onClick={() => {
            setStatusFilter('');
            setPage(0);
          }}
          className={`px-4 py-1.5 rounded-lg transition-standard ${
            statusFilter === '' ? 'bg-violet-600 text-white shadow-xs' : 'text-slate-600 hover:text-navy-900'
          }`}
        >
          All History
        </button>
      </div>

      {/* Approvals Table */}
      <Card>
        {isLoading ? (
          <TableSkeleton rows={5} />
        ) : !approvalsData?.content || approvalsData.content.length === 0 ? (
          <EmptyState
            icon={<CheckCircle2 className="w-10 h-10 text-slate-300" />}
            title="Approvals queue is clear"
            description="There are no pending approval requests matching your filter criteria."
          />
        ) : (
          <div className="divide-y divide-slate-100">
            {approvalsData.content.map((item) => (
              <div
                key={item.id}
                className="p-4 hover:bg-slate-50/60 transition-standard flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-navy-900 text-sm">
                      {item.documentName || item.taskTitle || 'Onboarding Request'}
                    </span>
                    <StatusBadge status={item.status} />
                  </div>

                  <p className="text-xs text-slate-500">
                    Employee: <span className="font-medium text-navy-900">{item.employeeName}</span> | Requested by:{' '}
                    <span className="font-medium text-navy-900">{item.requestedByName || 'Employee'}</span>
                  </p>

                  {item.comments && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100 mt-1">
                      <MessageSquare className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{item.comments}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-[11px] text-slate-400 pt-0.5">
                    <Clock className="w-3 h-3" />
                    <span>Submitted: {item.createdAt ? item.createdAt.split('T')[0] : 'Today'}</span>
                    {item.decisionAt && <span>• Decided: {item.decisionAt.split('T')[0]}</span>}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  {item.status === 'PENDING' ? (
                    <>
                      <Button
                        variant="violet"
                        size="sm"
                        leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
                        onClick={() => {
                          setActiveItem({ item, action: 'APPROVE' });
                          setComments('Approved after review');
                        }}
                      >
                        Approve
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        className="text-rose-600 hover:bg-rose-50"
                        leftIcon={<XCircle className="w-3.5 h-3.5" />}
                        onClick={() => {
                          setActiveItem({ item, action: 'REJECT' });
                          setComments('');
                        }}
                      >
                        Reject
                      </Button>
                    </>
                  ) : (
                    <span className="text-xs text-slate-400 italic">Decision Recorded</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Decision Modal */}
      {activeItem && (
        <Modal
          isOpen={!!activeItem}
          onClose={() => setActiveItem(null)}
          title={activeItem.action === 'APPROVE' ? 'Approve Item' : 'Reject Item'}
          description={`Submit your formal decision for ${activeItem.item.documentName || activeItem.item.taskTitle}`}
        >
          <form onSubmit={handleDecisionSubmit} className="space-y-4">
            <Input
              label="Decision Comments"
              placeholder={activeItem.action === 'APPROVE' ? 'Approved, all requirements met.' : 'Reason for rejection...'}
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              required={activeItem.action === 'REJECT'}
            />

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
              <Button type="button" variant="secondary" onClick={() => setActiveItem(null)}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant={activeItem.action === 'APPROVE' ? 'violet' : 'danger'}
                isLoading={approveMutation.isPending || rejectMutation.isPending}
              >
                Confirm {activeItem.action === 'APPROVE' ? 'Approval' : 'Rejection'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

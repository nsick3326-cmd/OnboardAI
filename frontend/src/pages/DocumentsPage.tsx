import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { documentsApi, employeesApi } from '../services/endpoints';
import { useAuth } from '../hooks/useAuth';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Select } from '../components/common/Select';
import { Input } from '../components/common/Input';
import { Modal } from '../components/common/Modal';
import { StatusBadge, Badge } from '../components/common/Badge';
import { TableSkeleton } from '../components/common/Skeleton';
import { EmptyState } from '../components/common/EmptyState';
import { DocumentItem, DocumentVerificationStatus } from '../types';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  UploadCloud,
  Download,
  CheckCircle,
  XCircle,
  Sparkles,
  AlertCircle,
  Calendar,
  Eye,
} from 'lucide-react';

export const DocumentsPage: React.FC = () => {
  const { user, isHr, isEmployee } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [statusFilter, setStatusFilter] = useState<string>('');
  const [page, setPage] = useState(0);

  // Upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState('ID_PROOF');
  const [targetEmployeeId, setTargetEmployeeId] = useState(user?.employeeId || '');
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Reject modal
  const [rejectDoc, setRejectDoc] = useState<DocumentItem | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const { data: employeesData } = useQuery({
    queryKey: ['employees-for-docs'],
    queryFn: () => employeesApi.getEmployees({ page: 0, size: 50 }),
    enabled: isHr,
  });

  const { data: documentsData, isLoading } = useQuery({
    queryKey: ['documents', statusFilter, page],
    queryFn: () =>
      isEmployee && user?.employeeId
        ? documentsApi.getEmployeeDocuments(user.employeeId).then((docs) => ({
            content: docs,
            page: 0,
            size: docs.length,
            totalElements: docs.length,
            totalPages: 1,
            last: true,
          }))
        : documentsApi.getAllDocuments((statusFilter as DocumentVerificationStatus) || undefined, page, 15),
  });

  const uploadMutation = useMutation({
    mutationFn: ({ empId, type, file }: { empId: string; type: string; file: File }) =>
      documentsApi.uploadDocument(empId, type, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      queryClient.invalidateQueries({ queryKey: ['analytics-overview'] });
      setSelectedFile(null);
      setUploadError(null);
    },
    onError: (err: any) => {
      setUploadError(err.response?.data?.message || 'File upload failed. Ensure size is under 10MB.');
    },
  });

  const verifyMutation = useMutation({
    mutationFn: documentsApi.verifyDocument,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      queryClient.invalidateQueries({ queryKey: ['analytics-overview'] });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      documentsApi.rejectDocument(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      queryClient.invalidateQueries({ queryKey: ['analytics-overview'] });
      setRejectDoc(null);
      setRejectReason('');
    },
  });

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setUploadError(null);
    const empId = isEmployee ? user?.employeeId : targetEmployeeId;
    if (!empId) {
      setUploadError('Please select a valid employee record.');
      return;
    }
    if (!selectedFile) {
      setUploadError('Please choose a file to upload.');
      return;
    }
    uploadMutation.mutate({ empId, type: documentType, file: selectedFile });
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-navy-900 tracking-tight">Document Center</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Secure onboarding document repository, identification proof, and verification audit trail
        </p>
      </div>

      {/* Upload Box */}
      <Card title="Upload Document" subtitle="Supported formats: PDF, PNG, JPG, TXT, DOCX (Max 10MB)">
        <form onSubmit={handleUploadSubmit} className="space-y-4">
          {uploadError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{uploadError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {isHr && (
              <Select
                label="Target Employee"
                value={targetEmployeeId}
                onChange={(e) => setTargetEmployeeId(e.target.value)}
                options={[
                  { label: '-- Select Employee --', value: '' },
                  ...(employeesData?.content.map((emp) => ({
                    label: `${emp.fullName || emp.employeeCode} (${emp.employeeCode})`,
                    value: emp.id,
                  })) || []),
                ]}
                required
              />
            )}

            <Select
              label="Document Type"
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value)}
              options={[
                { label: 'Government Photo ID / Passport', value: 'ID_PROOF' },
                { label: 'W-4 Tax Withholding Form', value: 'TAX_FORM' },
                { label: 'Signed Offer Letter / Agreement', value: 'OFFER_LETTER' },
                { label: 'Non-Disclosure Agreement (NDA)', value: 'NDA' },
                { label: 'Direct Deposit Authorization', value: 'DIRECT_DEPOSIT' },
                { label: 'Degree / Certificate', value: 'CERTIFICATE' },
                { label: 'Other Onboarding Document', value: 'GENERAL' },
              ]}
            />

            <div>
              <label className="block text-xs font-semibold text-navy-800 mb-1.5">Select File</label>
              <input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.txt,.docx"
                onChange={(e) => setSelectedFile(e.target.files ? e.target.files[0] : null)}
                className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100 cursor-pointer"
                required
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              variant="violet"
              leftIcon={<UploadCloud className="w-4 h-4" />}
              isLoading={uploadMutation.isPending}
            >
              Upload Document
            </Button>
          </div>
        </form>
      </Card>

      {/* Filter bar */}
      {!isEmployee && (
        <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-200 text-xs">
          <span className="font-semibold text-navy-900">Verification Filter</span>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(0);
            }}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none"
          >
            <option value="">All Verification Statuses</option>
            <option value="PENDING">Pending Review</option>
            <option value="VERIFIED">Verified</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
      )}

      {/* Documents Table */}
      <Card>
        {isLoading ? (
          <TableSkeleton rows={5} />
        ) : !documentsData?.content || documentsData.content.length === 0 ? (
          <EmptyState
            icon={<FileText className="w-10 h-10 text-slate-300" />}
            title="No documents uploaded"
            description="Use the uploader above to securely submit onboarding documents."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Document</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Size</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {documentsData.content.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50/50 transition-standard">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-semibold text-navy-900 truncate max-w-xs">{doc.originalFilename}</p>
                          <p className="text-[11px] text-slate-400">
                            {doc.createdAt ? doc.createdAt.split('T')[0] : 'Today'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge variant="purple">{doc.documentType}</Badge>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-navy-900">{doc.employeeName || 'Assigned'}</td>
                    <td className="py-3.5 px-4 text-slate-500">{formatFileSize(doc.fileSize)}</td>
                    <td className="py-3.5 px-4">
                      <div className="space-y-0.5">
                        <StatusBadge status={doc.verificationStatus} />
                        {doc.rejectionReason && (
                          <p className="text-[10px] text-rose-600 line-clamp-1">{doc.rejectionReason}</p>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <a
                          href={documentsApi.downloadDocumentUrl(doc.id)}
                          target="_blank"
                          rel="noreferrer"
                          download
                        >
                          <Button variant="secondary" size="sm" leftIcon={<Download className="w-3.5 h-3.5" />}>
                            Download
                          </Button>
                        </a>

                        {isHr && doc.verificationStatus === 'PENDING' && (
                          <>
                            <Button
                              variant="violet"
                              size="sm"
                              leftIcon={<CheckCircle className="w-3.5 h-3.5" />}
                              onClick={() => verifyMutation.mutate(doc.id)}
                            >
                              Verify
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-rose-600 hover:bg-rose-50"
                              onClick={() => {
                                setRejectDoc(doc);
                                setRejectReason('');
                              }}
                            >
                              Reject
                            </Button>
                          </>
                        )}

                        {isHr && (
                          <Button
                            variant="secondary"
                            size="sm"
                            leftIcon={<Sparkles className="w-3.5 h-3.5 text-violet-600" />}
                            onClick={() => navigate('/dashboard/ai')}
                            title="Extract Info with AI"
                          >
                            AI
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Reject Modal */}
      {rejectDoc && (
        <Modal
          isOpen={!!rejectDoc}
          onClose={() => setRejectDoc(null)}
          title="Reject Document"
          description={`Explain why ${rejectDoc.originalFilename} is rejected so the employee can resubmit.`}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (rejectDoc) rejectMutation.mutate({ id: rejectDoc.id, reason: rejectReason });
            }}
            className="space-y-4"
          >
            <Input
              label="Rejection Reason"
              placeholder="e.g. Incomplete signature on page 2 or image too blurry..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              required
            />

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
              <Button type="button" variant="secondary" onClick={() => setRejectDoc(null)}>
                Cancel
              </Button>
              <Button type="submit" variant="danger" isLoading={rejectMutation.isPending} disabled={!rejectReason}>
                Confirm Rejection
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

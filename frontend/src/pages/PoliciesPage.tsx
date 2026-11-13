import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { policiesApi } from '../services/endpoints';
import { useAuth } from '../hooks/useAuth';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Select } from '../components/common/Select';
import { Modal } from '../components/common/Modal';
import { Badge } from '../components/common/Badge';
import { Skeleton } from '../components/common/Skeleton';
import { EmptyState } from '../components/common/EmptyState';
import { CompanyPolicy } from '../types';
import { BookOpen, Plus, Sparkles, CheckCircle, FileText, Layers, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const PoliciesPage: React.FC = () => {
  const { isHr } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [selectedPolicy, setSelectedPolicy] = useState<CompanyPolicy | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const [createForm, setCreateForm] = useState({
    title: '',
    category: 'BENEFITS',
    description: '',
    content: '',
  });

  const { data: policiesData, isLoading } = useQuery({
    queryKey: ['policies'],
    queryFn: () => policiesApi.getPolicies(0, 50),
  });

  const createPolicyMutation = useMutation({
    mutationFn: policiesApi.createPolicy,
    onSuccess: (newPolicy) => {
      queryClient.invalidateQueries({ queryKey: ['policies'] });
      setIsCreateModalOpen(false);
      setSelectedPolicy(newPolicy);
      setCreateForm({ title: '', category: 'BENEFITS', description: '', content: '' });
    },
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createPolicyMutation.mutate(createForm);
  };

  const currentPolicy = selectedPolicy || (policiesData?.content && policiesData.content[0]) || null;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-navy-900 tracking-tight">Company Policies & Knowledge Base</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Approved workplace guidelines, health benefits, leave policies, and security handbooks
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            leftIcon={<Sparkles className="w-4 h-4 text-violet-600" />}
            onClick={() => navigate('/dashboard/ai')}
          >
            Ask AI Assistant
          </Button>
          {isHr && (
            <Button
              variant="violet"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={() => setIsCreateModalOpen(true)}
            >
              Add Policy
            </Button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-96 w-full" />
          <Skeleton className="h-96 md:col-span-2 w-full" />
        </div>
      ) : !policiesData?.content || policiesData.content.length === 0 ? (
        <EmptyState
          icon={<BookOpen className="w-10 h-10 text-slate-300" />}
          title="No company policies published"
          description="Publish employee handbooks to enable self-service policy exploration and RAG assistant answering."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Policy Handbook Selector (Left column) */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 px-1">
              Policy Handbooks ({policiesData.totalElements})
            </h3>
            <div className="space-y-2">
              {policiesData.content.map((p) => {
                const isSelected = currentPolicy?.id === p.id;
                return (
                  <div
                    key={p.id}
                    onClick={() => setSelectedPolicy(p)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-standard ${
                      isSelected
                        ? 'bg-violet-50/80 border-violet-300 shadow-xs'
                        : 'bg-white border-slate-200/80 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <span className="font-semibold text-xs text-navy-900">{p.title}</span>
                      <Badge variant="purple">{p.category}</Badge>
                    </div>
                    {p.description && <p className="text-[11px] text-slate-500 line-clamp-2">{p.description}</p>}
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-2">
                      <Layers className="w-3 h-3 text-violet-500" />
                      <span>{p.chunkCount || 1} RAG Chunks indexed</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Policy Document Reader (Right column) */}
          <div className="md:col-span-2">
            {currentPolicy ? (
              <Card>
                <div className="flex items-start justify-between border-b border-slate-100 pb-4 mb-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-navy-900">{currentPolicy.title}</h3>
                      <Badge variant="success">{currentPolicy.status}</Badge>
                    </div>
                    <p className="text-xs text-slate-500">{currentPolicy.description}</p>
                  </div>
                </div>

                {/* Markdown text reader */}
                <div className="prose prose-sm max-w-none text-navy-800 leading-relaxed font-sans text-xs space-y-3 bg-slate-50/50 p-4 rounded-xl border border-slate-100 max-h-[500px] overflow-y-auto">
                  <pre className="whitespace-pre-wrap font-sans text-xs text-navy-800">
                    {currentPolicy.content}
                  </pre>
                </div>
              </Card>
            ) : (
              <Card className="flex items-center justify-center p-12 text-slate-400 text-xs">
                Select a policy to read content
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Add Policy Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Add Company Policy Handbook"
        description="Text will be automatically chunked and indexed into the RAG vector/lexical retrieval engine"
        maxWidth="xl"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <Input
            label="Policy Title"
            placeholder="e.g. Employee Benefits & Leave Policy"
            value={createForm.title}
            onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Category"
              value={createForm.category}
              onChange={(e) => setCreateForm({ ...createForm, category: e.target.value })}
              options={[
                { label: 'Benefits & Perks', value: 'BENEFITS' },
                { label: 'IT & Security', value: 'IT_SECURITY' },
                { label: 'Time Off & Leave', value: 'TIME_OFF' },
                { label: 'Code of Conduct', value: 'CODE_OF_CONDUCT' },
                { label: 'General Guidelines', value: 'GENERAL' },
              ]}
            />
            <Input
              label="Brief Description"
              placeholder="e.g. PTO rules, sick days, rollover"
              value={createForm.description}
              onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-navy-800 mb-1.5">
              Policy Content (Markdown supported)
            </label>
            <textarea
              rows={8}
              placeholder="# Section Header&#10;&#10;Detailed rules and terms..."
              value={createForm.content}
              onChange={(e) => setCreateForm({ ...createForm, content: e.target.value })}
              className="w-full px-3.5 py-2 text-xs font-mono text-navy-900 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <Button type="button" variant="secondary" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="violet" isLoading={createPolicyMutation.isPending}>
              Ingest & Index Policy
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

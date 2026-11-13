import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { aiApi, documentsApi, employeesApi, tasksApi } from '../services/endpoints';
import { useAuth } from '../hooks/useAuth';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Select } from '../components/common/Select';
import { Badge } from '../components/common/Badge';
import { FallbackIndicator } from '../components/common/FallbackIndicator';
import { EmptyState } from '../components/common/EmptyState';
import {
  DocumentExtractionResult,
  ChecklistGenerationResult,
  ChecklistSuggestion,
  PolicyAnswerResult,
  CopilotAnswerResult,
} from '../types';
import {
  Sparkles,
  FileSearch,
  ListChecks,
  HelpCircle,
  Bot,
  CheckCircle,
  AlertCircle,
  Send,
  Check,
  Plus,
  BookOpen,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

export const AiAssistantPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isHr } = useAuth();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'EXTRACT' | 'CHECKLIST' | 'RAG' | 'COPILOT'>('RAG');

  // --- Feature A: Document Extraction State ---
  const [selectedDocId, setSelectedDocId] = useState('');
  const [extractionResult, setExtractionResult] = useState<DocumentExtractionResult | null>(null);

  // --- Feature B: Checklist Generator State ---
  const [checklistEmployeeId, setChecklistEmployeeId] = useState('');
  const [checklistFocus, setChecklistFocus] = useState('Remote onboarding and security credentials');
  const [checklistResult, setChecklistResult] = useState<ChecklistGenerationResult | null>(null);
  const [selectedSuggestionIds, setSelectedSuggestionIds] = useState<Set<string>>(new Set());
  const [checklistCommitted, setChecklistCommitted] = useState(false);

  // --- Feature C: Policy Assistant (RAG) State ---
  const [policyQuestion, setPolicyQuestion] = useState('What equipment and reimbursement is provided to new hires?');
  const [policyHistory, setPolicyHistory] = useState<{ q: string; a: PolicyAnswerResult }[]>([]);

  // --- Feature D: Copilot State ---
  const [copilotQuestion, setCopilotQuestion] = useState('What should I do next to complete my onboarding?');
  const [copilotHistory, setCopilotHistory] = useState<{ q: string; a: CopilotAnswerResult }[]>([]);

  // Queries for selectors
  const { data: documentsData } = useQuery({
    queryKey: ['documents-for-ai'],
    queryFn: () => documentsApi.getAllDocuments(undefined, 0, 50),
    enabled: isHr,
  });

  const { data: employeesData } = useQuery({
    queryKey: ['employees-for-ai'],
    queryFn: () => employeesApi.getEmployees({ page: 0, size: 50 }),
    enabled: isHr,
  });

  // Mutations
  const extractMutation = useMutation({
    mutationFn: aiApi.extractDocument,
    onSuccess: (data) => {
      setExtractionResult(data);
    },
  });

  const checklistMutation = useMutation({
    mutationFn: ({ empId, focus }: { empId: string; focus: string }) =>
      aiApi.generateChecklist(empId, focus),
    onSuccess: (data) => {
      setChecklistResult(data);
      setChecklistCommitted(false);
      // Select all suggestions by default
      const allIds = new Set(data.suggestions.map((s) => s.id));
      setSelectedSuggestionIds(allIds);
    },
  });

  const approveChecklistMutation = useMutation({
    mutationFn: ({ empId, items }: { empId: string; items: ChecklistSuggestion[] }) =>
      aiApi.approveChecklist(empId, items),
    onSuccess: () => {
      setChecklistCommitted(true);
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['analytics-overview'] });
    },
  });

  const policyMutation = useMutation({
    mutationFn: aiApi.askPolicyAssistant,
    onSuccess: (data, question) => {
      setPolicyHistory([{ q: question, a: data }, ...policyHistory]);
      setPolicyQuestion('');
    },
  });

  const copilotMutation = useMutation({
    mutationFn: (q: string) => aiApi.askCopilot(q),
    onSuccess: (data, question) => {
      setCopilotHistory([{ q: question, a: data }, ...copilotHistory]);
      setCopilotQuestion('');
    },
  });

  // Handlers
  const handleToggleSuggestion = (id: string) => {
    const updated = new Set(selectedSuggestionIds);
    if (updated.has(id)) {
      updated.delete(id);
    } else {
      updated.add(id);
    }
    setSelectedSuggestionIds(updated);
  };

  const handleCommitChecklist = () => {
    if (!checklistResult || !checklistEmployeeId) return;
    const selected = checklistResult.suggestions.filter((s) => selectedSuggestionIds.has(s.id));
    if (selected.length === 0) return;
    approveChecklistMutation.mutate({ empId: checklistEmployeeId, items: selected });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-violet-100 text-violet-700 mb-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Intelligence Suite</span>
          </div>
          <h2 className="text-xl font-bold text-navy-900 tracking-tight">OnboardAI Assistant</h2>
          <p className="text-xs text-slate-500">
            Document extraction, personalized checklist synthesis, policy RAG, and employee copilot
          </p>
        </div>
      </div>

      {/* Feature Navigation Tabs */}
      <div className="flex bg-white p-1.5 rounded-2xl border border-slate-200/80 shadow-xs overflow-x-auto text-xs font-semibold">
        <button
          onClick={() => setActiveTab('RAG')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-standard shrink-0 ${
            activeTab === 'RAG' ? 'bg-violet-600 text-white shadow-xs' : 'text-slate-600 hover:text-navy-900'
          }`}
        >
          <HelpCircle className="w-4 h-4" />
          <span>Policy Assistant (RAG)</span>
        </button>

        <button
          onClick={() => setActiveTab('COPILOT')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-standard shrink-0 ${
            activeTab === 'COPILOT' ? 'bg-violet-600 text-white shadow-xs' : 'text-slate-600 hover:text-navy-900'
          }`}
        >
          <Bot className="w-4 h-4" />
          <span>Employee Copilot</span>
        </button>

        {isHr && (
          <>
            <button
              onClick={() => setActiveTab('EXTRACT')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-standard shrink-0 ${
                activeTab === 'EXTRACT' ? 'bg-violet-600 text-white shadow-xs' : 'text-slate-600 hover:text-navy-900'
              }`}
            >
              <FileSearch className="w-4 h-4" />
              <span>Document Extraction</span>
            </button>

            <button
              onClick={() => setActiveTab('CHECKLIST')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-standard shrink-0 ${
                activeTab === 'CHECKLIST' ? 'bg-violet-600 text-white shadow-xs' : 'text-slate-600 hover:text-navy-900'
              }`}
            >
              <ListChecks className="w-4 h-4" />
              <span>Personalized Checklist</span>
            </button>
          </>
        )}
      </div>

      {/* ========================================================================= */}
      {/* TAB A: DOCUMENT EXTRACTION */}
      {/* ========================================================================= */}
      {activeTab === 'EXTRACT' && (
        <div className="space-y-6">
          <FallbackIndicator
            isFallback={extractionResult ? extractionResult.fallback : true}
            provider={extractionResult?.provider}
          />

          <Card title="Feature A: Document Information Extraction" subtitle="Extract and verify structured candidate details from uploaded identity & onboarding files">
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <Select
                    label="Select Document for AI Processing"
                    value={selectedDocId}
                    onChange={(e) => setSelectedDocId(e.target.value)}
                    options={[
                      { label: '-- Select an Uploaded Document --', value: '' },
                      ...(documentsData?.content.map((d) => ({
                        label: `${d.originalFilename} (${d.documentType} - ${d.employeeName || 'Assigned'})`,
                        value: d.id,
                      })) || []),
                    ]}
                  />
                </div>
                <div className="sm:self-end">
                  <Button
                    variant="violet"
                    leftIcon={<Sparkles className="w-4 h-4" />}
                    onClick={() => selectedDocId && extractMutation.mutate(selectedDocId)}
                    isLoading={extractMutation.isPending}
                    disabled={!selectedDocId}
                  >
                    Extract Fields
                  </Button>
                </div>
              </div>

              {extractionResult && (
                <div className="pt-4 border-t border-slate-100 space-y-4 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-navy-900">Extracted Structured Fields</h4>
                      <p className="text-xs text-slate-500">{extractionResult.summary}</p>
                    </div>
                    <Badge variant="purple">Confidence: {Math.round(extractionResult.confidence * 100)}%</Badge>
                  </div>

                  {/* Side-by-Side Review Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-2.5">
                      <h5 className="font-semibold text-slate-400 uppercase tracking-wider text-[10px]">
                        Core Extracted Entities
                      </h5>
                      <div>
                        <span className="text-slate-500">Candidate Name:</span>
                        <p className="font-semibold text-navy-900">{extractionResult.candidateName || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-slate-500">Authority / Employer:</span>
                        <p className="font-semibold text-navy-900">{extractionResult.institutionOrEmployer || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-slate-500">Document Identifier:</span>
                        <p className="font-semibold text-navy-900">{extractionResult.documentNumber || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-slate-500">Issue Date:</span>
                        <p className="font-semibold text-navy-900">{extractionResult.issueDate || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-slate-500">Expiration Date:</span>
                        <p className="font-semibold text-navy-900">{extractionResult.expirationDate || 'N/A'}</p>
                      </div>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-2">
                      <h5 className="font-semibold text-slate-400 uppercase tracking-wider text-[10px]">
                        Field Attributes & Metadata
                      </h5>
                      {extractionResult.extractedFields && Object.keys(extractionResult.extractedFields).length > 0 ? (
                        Object.entries(extractionResult.extractedFields).map(([k, v]) => (
                          <div key={k} className="flex justify-between py-1 border-b border-slate-200/60 last:border-0">
                            <span className="text-slate-600 font-medium">{k}:</span>
                            <span className="font-semibold text-navy-900 text-right">{v}</span>
                          </div>
                        ))
                      ) : (
                        <p className="text-slate-400">No additional custom attributes detected.</p>
                      )}
                    </div>
                  </div>

                  <div className="p-3 bg-violet-50 rounded-xl border border-violet-100 flex items-center justify-between text-xs">
                    <span className="text-violet-900">
                      Extracted fields have been saved to document metadata. You can verify the document in the Document Center.
                    </span>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => navigate('/dashboard/documents')}
                      rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                    >
                      Go to Documents
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB B: PERSONALIZED CHECKLIST GENERATOR */}
      {/* ========================================================================= */}
      {activeTab === 'CHECKLIST' && (
        <div className="space-y-6">
          <FallbackIndicator
            isFallback={checklistResult ? checklistResult.fallback : true}
            provider={checklistResult?.provider}
          />

          <Card
            title="Feature B: Personalized Onboarding Checklist Generator"
            subtitle="AI synthesizes role and department-tailored task suggestions with business rationale for HR review"
          >
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select
                  label="Select New Employee"
                  value={checklistEmployeeId}
                  onChange={(e) => setChecklistEmployeeId(e.target.value)}
                  options={[
                    { label: '-- Select Employee --', value: '' },
                    ...(employeesData?.content.map((emp) => ({
                      label: `${emp.fullName || emp.employeeCode} (${emp.jobTitle} - ${emp.department})`,
                      value: emp.id,
                    })) || []),
                  ]}
                  required
                />

                <Input
                  label="Additional Custom Focus or Goal"
                  placeholder="e.g. Focus on security compliance and remote IT setup"
                  value={checklistFocus}
                  onChange={(e) => setChecklistFocus(e.target.value)}
                />
              </div>

              <div className="flex justify-end">
                <Button
                  variant="violet"
                  leftIcon={<Sparkles className="w-4 h-4" />}
                  onClick={() =>
                    checklistEmployeeId &&
                    checklistMutation.mutate({ empId: checklistEmployeeId, focus: checklistFocus })
                  }
                  isLoading={checklistMutation.isPending}
                  disabled={!checklistEmployeeId}
                >
                  Generate Checklist Suggestions
                </Button>
              </div>

              {/* Suggestions Review Table */}
              {checklistResult && (
                <div className="pt-6 border-t border-slate-100 space-y-4 animate-in fade-in">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h4 className="text-sm font-bold text-navy-900">
                        Suggested Tasks for {checklistResult.employeeName} ({checklistResult.role})
                      </h4>
                      <p className="text-xs text-slate-500">
                        Review and approve suggestions below before instantiating them as active onboarding tasks
                      </p>
                    </div>

                    <Button
                      variant="violet"
                      size="sm"
                      leftIcon={<Check className="w-3.5 h-3.5" />}
                      onClick={handleCommitChecklist}
                      isLoading={approveChecklistMutation.isPending}
                      disabled={selectedSuggestionIds.size === 0 || checklistCommitted}
                    >
                      {checklistCommitted
                        ? 'Approved & Saved to DB!'
                        : `Approve (${selectedSuggestionIds.size}) Tasks`}
                    </Button>
                  </div>

                  {checklistCommitted && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>
                        Tasks successfully approved and added to active employee assignment! View them in Task Management.
                      </span>
                    </div>
                  )}

                  <div className="space-y-3">
                    {checklistResult.suggestions.map((suggestion) => {
                      const isSelected = selectedSuggestionIds.has(suggestion.id);
                      return (
                        <div
                          key={suggestion.id}
                          onClick={() => !checklistCommitted && handleToggleSuggestion(suggestion.id)}
                          className={`p-4 rounded-xl border transition-standard cursor-pointer flex items-start gap-3.5 ${
                            isSelected
                              ? 'bg-violet-50/50 border-violet-300 shadow-xs'
                              : 'bg-white border-slate-200 opacity-60'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            disabled={checklistCommitted}
                            onChange={() => handleToggleSuggestion(suggestion.id)}
                            className="mt-1 rounded text-violet-600 focus:ring-0"
                          />

                          <div className="space-y-1 flex-1 text-xs">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-bold text-navy-900 text-sm">{suggestion.title}</span>
                              <Badge variant="purple">{suggestion.category}</Badge>
                              <Badge variant="warning">{suggestion.priority}</Badge>
                              <span className="text-[11px] text-slate-400">Due in +{suggestion.relativeDueDays} days</span>
                            </div>

                            <p className="text-slate-600 leading-relaxed">{suggestion.description}</p>

                            <div className="p-2 bg-slate-50 rounded-lg border border-slate-100 text-[11px] text-slate-500 mt-1">
                              <span className="font-semibold text-navy-900">AI Rationale: </span>
                              {suggestion.rationale}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB C: COMPANY POLICY ASSISTANT (RAG) */}
      {/* ========================================================================= */}
      {activeTab === 'RAG' && (
        <div className="space-y-6">
          <FallbackIndicator
            isFallback={policyHistory.length > 0 ? policyHistory[0].a.fallback : true}
            provider={policyHistory.length > 0 ? policyHistory[0].a.provider : undefined}
          />

          <Card
            title="Feature C: Company Policy Assistant (RAG)"
            subtitle="Ask questions about PTO, health benefits, remote stipends, and security guidelines. Answers are grounded in approved company policy chunks."
          >
            <div className="space-y-6">
              {/* Question Input */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (policyQuestion.trim()) policyMutation.mutate(policyQuestion.trim());
                }}
                className="flex gap-2"
              >
                <input
                  type="text"
                  placeholder="Ask a policy question (e.g. How many annual leave days do I get?)"
                  value={policyQuestion}
                  onChange={(e) => setPolicyQuestion(e.target.value)}
                  className="flex-1 px-4 py-2.5 text-xs text-navy-900 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500"
                  required
                />
                <Button
                  type="submit"
                  variant="violet"
                  leftIcon={<Send className="w-4 h-4" />}
                  isLoading={policyMutation.isPending}
                >
                  Ask
                </Button>
              </form>

              {/* Sample Quick Questions */}
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="text-slate-400 font-semibold">Try asking:</span>
                <button
                  type="button"
                  onClick={() => policyMutation.mutate('What equipment and reimbursement is provided?')}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-standard"
                >
                  Equipment & Reimbursement
                </button>
                <button
                  type="button"
                  onClick={() => policyMutation.mutate('How many PTO and sick days are available?')}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-standard"
                >
                  PTO & Sick Leave
                </button>
                <button
                  type="button"
                  onClick={() => policyMutation.mutate('What are the password and VPN requirements?')}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-standard"
                >
                  IT Security & VPN
                </button>
              </div>

              {/* Q&A Stream */}
              <div className="space-y-4">
                {policyHistory.length === 0 ? (
                  <div className="text-center py-10 bg-slate-50/50 rounded-2xl border border-slate-100">
                    <BookOpen className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-xs text-slate-500 font-medium">
                      Enter a question above to retrieve authorized policy context and citations.
                    </p>
                  </div>
                ) : (
                  policyHistory.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-7 h-7 rounded-full bg-navy-900 text-white font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">
                          Q
                        </div>
                        <h4 className="font-bold text-navy-900 text-sm">{item.q}</h4>
                      </div>

                      <div className="flex items-start gap-3 pl-2">
                        <div className="w-7 h-7 rounded-full bg-violet-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                          <Bot className="w-4 h-4" />
                        </div>
                        <div className="space-y-3 text-xs leading-relaxed text-navy-800 flex-1">
                          <div className="whitespace-pre-wrap font-sans bg-slate-50/80 p-4 rounded-xl border border-slate-100">
                            {item.a.answer}
                          </div>

                          {/* Grounded Citations */}
                          {item.a.citations && item.a.citations.length > 0 && (
                            <div className="space-y-2 pt-2 border-t border-slate-100">
                              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                                Grounded Policy Sources & Citations ({item.a.citations.length})
                              </p>
                              <div className="grid grid-cols-1 gap-2">
                                {item.a.citations.map((c, cIdx) => (
                                  <div
                                    key={cIdx}
                                    className="p-2.5 rounded-lg bg-violet-50/50 border border-violet-100 text-[11px] space-y-1"
                                  >
                                    <div className="font-semibold text-violet-900 flex items-center gap-1.5">
                                      <BookOpen className="w-3 h-3 text-violet-600" />
                                      <span>
                                        {c.policyTitle} {c.sectionTitle ? `— ${c.sectionTitle}` : ''}
                                      </span>
                                    </div>
                                    <p className="text-slate-600 italic line-clamp-2">"{c.snippet}"</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB D: EMPLOYEE ONBOARDING COPILOT */}
      {/* ========================================================================= */}
      {activeTab === 'COPILOT' && (
        <div className="space-y-6">
          <FallbackIndicator
            isFallback={copilotHistory.length > 0 ? copilotHistory[0].a.fallback : true}
            provider={copilotHistory.length > 0 ? copilotHistory[0].a.provider : undefined}
          />

          <Card
            title="Feature D: Employee Onboarding Copilot"
            subtitle="Get contextual explanations on your tasks, instructions, blocker assistance, and sensible next steps"
          >
            <div className="space-y-6">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (copilotQuestion.trim()) copilotMutation.mutate(copilotQuestion.trim());
                }}
                className="flex gap-2"
              >
                <input
                  type="text"
                  placeholder="Ask Copilot (e.g. How do I complete my identity verification task?)"
                  value={copilotQuestion}
                  onChange={(e) => setCopilotQuestion(e.target.value)}
                  className="flex-1 px-4 py-2.5 text-xs text-navy-900 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500"
                  required
                />
                <Button
                  type="submit"
                  variant="violet"
                  leftIcon={<Send className="w-4 h-4" />}
                  isLoading={copilotMutation.isPending}
                >
                  Send
                </Button>
              </form>

              {/* Copilot Q&A Stream */}
              <div className="space-y-4">
                {copilotHistory.length === 0 ? (
                  <div className="text-center py-10 bg-slate-50/50 rounded-2xl border border-slate-100">
                    <Bot className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-xs text-slate-500 font-medium">
                      Ask any question about your onboarding tasks, priorities, or what to do next.
                    </p>
                  </div>
                ) : (
                  copilotHistory.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-3"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-400">You asked:</span>
                        <span className="font-semibold text-navy-900 text-xs">{item.q}</span>
                      </div>

                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs text-navy-800 space-y-3">
                        <p className="leading-relaxed whitespace-pre-wrap">{item.a.answer}</p>

                        {item.a.suggestedNextSteps && item.a.suggestedNextSteps.length > 0 && (
                          <div className="space-y-1.5 pt-2 border-t border-slate-200/60">
                            <span className="text-[11px] font-semibold text-violet-700">Recommended Next Steps:</span>
                            <ul className="list-disc list-inside space-y-1 text-slate-600 text-[11px]">
                              {item.a.suggestedNextSteps.map((step, sIdx) => (
                                <li key={sIdx}>{step}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

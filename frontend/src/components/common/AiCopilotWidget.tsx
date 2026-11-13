import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, X, ArrowRight, MessageSquare, Bot, Send, HelpCircle, FileText, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { aiApi } from '../../services/endpoints';
import { useToast } from './Toast';

export const AiCopilotWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [question, setQuestion] = useState('');
  const [isAsking, setIsAsking] = useState(false);
  const [answer, setAnswer] = useState<string | null>(null);
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const handleAsk = async (promptText?: string) => {
    const query = promptText || question;
    if (!query.trim()) return;

    try {
      setIsAsking(true);
      setAnswer(null);
      const res = await aiApi.askCopilot(query.trim());
      setAnswer(res.answer || 'Here is the onboarding information you requested.');
    } catch (e: any) {
      toast.error('AI Assistant Error', e.response?.data?.message || 'Could not reach AI copilot service');
    } finally {
      setIsAsking(false);
    }
  };

  return (
    <>
      {/* Floating launcher button */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="group flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-gradient-to-r from-[#211B45] to-[#7655F7] text-white shadow-dropdown hover:shadow-card-hover hover:scale-105 active:scale-95 transition-all duration-200 border border-violet-400/30 cursor-pointer"
        >
          <div className="relative">
            <Sparkles className="w-4 h-4 text-violet-200 animate-pulse-glow" />
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[#18B89A] live-pulse" />
          </div>
          <span className="text-xs font-bold tracking-wide">AI Copilot</span>
          <span className="hidden sm:inline-block text-[10px] px-1.5 py-0.5 rounded-full bg-white/20 font-semibold">
            Ask
          </span>
        </button>
      </div>

      {/* Floating interactive slide-over card */}
      {isOpen && (
        <div className="fixed bottom-20 right-6 z-40 w-96 max-w-[calc(100vw-3rem)] bg-white rounded-2xl shadow-modal border border-slate-200/90 overflow-hidden animate-in slide-in-from-bottom-5 duration-200 flex flex-col">
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-[#211B45] to-[#362774] text-white flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-violet-400/20 border border-violet-400/30 flex items-center justify-center">
                <Bot className="w-4 h-4 text-[#A18BFF]" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                  OnboardAI Copilot
                  <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-teal-500/20 text-teal-300 font-semibold">Live</span>
                </h4>
                <p className="text-[10px] text-violet-200">Context-aware onboarding helper</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="p-4 space-y-3 max-h-80 overflow-y-auto">
            {answer ? (
              <div className="space-y-3 animate-in fade-in">
                <div className="p-3 bg-violet-50/70 border border-violet-100 rounded-xl text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {answer}
                </div>
                <div className="flex justify-between items-center pt-1">
                  <button
                    onClick={() => {
                      setAnswer(null);
                      setQuestion('');
                    }}
                    className="text-xs text-[#7655F7] font-semibold hover:underline"
                  >
                    ← Ask another question
                  </button>
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      navigate('/dashboard/ai');
                    }}
                    className="text-xs text-slate-500 hover:text-slate-800 font-medium flex items-center gap-1"
                  >
                    Open Full AI Hub <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ) : (
              <>
                <p className="text-xs text-slate-500">
                  Hi <span className="font-semibold text-slate-700">{user?.fullName?.split(' ')[0]}</span>! Need quick help? Choose a prompt or type below:
                </p>

                {/* Quick Prompts */}
                <div className="space-y-1.5">
                  {[
                    'What are my required onboarding tasks?',
                    'Explain our health insurance & 401(k) policy',
                    'How do I submit identity documents for review?',
                  ].map((prompt, i) => (
                    <button
                      key={i}
                      disabled={isAsking}
                      onClick={() => {
                        setQuestion(prompt);
                        handleAsk(prompt);
                      }}
                      className="w-full text-left p-2 rounded-xl bg-slate-50 hover:bg-violet-50/70 hover:text-[#7655F7] text-slate-700 text-xs font-medium border border-slate-100 transition-all flex items-center justify-between group cursor-pointer"
                    >
                      <span className="truncate pr-2">{prompt}</span>
                      <ArrowRight className="w-3 h-3 text-slate-400 group-hover:text-[#7655F7] group-hover:translate-x-0.5 transition-all shrink-0" />
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Footer Input */}
          {!answer && (
            <div className="p-3 border-t border-slate-100 bg-slate-50/50 flex items-center gap-2">
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
                placeholder="Ask anything about OnboardAI..."
                disabled={isAsking}
                className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
              />
              <button
                onClick={() => handleAsk()}
                disabled={isAsking || !question.trim()}
                className="p-2 rounded-xl bg-[#7655F7] hover:bg-[#6039EB] disabled:opacity-50 text-white transition-colors cursor-pointer shrink-0"
              >
                {isAsking ? (
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
};

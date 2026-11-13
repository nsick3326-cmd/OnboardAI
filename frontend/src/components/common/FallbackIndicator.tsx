import React from 'react';
import { AlertCircle, Cpu } from 'lucide-react';

interface FallbackIndicatorProps {
  isFallback?: boolean;
  provider?: string;
  className?: string;
}

export const FallbackIndicator: React.FC<FallbackIndicatorProps> = ({
  isFallback = true,
  provider = 'DEMO_FALLBACK (Deterministic Synthetic Engine)',
  className = '',
}) => {
  if (!isFallback) {
    return (
      <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200 ${className}`}>
        <Cpu className="w-3.5 h-3.5 text-emerald-600" />
        <span>Connected Model: {provider}</span>
      </div>
    );
  }

  return (
    <div className={`flex items-start gap-2.5 p-3 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-900 text-xs ${className}`}>
      <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
      <div>
        <div className="font-semibold flex items-center gap-2">
          <span>AI Demo / Fallback Mode Active</span>
          <span className="px-1.5 py-0.2 bg-amber-200/80 text-amber-800 rounded text-[10px] uppercase tracking-wider font-bold">
            Synthetic
          </span>
        </div>
        <p className="mt-0.5 text-amber-800/90 leading-relaxed">
          Active Provider: <code className="bg-amber-100/60 px-1 py-0.5 rounded font-mono">{provider}</code>.
          Real AI API key not configured in environment. The responses below are generated deterministically for evaluation.
        </p>
      </div>
    </div>
  );
};

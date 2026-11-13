import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'teal' | 'warning' | 'danger' | 'info' | 'purple' | 'violet' | 'indigo' | 'fallback';
  className?: string;
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  className = '',
  size = 'md',
}) => {
  const variantStyles = {
    default: 'bg-slate-100 text-[#727A91] border-slate-200/80',
    success: 'bg-teal-50 text-teal-700 border-teal-200/80 font-medium',
    teal: 'bg-teal-50 text-teal-700 border-teal-200/80 font-medium',
    warning: 'bg-amber-50 text-amber-700 border-amber-200/80 font-medium',
    danger: 'bg-rose-50 text-rose-700 border-rose-200/80 font-medium',
    info: 'bg-sky-50 text-sky-700 border-sky-200/80 font-medium',
    purple: 'bg-violet-50 text-[#7655F7] border-violet-200/80 font-medium',
    violet: 'bg-violet-50 text-[#7655F7] border-violet-200/80 font-medium',
    indigo: 'bg-indigo-50 text-indigo-900 border-indigo-200/80 font-semibold',
    fallback: 'bg-amber-100 text-amber-900 border-amber-300 font-semibold',
  };

  const sizeStyles = {
    sm: 'px-2 py-0.5 text-[10px]',
    md: 'px-2.5 py-0.5 text-xs',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border transition-standard select-none ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  );
};

export const StatusBadge: React.FC<{ status: string; size?: 'sm' | 'md' }> = ({ status, size = 'md' }) => {
  const norm = status?.toUpperCase() || 'UNKNOWN';

  switch (norm) {
    case 'COMPLETED':
    case 'VERIFIED':
    case 'APPROVED':
    case 'ACCEPTED':
    case 'ACTIVE':
      return (
        <Badge variant="teal" size={size} className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#18B89A] shrink-0" />
          <span>{status.replace(/_/g, ' ')}</span>
        </Badge>
      );

    case 'IN_PROGRESS':
    case 'IN_REVIEW':
      return (
        <Badge variant="violet" size={size} className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#7655F7] shrink-0" />
          <span>IN PROGRESS</span>
        </Badge>
      );

    case 'PENDING':
    case 'AWAITING_REVIEW':
      return (
        <Badge variant="warning" size={size} className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
          <span>PENDING</span>
        </Badge>
      );

    case 'BLOCKED':
    case 'REJECTED':
    case 'REVOKED':
    case 'EXPIRED':
      return (
        <Badge variant="danger" size={size} className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
          <span>{status.replace(/_/g, ' ')}</span>
        </Badge>
      );

    case 'NOT_STARTED':
      return (
        <Badge variant="default" size={size} className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />
          <span>NOT STARTED</span>
        </Badge>
      );

    default:
      return <Badge size={size}>{status || 'UNKNOWN'}</Badge>;
  }
};

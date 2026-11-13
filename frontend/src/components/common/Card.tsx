import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  hoverable?: boolean;
  noPadding?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  bodyClassName = '',
  title,
  subtitle,
  action,
  hoverable = false,
  noPadding = false,
}) => {
  return (
    <div
      className={`bg-white rounded-2xl border border-slate-200/90 shadow-sm transition-all overflow-hidden ${
        hoverable ? 'card-interactive hover:shadow-card-hover hover:border-violet-300/80' : ''
      } ${className}`}
    >
      {(title || subtitle || action) && (
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between gap-4">
          <div className="min-w-0">
            {title && (
              <h3 className="font-bold text-[#17182B] text-base tracking-tight truncate">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-xs text-slate-500 mt-0.5 tracking-normal">
                {subtitle}
              </p>
            )}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      <div className={noPadding ? bodyClassName : `p-6 ${bodyClassName}`.trim()}>
        {children}
      </div>
    </div>
  );
};

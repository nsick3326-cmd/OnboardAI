import React from 'react';
import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = <Inbox className="w-8 h-8 text-[#A18BFF]" />,
  title,
  description,
  action,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-10 text-center bg-white rounded-2xl border border-[#E7E9F2] shadow-xs">
      <div className="w-14 h-14 bg-violet-50/80 rounded-2xl flex items-center justify-center mb-3.5 border border-violet-100">
        {icon}
      </div>
      <h4 className="text-base font-semibold text-[#17182B] mb-1">{title}</h4>
      <p className="text-xs text-[#727A91] max-w-sm mb-4 leading-relaxed">{description}</p>
      {action && <div>{action}</div>}
    </div>
  );
};

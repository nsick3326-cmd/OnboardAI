import React from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost' | 'violet' | 'teal';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-medium rounded-xl transition-standard focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100 select-none cursor-pointer';

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs gap-1.5',
    md: 'px-4 py-2 text-sm gap-2',
    lg: 'px-5 py-2.5 text-base gap-2.5',
  };

  const variantStyles = {
    // Deep Indigo (#211B45) for selected/important actions
    primary:
      'bg-[#211B45] text-white hover:bg-[#171233] focus-visible:ring-[#211B45] shadow-xs hover:shadow-card',
    // Violet (#7655F7) for primary calls to action and branding
    violet:
      'bg-[#7655F7] text-white hover:bg-[#6039EB] focus-visible:ring-[#7655F7] shadow-xs hover:shadow-card',
    // Teal (#18B89A) for completion/verification
    teal:
      'bg-[#18B89A] text-white hover:bg-[#139C82] focus-visible:ring-[#18B89A] shadow-xs',
    // Clean white card button
    secondary:
      'bg-white text-[#17182B] border border-[#E7E9F2] hover:bg-slate-50 hover:border-slate-300 focus-visible:ring-[#7655F7]/30 shadow-xs',
    // Subtle violet outline
    outline:
      'border border-violet-200 text-[#7655F7] hover:bg-violet-50/70 focus-visible:ring-violet-300',
    // Danger
    danger:
      'bg-rose-600 text-white hover:bg-rose-700 focus-visible:ring-rose-500 shadow-xs',
    // Ghost
    ghost:
      'text-[#727A91] hover:bg-slate-100/80 hover:text-[#17182B] focus-visible:ring-slate-300',
  };

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? <Loader2 className="w-4 h-4 animate-spin shrink-0" /> : leftIcon}
      {children}
      {!isLoading && rightIcon}
    </button>
  );
};

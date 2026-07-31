import React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'destructive' | 'info' | 'outline';
}

export const Badge: React.FC<BadgeProps> = ({ className = '', variant = 'default', children, ...props }) => {
  let baseStyles = 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border transition-colors';
  
  let variantStyles = '';
  switch (variant) {
    case 'default':
      variantStyles = 'bg-slate-100 text-slate-800 border-transparent dark:bg-slate-800 dark:text-slate-200';
      break;
    case 'success':
      variantStyles = 'bg-green-100 text-green-800 border-transparent dark:bg-green-900/30 dark:text-green-400';
      break;
    case 'warning':
      variantStyles = 'bg-amber-100 text-amber-800 border-transparent dark:bg-amber-900/30 dark:text-amber-400';
      break;
    case 'destructive':
      variantStyles = 'bg-red-100 text-red-800 border-transparent dark:bg-red-900/30 dark:text-red-400';
      break;
    case 'info':
      variantStyles = 'bg-blue-100 text-blue-800 border-transparent dark:bg-blue-900/30 dark:text-blue-400';
      break;
    case 'outline':
      variantStyles = 'text-slate-950 border-slate-200 dark:text-slate-50 dark:border-slate-800';
      break;
  }

  return (
    <span className={`${baseStyles} ${variantStyles} ${className}`} {...props}>
      {children}
    </span>
  );
};

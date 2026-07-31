import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'destructive' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'primary', size = 'md', children, ...props }, ref) => {
    let baseStyles = 'inline-flex items-center justify-center font-semibold rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none';
    
    let variantStyles = '';
    switch (variant) {
      case 'primary':
        variantStyles = 'bg-gov-navy hover:bg-slate-800 text-white focus:ring-gov-navy';
        break;
      case 'secondary':
        variantStyles = 'bg-slate-100 hover:bg-slate-200 text-slate-800 focus:ring-slate-400 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-100';
        break;
      case 'destructive':
        variantStyles = 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-600';
        break;
      case 'outline':
        variantStyles = 'border border-slate-300 hover:bg-slate-50 text-slate-700 focus:ring-slate-400 dark:border-slate-700 dark:hover:bg-slate-800 dark:text-slate-200';
        break;
      case 'ghost':
        variantStyles = 'hover:bg-slate-100 text-slate-600 dark:hover:bg-slate-800 dark:text-slate-300';
        break;
    }

    let sizeStyles = '';
    switch (size) {
      case 'sm':
        sizeStyles = 'px-3 py-1.5 text-xs';
        break;
      case 'md':
        sizeStyles = 'px-4 py-2 text-sm';
        break;
      case 'lg':
        sizeStyles = 'px-5 py-2.5 text-base';
        break;
    }

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variantStyles} ${sizeStyles} ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

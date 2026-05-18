import React, { useState, useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info, Loader } from 'lucide-react';

// ==========================================
// BUTTON COMPONENT
// ==========================================
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline' | 'gold';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium transition-all duration-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/50 disabled:opacity-50 disabled:pointer-events-none cursor-pointer';

  const variants = {
    primary: 'bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-900/20 active:scale-[0.98]',
    secondary: 'bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 active:scale-[0.98]',
    danger: 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-900/20 active:scale-[0.98]',
    ghost: 'hover:bg-slate-800/60 text-slate-300 hover:text-white',
    outline: 'border border-amber-600/30 text-amber-500 hover:bg-amber-600/10 hover:border-amber-500 active:scale-[0.98]',
    gold: 'bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-bold shadow-lg shadow-amber-500/20 active:scale-[0.98]'
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };

  return (
    <button
      disabled={disabled || isLoading}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {isLoading && <Loader className="w-4 h-4 mr-2 animate-spin" />}
      {children}
    </button>
  );
};

// ==========================================
// CARD COMPONENTS
// ==========================================
export const Card: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ children, className = '', ...props }) => (
  <div className={`bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-xl overflow-hidden transition-all duration-300 hover:border-slate-700/60 ${className}`} {...props}>
    {children}
  </div>
);

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ children, className = '', ...props }) => (
  <div className={`p-6 border-b border-slate-800/50 ${className}`} {...props}>
    {children}
  </div>
);

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({ children, className = '', ...props }) => (
  <h3 className={`text-lg font-semibold text-slate-100 font-heading tracking-tight ${className}`} {...props}>
    {children}
  </h3>
);

export const CardDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({ children, className = '', ...props }) => (
  <p className={`text-xs text-slate-400 mt-1 leading-relaxed ${className}`} {...props}>
    {children}
  </p>
);

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ children, className = '', ...props }) => (
  <div className={`p-6 ${className}`} {...props}>
    {children}
  </div>
);

export const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ children, className = '', ...props }) => (
  <div className={`p-6 border-t border-slate-800/50 bg-slate-900/20 ${className}`} {...props}>
    {children}
  </div>
);

// ==========================================
// BADGE COMPONENT
// ==========================================
interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'success' | 'warning' | 'error' | 'info' | 'neutral';
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'neutral', className = '', ...props }) => {
  const baseStyles = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider';

  const variants = {
    success: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30',
    warning: 'bg-amber-500/10 text-amber-400 border border-amber-500/30',
    error: 'bg-rose-500/10 text-rose-400 border border-rose-500/30',
    info: 'bg-sky-500/10 text-sky-400 border border-sky-500/30',
    neutral: 'bg-slate-800 text-slate-300 border border-slate-700'
  };

  return (
    <span className={`${baseStyles} ${variants[variant]} ${className}`} {...props}>
      {children}
    </span>
  );
};

// ==========================================
// INPUT COMPONENTS
// ==========================================
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({ label, error, className = '', ...props }) => (
  <div className="w-full">
    {label && <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">{label}</label>}
    <input
      className={`w-full bg-slate-950/60 border ${error ? 'border-rose-500/80 focus:ring-rose-500/30' : 'border-slate-800 focus:border-amber-500 focus:ring-amber-500/20'} rounded-lg px-3.5 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 transition-all duration-200 ${className}`}
      {...props}
    />
    {error && <span className="text-xs text-rose-400 mt-1 block">{error}</span>}
  </div>
);

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const TextArea: React.FC<TextAreaProps> = ({ label, error, className = '', ...props }) => (
  <div className="w-full">
    {label && <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">{label}</label>}
    <textarea
      className={`w-full bg-slate-950/60 border ${error ? 'border-rose-500/80 focus:ring-rose-500/30' : 'border-slate-800 focus:border-amber-500 focus:ring-amber-500/20'} rounded-lg px-3.5 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 transition-all duration-200 min-h-[80px] ${className}`}
      {...props}
    />
    {error && <span className="text-xs text-rose-400 mt-1 block">{error}</span>}
  </div>
);

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}

export const Select: React.FC<SelectProps> = ({ label, error, children, className = '', ...props }) => (
  <div className="w-full">
    {label && <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">{label}</label>}
    <select
      className={`w-full bg-slate-950/60 border ${error ? 'border-rose-500/80 focus:ring-rose-500/30' : 'border-slate-800 focus:border-amber-500 focus:ring-amber-500/20'} rounded-lg px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 transition-all duration-200 ${className}`}
      {...props}
    >
      {children}
    </select>
    {error && <span className="text-xs text-rose-400 mt-1 block">{error}</span>}
  </div>
);

// ==========================================
// MODAL / DIALOG COMPONENT
// ==========================================
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Dialog: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = 'md'
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl'
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      {/* Overlay Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className={`relative w-full ${sizeClasses[size]} bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl z-10 transform scale-100 transition-all duration-300 animate-in fade-in zoom-in-95`}>
        {/* Header */}
        <div className="p-6 border-b border-slate-800/80 flex items-start justify-between">
          <div>
            <h3 className="text-xl font-bold text-slate-100 font-heading">{title}</h3>
            {description && <p className="text-xs text-slate-400 mt-1 leading-relaxed">{description}</p>}
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-slate-100 transition-all duration-200 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[70vh] bg-slate-900/50">
          {children}
        </div>
      </div>
    </div>
  );
};

// ==========================================
// TOAST NOTIFICATIONS
// ==========================================
export type ToastType = 'success' | 'error' | 'info';

export interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContainerProps {
  toasts: ToastItem[];
  removeToast: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, removeToast }) => {
  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full">
      {toasts.map(toast => {
        const icons = {
          success: <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />,
          error: <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />,
          info: <Info className="w-5 h-5 text-sky-400 shrink-0" />
        };

        const borders = {
          success: 'border-emerald-500/20 bg-emerald-950/20 shadow-emerald-950/15',
          error: 'border-rose-500/20 bg-rose-950/20 shadow-rose-950/15',
          info: 'border-sky-500/20 bg-sky-950/20 shadow-sky-950/15'
        };

        return (
          <div
            key={toast.id}
            className={`flex items-start gap-3 p-4 border rounded-xl backdrop-blur-md shadow-lg transition-all duration-300 animate-in slide-in-from-bottom-5 ${borders[toast.type]}`}
          >
            {icons[toast.type]}
            <div className="flex-1 text-sm font-medium text-slate-100">
              {toast.message}
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-slate-400 hover:text-slate-200 transition-colors p-0.5 rounded cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};

// ==========================================
// MOCK TOAST TRIGGER HOOK
// ==========================================
export const useToast = () => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = (message: string, type: ToastType = 'success') => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);

    // Auto-remove toast after 4 seconds
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return { toasts, addToast, removeToast };
};

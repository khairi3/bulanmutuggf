import React from 'react';
import { Link } from '@inertiajs/react';
import { Loader2 } from 'lucide-react';
import clsx from 'clsx';

export default function Button({
    type = 'button',
    variant = 'primary',
    size = 'md',
    loading = false,
    disabled = false,
    className = '',
    href,
    children,
    ...props
}) {
    const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.98]';

    const variants = {
        primary: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm focus:ring-emerald-500 border border-transparent shadow-emerald-600/20 hover:shadow-md',
        secondary: 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 shadow-sm focus:ring-slate-400',
        outline: 'bg-transparent border border-emerald-600 text-emerald-700 hover:bg-emerald-50 focus:ring-emerald-500',
        danger: 'bg-rose-600 hover:bg-rose-700 text-white shadow-sm focus:ring-rose-500 shadow-rose-600/20',
        ghost: 'bg-transparent hover:bg-slate-100 text-slate-600 hover:text-slate-900 focus:ring-slate-300',
    };

    const sizes = {
        sm: 'text-xs px-3 py-1.5 min-h-[36px]',
        md: 'text-sm px-4 py-2 min-h-[44px]', // 44px min touch target
        lg: 'text-base px-5 py-2.5 min-h-[48px]',
    };

    const classes = clsx(baseStyles, variants[variant], sizes[size], className);

    if (href) {
        return (
            <Link
                href={href}
                className={classes}
                {...props}
            >
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin shrink-0" />}
                {children}
            </Link>
        );
    }

    return (
        <button
            type={type}
            disabled={disabled || loading}
            className={classes}
            {...props}
        >
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin shrink-0" />}
            {children}
        </button>
    );
}

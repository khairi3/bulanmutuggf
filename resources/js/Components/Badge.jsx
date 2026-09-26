import React from 'react';
import { Lock } from 'lucide-react';
import clsx from 'clsx';

export default function Badge({
    status,
    children,
    size = 'md',
    className = '',
    ...props
}) {
    // Determine style based on status or custom children
    const normalized = (status || children || '').toString().toLowerCase().trim();

    let style = 'bg-slate-100 text-slate-700 border-slate-200';
    let isLocked = false;

    if (normalized.includes('draft')) {
        style = 'bg-slate-100 text-slate-700 border-slate-200';
    } else if (normalized.includes('submitted')) {
        style = 'bg-blue-50 text-blue-700 border-blue-200';
    } else if (normalized.includes('dalam verifikasi')) {
        style = 'bg-amber-50 text-amber-800 border-amber-200';
    } else if (normalized.includes('terverifikasi')) {
        style = 'bg-purple-50 text-purple-700 border-purple-200';
    } else if (normalized.includes('lolos convention') || normalized === 'lolos') {
        style = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    } else if (normalized.includes('tidak lolos')) {
        style = 'bg-rose-50 text-rose-700 border-rose-200';
    } else if (normalized.includes('finalised') || normalized.includes('terkunci')) {
        style = 'bg-emerald-900 text-emerald-100 border-emerald-800 font-semibold';
        isLocked = true;
    } else if (
        normalized.includes('dinilai juri') ||
        normalized.includes('hasil diumumkan') ||
        normalized.includes('pengumuman')
    ) {
        style = 'bg-teal-50 text-teal-800 border-teal-200';
    }

    const sizes = {
        sm: 'text-[11px] px-2 py-0.5',
        md: 'text-xs px-2.5 py-1',
        lg: 'text-sm px-3 py-1.5',
    };

    return (
        <span
            className={clsx(
                'inline-flex items-center gap-1.5 font-medium rounded-full border shadow-2xs transition-colors',
                style,
                sizes[size],
                className
            )}
            {...props}
        >
            {isLocked && <Lock className="w-3 h-3 shrink-0" />}
            {children || status}
        </span>
    );
}

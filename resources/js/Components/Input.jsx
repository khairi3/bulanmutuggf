import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import clsx from 'clsx';

export default function Input({
    id,
    label,
    type = 'text',
    error,
    helperText,
    icon: Icon,
    className = '',
    required = false,
    ...props
}) {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === 'password';
    const computedType = isPassword ? (showPassword ? 'text' : 'password') : type;

    return (
        <div className="w-full">
            {label && (
                <label htmlFor={id} className="block text-sm font-semibold text-slate-700 mb-1.5">
                    {label} {required && <span className="text-rose-500">*</span>}
                </label>
            )}
            <div className="relative rounded-lg shadow-sm">
                {Icon && (
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Icon className="w-5 h-5" />
                    </div>
                )}
                <input
                    id={id}
                    type={computedType}
                    className={clsx(
                        'block w-full rounded-lg border text-base sm:text-sm py-2.5 transition-colors focus:outline-none focus:ring-2',
                        Icon ? 'pl-11' : 'pl-3.5',
                        isPassword ? 'pr-11' : 'pr-3.5',
                        error
                            ? 'border-rose-300 text-rose-900 placeholder-rose-300 focus:border-rose-500 focus:ring-rose-500/20 bg-rose-50/20'
                            : 'border-slate-300 text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:ring-emerald-500/20 bg-white hover:border-slate-400',
                        className
                    )}
                    {...props}
                />
                {isPassword && (
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none touch-target"
                        aria-label={showPassword ? 'Sembunyikan password' : 'Lihat password'}
                    >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                )}
            </div>
            {error ? (
                <p className="mt-1.5 text-xs font-medium text-rose-600">{error}</p>
            ) : helperText ? (
                <p className="mt-1.5 text-xs text-slate-500">{helperText}</p>
            ) : null}
        </div>
    );
}

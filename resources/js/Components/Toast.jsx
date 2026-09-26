import React, { useState, useEffect } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import clsx from 'clsx';

export default function Toast({ flash }) {
    const [visible, setVisible] = useState(false);
    const [message, setMessage] = useState(null);
    const [type, setType] = useState('info');

    useEffect(() => {
        if (flash?.success) {
            setMessage(flash.success);
            setType('success');
            setVisible(true);
        } else if (flash?.error) {
            setMessage(flash.error);
            setType('error');
            setVisible(true);
        } else if (flash?.warning) {
            setMessage(flash.warning);
            setType('warning');
            setVisible(true);
        } else if (flash?.info) {
            setMessage(flash.info);
            setType('info');
            setVisible(true);
        }
    }, [flash]);

    useEffect(() => {
        if (visible) {
            const timer = setTimeout(() => {
                setVisible(false);
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [visible, message]);

    if (!visible || !message) return null;

    const config = {
        success: {
            bg: 'bg-emerald-50 border-emerald-200 text-emerald-900',
            icon: CheckCircle2,
            iconColor: 'text-emerald-600',
        },
        error: {
            bg: 'bg-rose-50 border-rose-200 text-rose-900',
            icon: AlertCircle,
            iconColor: 'text-rose-600',
        },
        warning: {
            bg: 'bg-amber-50 border-amber-200 text-amber-900',
            icon: AlertTriangle,
            iconColor: 'text-amber-600',
        },
        info: {
            bg: 'bg-blue-50 border-blue-200 text-blue-900',
            icon: Info,
            iconColor: 'text-blue-600',
        },
    }[type];

    const Icon = config.icon;

    return (
        <div className="fixed top-5 right-5 z-50 max-w-md w-full px-4 animate-in slide-in-from-top-3 fade-in duration-200">
            <div
                className={clsx(
                    'flex items-start gap-3 p-4 rounded-xl border shadow-lg backdrop-blur-xs',
                    config.bg
                )}
            >
                <Icon className={clsx('w-5 h-5 shrink-0 mt-0.5', config.iconColor)} />
                <div className="flex-1 text-sm font-medium leading-relaxed">{message}</div>
                <button
                    onClick={() => setVisible(false)}
                    className="p-1 rounded-md opacity-70 hover:opacity-100 hover:bg-black/5 transition-opacity"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}

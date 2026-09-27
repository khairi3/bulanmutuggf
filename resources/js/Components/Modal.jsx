import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import clsx from 'clsx';

export default function Modal({
    isOpen,
    show,
    onClose,
    title,
    description,
    children,
    footer,
    maxWidth = 'md',
}) {
    const isVisible = Boolean(isOpen ?? show);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && isVisible) {
                onClose();
            }
        };

        if (isVisible) {
            document.body.style.overflow = 'hidden';
            window.addEventListener('keydown', handleKeyDown);
        }

        return () => {
            document.body.style.overflow = 'unset';
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isVisible, onClose]);

    if (!isVisible) return null;

    const maxWidths = {
        sm: 'max-w-sm',
        md: 'max-w-md',
        lg: 'max-w-lg',
        xl: 'max-w-xl',
        '2xl': 'max-w-2xl',
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-screen items-center justify-center p-4 text-center">
                {/* Backdrop with blur */}
                <div
                    className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
                    onClick={onClose}
                    aria-hidden="true"
                />

                {/* Modal Container */}
                <div
                    className={clsx(
                        'relative w-full transform rounded-2xl bg-white text-left shadow-2xl transition-all border border-slate-100 p-6',
                        maxWidths[maxWidth]
                    )}
                >
                    <div className="flex items-start justify-between pb-3">
                        <div>
                            {title && <h3 className="text-lg font-bold text-slate-900">{title}</h3>}
                            {description && <p className="text-sm text-slate-500 mt-1">{description}</p>}
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-lg p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="py-2 text-slate-600 text-sm">{children}</div>

                    {footer && <div className="mt-5 pt-3 border-t border-slate-100 flex justify-end gap-2.5">{footer}</div>}
                </div>
            </div>
        </div>
    );
}

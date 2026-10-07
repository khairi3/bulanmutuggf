import React from 'react';
import clsx from 'clsx';

export default function Card({
    title,
    subtitle,
    action,
    className = '',
    headerClassName = '',
    bodyClassName = '',
    footer,
    children,
    ...props
}) {
    const hasOverflow = className.includes('overflow-');

    return (
        <div
            className={clsx(
                'bg-white rounded-[12px] border border-slate-200/80 shadow-xs transition-all',
                !hasOverflow && 'overflow-hidden',
                className
            )}
            {...props}
        >
            {(title || subtitle || action) && (
                <div
                    className={clsx(
                        'px-5 py-4 border-b border-slate-100 flex items-center justify-between',
                        headerClassName
                    )}
                >
                    <div>
                        {title && <h3 className="text-base font-semibold text-slate-800">{title}</h3>}
                        {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
                    </div>
                    {action && <div>{action}</div>}
                </div>
            )}
            <div className={clsx('p-5', bodyClassName)}>{children}</div>
            {footer && <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-100">{footer}</div>}
        </div>
    );
}

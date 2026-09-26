import React from 'react';
import { Inbox } from 'lucide-react';
import clsx from 'clsx';

export default function Table({
    columns = [],
    data = [],
    emptyMessage = 'Belum ada data yang tersedia.',
    emptyAction = null,
    loading = false,
    className = '',
}) {
    return (
        <div className={clsx('overflow-x-auto rounded-lg border border-slate-200 bg-white', className)}>
            <table className="w-full text-left text-sm text-slate-700">
                <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500 font-semibold border-b border-slate-200">
                    <tr>
                        {columns.map((col, index) => (
                            <th
                                key={index}
                                scope="col"
                                className={clsx('px-4 py-3.5', col.className)}
                            >
                                {col.header}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {loading ? (
                        // Skeleton loading rows (PRD 5.6)
                        Array.from({ length: 4 }).map((_, rIdx) => (
                            <tr key={rIdx} className="animate-pulse">
                                {columns.map((_, cIdx) => (
                                    <td key={cIdx} className="px-4 py-4">
                                        <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                                    </td>
                                ))}
                            </tr>
                        ))
                    ) : data.length === 0 ? (
                        // Empty state (PRD 5.6)
                        <tr>
                            <td colSpan={columns.length} className="py-12 text-center">
                                <div className="flex flex-col items-center justify-center">
                                    <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
                                        <Inbox className="w-6 h-6" />
                                    </div>
                                    <p className="text-sm font-medium text-slate-600 mb-1">{emptyMessage}</p>
                                    {emptyAction && <div className="mt-3">{emptyAction}</div>}
                                </div>
                            </td>
                        </tr>
                    ) : (
                        data.map((row, rowIdx) => (
                            <tr
                                key={row.id || rowIdx}
                                className="hover:bg-slate-50/80 transition-colors"
                            >
                                {columns.map((col, colIdx) => (
                                    <td
                                        key={colIdx}
                                        className={clsx('px-4 py-3.5 align-middle', col.className)}
                                    >
                                        {col.render ? col.render(row) : row[col.accessor]}
                                    </td>
                                ))}
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
}

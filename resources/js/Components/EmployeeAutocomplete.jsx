import React, { useState, useEffect, useRef } from 'react';
import { Search, UserCheck, Loader2, X, Check } from 'lucide-react';
import clsx from 'clsx';

export default function EmployeeAutocomplete({
    onSelect,
    selectedEmployee = null,
    onClear = null,
    placeholder = 'Ketik NIK atau Nama Karyawan (min. 3 karakter)...',
    label = 'Cari Data Karyawan',
    required = false,
    className = '',
    showLevel = true,
}) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Debounced search
    useEffect(() => {
        if (query.trim().length < 3) {
            setResults([]);
            setIsOpen(false);
            return;
        }

        const timer = setTimeout(async () => {
            setLoading(true);
            try {
                const res = await fetch(`/api/employees/search?q=${encodeURIComponent(query.trim())}`);
                if (res.ok) {
                    const data = await res.json();
                    setResults(data);
                    setIsOpen(true);
                }
            } catch (err) {
                console.error('Error searching employees:', err);
            } finally {
                setLoading(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [query]);

    const handleSelect = (emp) => {
        setIsOpen(false);
        setQuery('');
        if (onSelect) {
            onSelect(emp);
        }
    };

    return (
        <div ref={containerRef} className={clsx('relative w-full', className)}>
            {label && (
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    {label} {required && <span className="text-rose-500">*</span>}
                </label>
            )}

            {selectedEmployee ? (
                // Read-only locked state (EMP-03: nama & level tidak bisa diedit manual)
                <div className="flex items-center justify-between p-3 rounded-xl border border-emerald-300 bg-emerald-50/50 shadow-xs">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shrink-0 uppercase">
                            {selectedEmployee.full_name?.charAt(0) || 'E'}
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-bold text-slate-900">{selectedEmployee.full_name}</span>
                                <span className="text-xs px-2 py-0.5 rounded bg-white text-emerald-800 font-mono font-bold border border-emerald-200">
                                    {selectedEmployee.employee_index}
                                </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5">
                                {showLevel && (
                                    <>Level: <strong className="text-slate-700">{selectedEmployee.employee_level || '-'}</strong> · </>
                                )}
                                Jabatan: {selectedEmployee.position || '-'} · Unit: {selectedEmployee.unit || '-'}
                            </p>
                        </div>
                    </div>

                    {onClear && (
                        <button
                            type="button"
                            onClick={onClear}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Ganti Karyawan"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>
            ) : (
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        {loading ? <Loader2 className="w-4 h-4 animate-spin text-emerald-600" /> : <Search className="w-4 h-4" />}
                    </div>
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onFocus={() => {
                            if (results.length > 0) setIsOpen(true);
                        }}
                        placeholder={placeholder}
                        className="block w-full rounded-lg border border-slate-300 pl-10 pr-4 py-2.5 text-base sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
                    />

                    {/* Results Dropdown */}
                    {isOpen && (
                        <div className="absolute z-50 mt-1.5 w-full rounded-xl bg-white shadow-xl border border-slate-200 max-h-72 overflow-y-auto py-1">
                            {results.length === 0 ? (
                                <div className="px-4 py-3 text-xs text-slate-500 text-center">
                                    Tidak ada karyawan aktif yang cocok dengan pencarian "{query}".
                                </div>
                            ) : (
                                results.map((emp) => (
                                    <button
                                        key={emp.id}
                                        type="button"
                                        onClick={() => handleSelect(emp)}
                                        className="w-full text-left px-3.5 py-2.5 hover:bg-emerald-50/80 transition-colors flex items-center justify-between border-b border-slate-100 last:border-b-0"
                                    >
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-7 h-7 rounded-md bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0">
                                                {emp.full_name?.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-slate-800">{emp.full_name}</p>
                                                <p className="text-[11px] text-slate-500 font-mono">
                                                    {emp.employee_index} · {emp.position || emp.unit}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            {showLevel && (
                                                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                                    {emp.employee_level || 'Karyawan'}
                                                </span>
                                            )}
                                            <p className="text-[10px] text-slate-400 mt-0.5">{emp.unit}</p>
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

import React from 'react';
import { Check } from 'lucide-react';
import clsx from 'clsx';

export default function Stepper({ steps = [], currentStep = 0 }) {
    return (
        <div className="w-full py-4">
            <nav aria-label="Progress">
                <ol className="flex items-center justify-between w-full">
                    {steps.map((step, index) => {
                        const isCompleted = index < currentStep;
                        const isCurrent = index === currentStep;

                        return (
                            <li
                                key={index}
                                className={clsx(
                                    'relative flex-1 flex flex-col items-center',
                                    index !== steps.length - 1 && 'after:content-[""] after:w-full after:h-0.5 after:top-4 after:left-1/2 after:absolute after:-translate-y-1/2',
                                    isCompleted
                                        ? 'after:bg-emerald-600'
                                        : 'after:bg-slate-200'
                                )}
                            >
                                <div
                                    className={clsx(
                                        'relative z-10 flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold transition-all',
                                        isCompleted
                                            ? 'bg-emerald-600 text-white'
                                            : isCurrent
                                            ? 'bg-emerald-600 text-white ring-4 ring-emerald-100'
                                            : 'bg-slate-100 text-slate-500 border border-slate-300'
                                    )}
                                >
                                    {isCompleted ? <Check className="w-4 h-4 stroke-[3]" /> : index + 1}
                                </div>
                                <span
                                    className={clsx(
                                        'mt-2 text-xs font-medium text-center hidden sm:block max-w-[90px]',
                                        isCurrent ? 'text-emerald-700 font-semibold' : 'text-slate-500'
                                    )}
                                >
                                    {step.label || step}
                                </span>
                            </li>
                        );
                    })}
                </ol>
            </nav>
        </div>
    );
}

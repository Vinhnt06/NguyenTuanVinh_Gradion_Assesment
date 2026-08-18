'use client';

import { motion } from 'framer-motion';
import React from 'react';

interface StepperProps {
  currentStep: number;
  stepStates: Record<number, string>;
}

const STEPS = [
  { id: 0, label: 'Style', desc: 'Art style definition' },
  { id: 1, label: 'Characters', desc: 'Max 2 adult characters' },
  { id: 2, label: 'Portraits', desc: '1 portrait per character' },
  { id: 3, label: 'Chapters', desc: 'Max 1 chapter prompt' },
  { id: 4, label: 'Illustrations', desc: 'Scene image consistency' },
];

export default function Stepper({ currentStep, stepStates }: StepperProps) {
  // Calculate overall progress percentage
  const doneCount = Object.values(stepStates).filter((s) => s === 'done').length;
  const progressPercent = Math.min(100, Math.max(0, (doneCount / STEPS.length) * 100));

  return (
    <div className="w-full bg-[#F2EEE7] border border-[#BAB7B1] rounded-2xl p-5 md:p-6 mb-6 shadow-sm">
      {/* Header bar with progress percentage */}
      <div className="flex justify-between items-center mb-4 pb-3 border-b border-[#BAB7B1]/40">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-[#FF6B00] uppercase tracking-wider">
            Pipeline Stepper
          </span>
          <span className="text-xs text-[#595959] font-mono font-medium">
            · {doneCount} of 5 Completed
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-32 h-2 bg-[#E8E2E0] rounded-full overflow-hidden border border-[#BAB7B1]/50 hidden sm:block">
            <motion.div
              className="h-full bg-[#FF6B00] rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.5, ease: 'easeInOut' }}
            />
          </div>
          <span className="text-xs font-mono font-bold text-[#231F20]">
            {Math.round(progressPercent)}%
          </span>
        </div>
      </div>

      {/* Step Nodes Grid / Flex layout - Zero Text Overlap */}
      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {STEPS.map((step, idx) => {
          const state = stepStates[step.id] || 'pending';
          const isDone = state === 'done';
          const isRunning = state === 'running';
          const isFailed = state === 'failed';
          const isCurrent = idx === currentStep && !isDone;

          let badgeBg = 'bg-[#E8E2E0] text-[#595959] border-[#BAB7B1]';
          let badgeContent: React.ReactNode = idx + 1;
          let cardBorder = 'border-[#BAB7B1]/60 bg-white/50';

          if (isDone) {
            badgeBg = 'bg-[#231F20] text-white border-[#231F20]';
            badgeContent = '✓';
            cardBorder = 'border-[#231F20]/30 bg-white';
          } else if (isRunning) {
            badgeBg = 'bg-[#FF6B00] text-white border-[#FF6B00] animate-pulse-ring';
            badgeContent = (
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            );
            cardBorder = 'border-[#FF6B00] bg-white ring-1 ring-[#FF6B00]/20 shadow-xs';
          } else if (isFailed) {
            badgeBg = 'bg-red-600 text-white border-red-600';
            badgeContent = '!';
            cardBorder = 'border-red-300 bg-red-50/50';
          } else if (isCurrent) {
            badgeBg = 'bg-[#FF6B00] text-white border-[#FF6B00]';
            cardBorder = 'border-[#FF6B00] bg-white shadow-xs';
          }

          return (
            <div
              key={step.id}
              className={`p-3 rounded-xl border transition-all flex items-center gap-3 ${cardBorder}`}
            >
              <motion.div
                whileHover={{ scale: 1.05 }}
                className={`w-8 h-8 rounded-full text-xs font-bold flex items-center justify-center shrink-0 border transition-colors shadow-xs ${badgeBg}`}
              >
                {badgeContent}
              </motion.div>

              <div className="flex flex-col min-w-0">
                <span
                  className={`text-xs font-bold truncate leading-tight ${
                    isDone
                      ? 'text-[#231F20]'
                      : isCurrent || isRunning
                      ? 'text-[#FF6B00]'
                      : 'text-[#919699]'
                  }`}
                >
                  {step.label}
                </span>
                <span className="text-[10px] text-[#595959] truncate leading-tight mt-0.5">
                  {step.desc}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

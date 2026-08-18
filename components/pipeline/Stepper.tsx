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
  { id: 4, label: 'Illustrations', desc: 'Scene image with consistency' },
];

export default function Stepper({ currentStep, stepStates }: StepperProps) {
  // Calculate overall progress percentage
  const doneCount = Object.values(stepStates).filter((s) => s === 'done').length;
  const progressPercent = Math.min(100, Math.max(0, (doneCount / STEPS.length) * 100));

  return (
    <div className="w-full bg-[#F2EEE7] border border-[#BAB7B1] rounded-2xl p-4 md:p-6 mb-6 shadow-sm relative overflow-hidden">
      {/* Progress Track Line Background */}
      <div className="hidden md:block absolute top-[38px] left-[60px] right-[60px] h-1 bg-[#BAB7B1]/50 rounded-full z-0">
        <motion.div
          className="h-full bg-[#FF6B00] rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progressPercent}%` }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
        />
      </div>

      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10 overflow-x-auto pb-1 md:pb-0">
        {STEPS.map((step, idx) => {
          const state = stepStates[step.id] || 'pending';
          const isDone = state === 'done';
          const isRunning = state === 'running';
          const isFailed = state === 'failed';
          const isCurrent = idx === currentStep && !isDone;

          let badgeBg = 'bg-[#E8E2E0] text-[#595959] border border-[#BAB7B1]';
          let badgeContent: React.ReactNode = idx + 1;

          if (isDone) {
            badgeBg = 'bg-[#231F20] text-white border border-[#231F20]';
            badgeContent = '✓';
          } else if (isRunning) {
            badgeBg = 'bg-[#FF6B00] text-white border border-[#FF6B00] animate-pulse-ring';
            badgeContent = (
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            );
          } else if (isFailed) {
            badgeBg = 'bg-red-600 text-white border border-red-600';
            badgeContent = '!';
          } else if (isCurrent) {
            badgeBg = 'bg-[#FF6B00] text-white border border-[#FF6B00]';
          }

          return (
            <div key={step.id} className="flex items-center gap-3 min-w-[130px] md:min-w-0">
              <motion.div
                whileHover={{ scale: 1.08 }}
                className={`w-9 h-9 rounded-full text-xs font-bold flex items-center justify-center shrink-0 transition-colors shadow-xs ${badgeBg}`}
              >
                {badgeContent}
              </motion.div>

              <div className="flex flex-col">
                <span
                  className={`text-xs font-bold leading-tight ${
                    isDone
                      ? 'text-[#231F20]'
                      : isCurrent || isRunning
                      ? 'text-[#FF6B00]'
                      : 'text-[#919699]'
                  }`}
                >
                  {step.label}
                </span>
                <span className="text-[10px] text-[#595959] hidden lg:block leading-none mt-0.5">
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

'use client';

import React from 'react';
import AnimatedButton from '@/components/ui/AnimatedButton';

interface StepActionProps {
  currentStep: number;
  stepState: string;
  stepError: string | null;
  stepStartedAt: string | null;
  onRunStep: (step: number) => void;
  onRetryStep: (step: number) => void;
  onResetStep: (step: number) => void;
  loading: boolean;
}

const STEP_NAMES = [
  'Step 1: Art Style',
  'Step 2: Character Prompts',
  'Step 3: Character Portraits',
  'Step 4: Chapter Prompts',
  'Step 5: Scene Illustrations',
];

const STEP_DESCS = [
  'Analyzes book text to define unified visual direction',
  'Extracts main characters (strictly max 2 adult characters)',
  'Generates portrait images based on character prompts',
  'Selects key chapter scene for illustration (strictly max 1 chapter)',
  'Renders final scene illustration maintaining character consistency',
];

export default function StepAction({
  currentStep,
  stepState,
  stepError,
  stepStartedAt,
  onRunStep,
  onRetryStep,
  onResetStep,
  loading,
}: StepActionProps) {
  if (currentStep > 4) {
    return (
      <div className="bg-[#231F20] text-white p-6 rounded-2xl text-center shadow-md border border-[#FF6B00]/30 relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-[#FF6B00]/10 rounded-full blur-xl pointer-events-none" />
        <h3 className="text-xl font-bold mb-1 tracking-tight">🎉 Pipeline Completed!</h3>
        <p className="text-xs text-[#919699] max-w-md mx-auto">
          All 5 steps have successfully executed. Character portraits and chapter scene illustrations are stored atomically and ready for production.
        </p>
      </div>
    );
  }

  // Check if step has been stranded in 'running' for > 5 minutes
  const isStuck =
    stepState === 'running' &&
    stepStartedAt &&
    Date.now() - new Date(stepStartedAt).getTime() > 5 * 60 * 1000;

  const isRunning = stepState === 'running' || loading;
  const isFailed = stepState === 'failed';

  return (
    <div className="bg-[#F2EEE7] border border-[#BAB7B1] rounded-2xl p-6 shadow-sm mb-8 transition-all">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 bg-[#FF6B00]/10 text-[#FF6B00] text-[10px] font-extrabold uppercase rounded tracking-wider">
              NEXT PIPELINE ACTION
            </span>
            <span className="text-[11px] text-[#919699] font-mono">Step {currentStep + 1} / 5</span>
          </div>
          <h3 className="text-lg font-bold text-[#231F20] tracking-tight">
            {STEP_NAMES[currentStep]}
          </h3>
          <p className="text-xs text-[#595959] mt-0.5">{STEP_DESCS[currentStep]}</p>
        </div>

        {/* Action button states */}
        <div className="flex items-center gap-3 w-full sm:w-auto shrink-0">
          {isStuck ? (
            <div className="flex flex-col sm:flex-row items-end gap-2 w-full">
              <span className="text-xs text-amber-700 font-medium">
                ⚠️ Step appears stuck (&gt;5 mins)
              </span>
              <AnimatedButton
                variant="amber"
                onClick={() => onResetStep(currentStep)}
              >
                Reset &amp; Retry Step {currentStep + 1}
              </AnimatedButton>
            </div>
          ) : isFailed ? (
            <AnimatedButton
              variant="danger"
              onClick={() => onRetryStep(currentStep)}
              className="w-full sm:w-auto"
            >
              🔄 Retry {STEP_NAMES[currentStep]}
            </AnimatedButton>
          ) : isRunning ? (
            <AnimatedButton
              variant="primary"
              loading={true}
              disabled={true}
              className="w-full sm:w-auto"
            >
              Running {STEP_NAMES[currentStep]}...
            </AnimatedButton>
          ) : (
            <AnimatedButton
              variant="primary"
              onClick={() => onRunStep(currentStep)}
              className="w-full sm:w-auto"
            >
              Run {STEP_NAMES[currentStep]} →
            </AnimatedButton>
          )}
        </div>
      </div>

      {/* Error message detail if failed */}
      {isFailed && stepError && (
        <div className="mt-4 p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-medium">
          <p className="font-bold mb-0.5">Execution Error (409 / Retry Guard):</p>
          <p className="font-mono text-[11px] leading-relaxed">{stepError}</p>
        </div>
      )}
    </div>
  );
}

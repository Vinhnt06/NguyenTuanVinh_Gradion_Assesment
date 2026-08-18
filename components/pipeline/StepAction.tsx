'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkle, ArrowClockwise, Warning, CheckCircle } from '@phosphor-icons/react';
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

const RUNNING_MESSAGES = [
  'Gemini 3.7 Flash analyzing book theme, art style & color palette...',
  'Gemini AI extracting main adult characters (Max 2) & writing prompt descriptions...',
  'FLUX AI Model rendering high-definition character portraits (sequential 2s rate-limit pause)...',
  'Gemini AI analyzing pivotal chapter scene & composition prompts (Max 1)...',
  'FLUX AI Model rendering 16:9 cinematic chapter scene illustration...',
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
  const [progress, setProgress] = useState(15);
  const [elapsed, setElapsed] = useState(0);

  const isRunning = stepState === 'running' || loading;
  const isFailed = stepState === 'failed';

  // Dynamic progress animation & elapsed timer while step is running
  useEffect(() => {
    if (!isRunning) {
      setProgress(15);
      setElapsed(0);
      return;
    }

    const startTime = Date.now();
    const timerInterval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) return 95;
        // Step 2 & 4 take slightly longer for AI images
        const increment = currentStep === 2 || currentStep === 4 ? 3 : 7;
        return Math.min(prev + increment, 95);
      });
    }, 800);

    return () => {
      clearInterval(timerInterval);
      clearInterval(progressInterval);
    };
  }, [isRunning, currentStep]);

  if (currentStep > 4) {
    return (
      <div className="bg-[#1C1C22] text-white p-6 rounded-2xl text-center shadow-lg border border-[#FF6B00]/40 relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-[#FF6B00]/20 rounded-full blur-2xl pointer-events-none" />
        <div className="w-10 h-10 rounded-full bg-[#FF6B00]/20 text-[#FF6B00] border border-[#FF6B00]/40 flex items-center justify-center mx-auto mb-3">
          <CheckCircle weight="fill" className="w-6 h-6 text-[#FF6B00]" />
        </div>
        <h3 className="text-xl font-bold mb-1 tracking-tight text-white">🎉 All 5 Steps Completed!</h3>
        <p className="text-xs text-[#8E8E93] max-w-md mx-auto leading-relaxed">
          All 5 generative pipeline steps have successfully executed. Character portraits and chapter scene illustrations are stored atomically and ready for production.
        </p>
      </div>
    );
  }

  // Check if step has been stranded in 'running' for > 5 minutes
  const isStuck =
    stepState === 'running' &&
    stepStartedAt &&
    Date.now() - new Date(stepStartedAt).getTime() > 5 * 60 * 1000;

  return (
    <div className="bg-[#F2EEE7] border border-[#BAB7B1] rounded-2xl p-6 shadow-sm mb-8 transition-all">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 bg-[#FF6B00]/10 text-[#FF6B00] text-[10px] font-extrabold uppercase rounded tracking-wider">
              NEXT PIPELINE ACTION
            </span>
            <span className="text-[11px] text-[#8E8E93] font-mono">Step {currentStep + 1} / 5</span>
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
              className="w-full sm:w-auto gap-2"
            >
              <ArrowClockwise weight="bold" className="w-4 h-4" />
              Retry {STEP_NAMES[currentStep]}
            </AnimatedButton>
          ) : isRunning ? (
            <AnimatedButton
              variant="primary"
              loading={true}
              disabled={true}
              className="w-full sm:w-auto gap-2"
            >
              Executing {STEP_NAMES[currentStep]}...
            </AnimatedButton>
          ) : (
            <AnimatedButton
              variant="primary"
              onClick={() => onRunStep(currentStep)}
              className="w-full sm:w-auto gap-2"
            >
              Run {STEP_NAMES[currentStep]} →
            </AnimatedButton>
          )}
        </div>
      </div>

      {/* Dynamic Animated Progress Bar & Live Status Message */}
      {isRunning && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-5 pt-4 border-t border-[#BAB7B1]/60 space-y-3"
        >
          <div className="flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-2 text-[#FF6B00] font-bold">
              <span className="w-2 h-2 rounded-full bg-[#FF6B00] animate-ping" />
              <span>{RUNNING_MESSAGES[currentStep]}</span>
            </div>
            <div className="text-[#595959] font-bold">
              {progress}% · <span className="text-[#FF6B00]">{elapsed}s</span>
            </div>
          </div>

          {/* Animated Progress Track */}
          <div className="w-full h-2.5 bg-[#E2DDD5] rounded-full overflow-hidden border border-[#BAB7B1]/50 relative">
            <motion.div
              className="h-full bg-gradient-to-r from-[#FF6B00] via-[#FFA861] to-[#FF6B00] rounded-full relative"
              style={{ width: `${progress}%` }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            >
              {/* Shimmer Light Highlight */}
              <div className="absolute inset-0 bg-white/20 animate-pulse" />
            </motion.div>
          </div>
        </motion.div>
      )}

      {/* Error message detail if failed */}
      {isFailed && stepError && (
        <div className="mt-4 p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-medium flex items-start gap-2.5">
          <Warning className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold mb-0.5">Execution Error (409 / Retry Guard):</p>
            <p className="font-mono text-[11px] leading-relaxed">{stepError}</p>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

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
      <div className="bg-[#231F20] text-white p-6 rounded-2xl text-center shadow-sm">
        <h3 className="text-xl font-bold mb-1">🎉 Pipeline Complete!</h3>
        <p className="text-xs text-[#919699]">
          All character portraits and chapter scene illustrations have been successfully generated.
        </p>
      </div>
    );
  }

  // Check if step has been stranded in 'running' for > 5 minutes (300,000 ms)
  const isStuck =
    stepState === 'running' &&
    stepStartedAt &&
    Date.now() - new Date(stepStartedAt).getTime() > 5 * 60 * 1000;

  const isRunning = stepState === 'running' || loading;
  const isFailed = stepState === 'failed';

  return (
    <div className="bg-[#F2EEE7] border border-[#BAB7B1] rounded-2xl p-6 shadow-sm mb-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-[#919699] uppercase tracking-wider">
            NEXT ACTION
          </span>
          <h3 className="text-lg font-bold text-[#231F20]">
            {STEP_NAMES[currentStep]}
          </h3>
        </div>

        {/* Action button states */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          {isStuck ? (
            <div className="flex flex-col sm:flex-row items-end gap-2 w-full">
              <span className="text-xs text-amber-700 font-medium">
                ⚠️ Step appears stuck ({'>'}5 mins)
              </span>
              <button
                onClick={() => onResetStep(currentStep)}
                className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
              >
                Reset & Retry Step {currentStep + 1}
              </button>
            </div>
          ) : isFailed ? (
            <button
              onClick={() => onRetryStep(currentStep)}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg text-sm transition-colors flex items-center justify-center gap-2 w-full sm:w-auto"
            >
              🔄 Retry {STEP_NAMES[currentStep]}
            </button>
          ) : isRunning ? (
            <button
              disabled
              className="px-6 py-3 bg-[#FF6B00] opacity-85 text-white font-semibold rounded-lg text-sm flex items-center justify-center gap-2 cursor-wait w-full sm:w-auto"
            >
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Running {STEP_NAMES[currentStep]}...
            </button>
          ) : (
            <button
              onClick={() => onRunStep(currentStep)}
              className="px-6 py-3 bg-[#FF6B00] hover:bg-[#E85F00] text-white font-semibold rounded-lg text-sm transition-colors flex items-center justify-center gap-2 w-full sm:w-auto shadow-sm"
            >
              Run {STEP_NAMES[currentStep]} →
            </button>
          )}
        </div>
      </div>

      {/* Error message detail if failed */}
      {isFailed && stepError && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-xs font-medium">
          <p className="font-bold mb-0.5">Execution Error:</p>
          <p>{stepError}</p>
        </div>
      )}
    </div>
  );
}

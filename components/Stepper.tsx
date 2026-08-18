'use client';

interface StepperProps {
  currentStep: number;
  stepStates: Record<number, string>;
}

const STEPS = [
  { id: 0, label: 'Style' },
  { id: 1, label: 'Characters' },
  { id: 2, label: 'Portraits' },
  { id: 3, label: 'Chapters' },
  { id: 4, label: 'Illustrations' },
];

export default function Stepper({ currentStep, stepStates }: StepperProps) {
  return (
    <div className="w-full bg-[#F2EEE7] border border-[#BAB7B1] rounded-xl p-4 md:p-6 mb-6">
      <div className="flex items-center justify-between overflow-x-auto">
        {STEPS.map((step, idx) => {
          const state = stepStates[step.id] || 'pending';
          const isDone = state === 'done';
          const isRunning = state === 'running';
          const isFailed = state === 'failed';
          const isCurrent = idx === currentStep && !isDone;

          let badgeBg = 'bg-[#BAB7B1] text-[#434343]';
          let badgeIcon: React.ReactNode = idx + 1;

          if (isDone) {
            badgeBg = 'bg-[#231F20] text-white';
            badgeIcon = '✓';
          } else if (isRunning) {
            badgeBg = 'bg-[#FF6B00] text-white animate-pulse';
          } else if (isFailed) {
            badgeBg = 'bg-red-600 text-white';
            badgeIcon = '!';
          } else if (isCurrent) {
            badgeBg = 'bg-[#FF6B00] text-white';
          }

          return (
            <div key={step.id} className="flex items-center flex-1 min-w-[100px] last:flex-none">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center transition-all ${badgeBg}`}
                >
                  {badgeIcon}
                </div>
                <span
                  className={`text-xs font-semibold whitespace-nowrap ${
                    isDone
                      ? 'text-[#231F20]'
                      : isCurrent || isRunning
                      ? 'text-[#FF6B00]'
                      : 'text-[#919699]'
                  }`}
                >
                  {step.label}
                </span>
              </div>

              {idx < STEPS.length - 1 && (
                <div
                  className={`h-0.5 flex-1 mx-3 ${
                    isDone ? 'bg-[#231F20]' : 'bg-[#BAB7B1]'
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

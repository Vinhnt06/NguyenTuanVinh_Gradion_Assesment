'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Stepper from '@/components/Stepper';
import CharacterCard from '@/components/CharacterCard';
import ChapterCard from '@/components/ChapterCard';
import StepAction from '@/components/StepAction';

interface ProjectState {
  id: string;
  title: string;
  bookText: string;
  createdAt: string;
  status: 'draft' | 'in_progress' | 'done';
  currentStep: number;
  stepStates: Record<number, string>;
  stepStartedAt: string | null;
  stepError: string | null;
  stepResults: {
    0?: { style: string };
    1?: { characters: Array<{ name: string; prompt: string }> };
    2?: { portraits: Array<{ name: string; prompt: string; imagePath?: string }> };
    3?: { chapters: Array<{ name: string; prompt: string }> };
    4?: { illustrations: Array<{ name: string; prompt: string; illustrationPath?: string }> };
  };
}

export default function ProjectDetailPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;

  const [project, setProject] = useState<ProjectState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userStyle, setUserStyle] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [showFullBook, setShowFullBook] = useState(false);

  const fetchProject = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}`);
      if (res.status === 401) {
        router.push('/');
        return;
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch project');
      setProject(data.project);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [projectId, router]);

  useEffect(() => {
    fetchProject();
  }, [fetchProject]);

  // Polling loop: poll every 2s if any step is currently 'running'
  useEffect(() => {
    if (!project) return;
    const isAnyStepRunning = Object.values(project.stepStates).some(
      (s) => s === 'running'
    );

    if (isAnyStepRunning) {
      const interval = setInterval(() => {
        fetchProject();
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [project, fetchProject]);

  const handleRunStep = async (step: number) => {
    setActionLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/projects/${projectId}/steps/${step}/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userStyle: step === 0 ? userStyle : undefined }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Step execution failed');
      }

      setProject(data.project);
    } catch (err: any) {
      setError(err.message);
      fetchProject();
    } finally {
      setActionLoading(false);
    }
  };

  const handleResetStep = async (step: number) => {
    setActionLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/projects/${projectId}/steps/${step}/reset`, {
        method: 'POST',
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Reset failed');
      }

      setProject(data.project);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F8F8] flex items-center justify-center text-sm text-[#919699]">
        Loading project pipeline...
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-[#F8F8F8] p-8 text-center">
        <p className="text-red-600 mb-4">{error || 'Project not found'}</p>
        <Link href="/projects" className="text-[#FF6B00] hover:underline text-sm font-semibold">
          ← Back to Projects
        </Link>
      </div>
    );
  }

  // Derive display values
  const currentStep = project.currentStep;
  const currentStepState = project.stepStates[currentStep] || 'pending';
  const styleResult = project.stepResults[0]?.style;
  const characters = project.stepResults[2]?.portraits || project.stepResults[1]?.characters || [];
  const chapters = project.stepResults[4]?.illustrations || project.stepResults[3]?.chapters || [];

  return (
    <div className="min-h-screen bg-[#F8F8F8] text-[#231F20] pb-16">
      {/* Header Bar */}
      <header className="border-b border-[#BAB7B1] bg-[#F2EEE7] px-6 py-4">
        <div className="max-w-[1100px] mx-auto flex justify-between items-center">
          <Link
            href="/projects"
            className="text-xs font-semibold text-[#595959] hover:text-[#FF6B00] transition-colors"
          >
            ← Back to Projects
          </Link>
          <div className="text-right">
            <span className="text-xs font-semibold text-[#919699] uppercase tracking-wider block">
              PIPELINE STUDIO
            </span>
            <span className="text-xs text-[#595959]">
              Created {new Date(project.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-[1100px] mx-auto p-6 mt-4">
        {/* Project Title & Status */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-[#231F20] mb-2">{project.title}</h1>
        </div>

        {/* 5-Step Stepper Bar */}
        <Stepper currentStep={currentStep} stepStates={project.stepStates} />

        {/* Step Action Bar */}
        <StepAction
          currentStep={currentStep}
          stepState={currentStepState}
          stepError={project.stepError}
          stepStartedAt={project.stepStartedAt}
          onRunStep={handleRunStep}
          onRetryStep={handleRunStep}
          onResetStep={handleResetStep}
          loading={actionLoading}
        />

        {/* Optional Custom Style Input for Step 0 */}
        {currentStep === 0 && currentStepState !== 'done' && (
          <div className="bg-[#F2EEE7] border border-[#BAB7B1] rounded-xl p-5 mb-8">
            <label className="block text-xs font-semibold text-[#231F20] mb-1">
              Custom Art Style (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Vintage Victorian woodcut illustration, muted sepia tone"
              value={userStyle}
              onChange={(e) => setUserStyle(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-[#BAB7B1] rounded-lg text-sm text-[#231F20] focus:outline-none focus:border-[#FF6B00]"
            />
            <p className="text-[11px] text-[#919699] mt-1">
              Leave blank to let Gemini analyze the book text and auto-generate an art style.
            </p>
          </div>
        )}

        {/* Art Style Display Card */}
        {styleResult && (
          <div className="bg-[#F2EEE7] border border-[#BAB7B1] rounded-xl p-6 mb-8">
            <h3 className="text-sm font-bold text-[#919699] uppercase tracking-wider mb-1">
              Generated Art Style
            </h3>
            <p className="text-base font-semibold text-[#231F20] leading-relaxed">
              &quot;{styleResult}&quot;
            </p>
          </div>
        )}

        {/* Characters Grid (Max 2) */}
        {characters.length > 0 && (
          <section className="mb-10">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Main Characters (Max 2)</h3>
              <span className="text-xs font-semibold text-[#919699]">
                Portraits: Step {project.stepStates[2] === 'done' ? 'Completed' : '2'}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {characters.map((char, idx) => (
                <CharacterCard
                  key={idx}
                  character={char}
                  isGenerating={project.stepStates[2] === 'running'}
                />
              ))}
            </div>
          </section>
        )}

        {/* Chapters Grid (Max 1) */}
        {chapters.length > 0 && (
          <section className="mb-10">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Chapter Scene Illustration (Max 1)</h3>
              <span className="text-xs font-semibold text-[#919699]">
                Illustration: Step {project.stepStates[4] === 'done' ? 'Completed' : '4'}
              </span>
            </div>
            <div className="grid grid-cols-1 gap-6">
              {chapters.map((chap, idx) => (
                <ChapterCard
                  key={idx}
                  chapter={chap}
                  isGenerating={project.stepStates[4] === 'running'}
                />
              ))}
            </div>
          </section>
        )}

        {/* Book Text Section (Readable in full) */}
        <section className="bg-[#F2EEE7] border border-[#BAB7B1] rounded-2xl p-6 mt-8">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-bold">Book Text</h3>
            <button
              onClick={() => setShowFullBook(!showFullBook)}
              className="text-xs font-semibold text-[#FF6B00] hover:underline"
            >
              {showFullBook ? 'Collapse Text' : 'Expand Full Text'}
            </button>
          </div>
          <div
            className={`bg-white border border-[#BAB7B1] rounded-xl p-4 font-mono text-xs text-[#434343] whitespace-pre-wrap leading-relaxed ${
              showFullBook ? 'max-h-[600px] overflow-y-auto' : 'max-h-[160px] overflow-hidden'
            }`}
          >
            {project.bookText}
          </div>
        </section>
      </main>
    </div>
  );
}

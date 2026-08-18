'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { PencilSimple } from '@phosphor-icons/react';
import Stepper from '@/components/pipeline/Stepper';
import CharacterCard from '@/components/cards/CharacterCard';
import ChapterCard from '@/components/cards/ChapterCard';
import StepAction from '@/components/pipeline/StepAction';
import { ToastProvider, useToast } from '@/components/ui/Toast';
import SkeletonLoader from '@/components/ui/SkeletonLoader';
import ApiKeyBadge from '@/components/ui/ApiKeyBadge';

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

function ProjectDetailContent() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;
  const { showToast } = useToast();

  const [project, setProject] = useState<ProjectState | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [userStyle, setUserStyle] = useState('');
  const [showFullBook, setShowFullBook] = useState(false);

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [isSavingTitle, setIsSavingTitle] = useState(false);

  const handleUpdateTitle = async () => {
    if (!newTitle.trim() || newTitle.trim() === project?.title) {
      setIsEditingTitle(false);
      return;
    }
    setIsSavingTitle(true);
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update title');
      setProject(data.project);
      showToast('Project Title Updated ✓', 'Saved new title to disk', 'success');
      setIsEditingTitle(false);
    } catch (err: any) {
      showToast('Rename Error', err.message, 'error');
    } finally {
      setIsSavingTitle(false);
    }
  };

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
      showToast(`Executing Step ${step + 1}...`, 'Communicating with Gemini AI API', 'info');

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
      showToast(`Step ${step + 1} Succeeded!`, 'Atomic result saved to disk', 'success');
    } catch (err: any) {
      setError(err.message);
      showToast(`Step ${step + 1} Failed`, err.message, 'error');
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
      showToast(`Step ${step + 1} Reset`, 'State recovered from stuck execution', 'info');
    } catch (err: any) {
      setError(err.message);
      showToast('Reset Error', err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRegenerateSingleImage = async (type: 'character' | 'illustration', index: number) => {
    try {
      showToast('Generating AI Picture...', 'Communicating with FLUX AI Engine', 'info');
      const res = await fetch(`/api/projects/${projectId}/images/regenerate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, index }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Regeneration failed');
      setProject(data.project);
      showToast('New AI Picture Generated ✓', 'Saved HD picture to disk', 'success');
    } catch (err: any) {
      showToast('Regeneration Error', err.message, 'error');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F8F8] flex flex-col items-center justify-center p-6 space-y-4">
        <SkeletonLoader className="w-64 h-8 rounded-xl" />
        <SkeletonLoader className="w-96 h-4 rounded-lg" />
        <div className="text-xs text-[#919699] font-mono">Loading studio workspace...</div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-[#F8F8F8] p-8 text-center flex flex-col items-center justify-center">
        <p className="text-red-600 mb-4 font-semibold">{error || 'Project not found'}</p>
        <Link href="/projects" className="text-[#FF6B00] hover:underline text-sm font-semibold">
          ← Back to Projects Catalog
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
    <div className="min-h-screen bg-[#F8F8F8] text-[#231F20] pb-16 relative overflow-hidden">
      {/* GPU-Accelerated Dynamic Ambient Background Orbs & Pattern */}
      <div className="fixed top-0 left-1/4 w-[650px] h-[650px] bg-[#FF6B00]/7 rounded-full blur-[160px] pointer-events-none transform-gpu animate-pulse" />
      <div className="fixed bottom-0 right-1/4 w-[650px] h-[650px] bg-[#FFA861]/7 rounded-full blur-[160px] pointer-events-none transform-gpu" />
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#00000004_1px,transparent_1px),linear-gradient(to_bottom,#00000004_1px,transparent_1px)] bg-[size:4.5rem_4.5rem] pointer-events-none" />

      {/* Header Bar */}
      <header className="border-b border-[#BAB7B1] bg-[#F2EEE7] px-6 py-4 sticky top-0 z-30 shadow-2xs backdrop-blur-md bg-[#F2EEE7]/90">
        <div className="max-w-[1280px] mx-auto flex justify-between items-center">
          <Link
            href="/projects"
            className="text-xs font-semibold text-[#595959] hover:text-[#FF6B00] transition-colors flex items-center gap-1"
          >
            ← Catalog
          </Link>
          <div className="flex items-center gap-4">
            <ApiKeyBadge variant="light" />
            <div className="text-right hidden sm:block">
              <span className="text-[10px] font-mono font-bold text-[#FF6B00] uppercase tracking-widest block">
                STUDIO WORKSPACE
              </span>
              <span className="text-[11px] text-[#595959] font-mono">
                Created {new Date(project.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area — Two Columns Layout */}
      <main className="max-w-[1280px] mx-auto p-6 lg:p-8 mt-2">
        {/* Project Title */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#BAB7B1]/40 pb-4">
          <div>
            <span className="text-[11px] font-bold text-[#919699] uppercase tracking-wider block">
              ACTIVE BOOK PIPELINE
            </span>
            {isEditingTitle ? (
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleUpdateTitle()}
                  className="px-3 py-1 bg-white border border-[#FF6B00] rounded-xl text-xl font-extrabold text-[#231F20] focus:outline-none focus:ring-1 focus:ring-[#FF6B00]"
                  autoFocus
                />
                <button
                  onClick={handleUpdateTitle}
                  disabled={isSavingTitle}
                  className="px-3 py-1 bg-[#FF6B00] text-white rounded-xl text-xs font-bold hover:bg-[#FFA861] transition-colors"
                >
                  {isSavingTitle ? 'Saving...' : 'Save ✓'}
                </button>
                <button
                  onClick={() => setIsEditingTitle(false)}
                  className="px-3 py-1 bg-gray-200 text-gray-700 rounded-xl text-xs font-bold hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 group">
                <h1 className="text-3xl font-extrabold text-[#231F20] tracking-tight">{project.title}</h1>
                <button
                  onClick={() => {
                    setNewTitle(project.title);
                    setIsEditingTitle(true);
                  }}
                  title="Edit Project Title"
                  className="p-1.5 rounded-lg text-gray-400 hover:text-[#FF6B00] hover:bg-[#F2EEE7] transition-all opacity-70 group-hover:opacity-100"
                >
                  <PencilSimple weight="bold" className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono px-3 py-1 bg-[#F2EEE7] border border-[#BAB7B1] rounded-full font-bold">
              ID: {project.id.substring(0, 8)}...
            </span>
          </div>
        </div>

        {/* 5-Step Stepper Bar */}
        <Stepper currentStep={currentStep} stepStates={project.stepStates} />

        {/* Workspace Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column (Main Pipeline Action & Generated Art - 8 Cols) */}
          <div className="lg:col-span-8 space-y-8">
            {/* Step Action Command Center */}
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
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[#F2EEE7] border border-[#BAB7B1] rounded-2xl p-6 shadow-xs"
              >
                <label className="block text-xs font-bold text-[#231F20] mb-1.5">
                  Custom Art Style Prompt (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Vintage Victorian woodcut illustration, muted sepia tone"
                  value={userStyle}
                  onChange={(e) => setUserStyle(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-[#BAB7B1] rounded-xl text-sm text-[#231F20] focus:outline-none focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00] transition-colors"
                />
                <p className="text-[11px] text-[#919699] mt-1.5 leading-normal">
                  Leave blank to let Gemini AI analyze the book text and auto-generate the optimal art style direction.
                </p>
              </motion.div>
            )}

            {/* Art Style Display Card */}
            {styleResult && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[#231F20] text-white rounded-2xl p-6 shadow-md border border-[#FF6B00]/20 relative overflow-hidden"
              >
                <div className="text-[10px] font-mono font-bold text-[#FF6B00] uppercase tracking-widest mb-1.5">
                  STEP 1 RESULT · ART STYLE DIRECTION
                </div>
                <p className="text-base font-semibold leading-relaxed text-white/95 italic">
                  &quot;{styleResult}&quot;
                </p>
              </motion.div>
            )}

            {/* Characters Section (Max 2) */}
            {characters.length > 0 && (
              <section className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bold tracking-tight">Main Characters (Max 2)</h3>
                  <span className="text-xs font-mono font-bold px-2.5 py-0.5 bg-[#FF6B00]/10 text-[#FF6B00] rounded">
                    Portraits: {project.stepStates[2] === 'done' ? 'Generated ✓' : 'Pending Step 3'}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {characters.map((char, idx) => (
                    <CharacterCard
                      key={idx}
                      character={char}
                      isGenerating={project.stepStates[2] === 'running'}
                      onRegenerateImage={() => handleRegenerateSingleImage('character', idx)}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Chapters Section (Max 1) */}
            {chapters.length > 0 && (
              <section className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bold tracking-tight">Chapter Scene Illustration (Max 1)</h3>
                  <span className="text-xs font-mono font-bold px-2.5 py-0.5 bg-[#231F20] text-white rounded">
                    Illustration: {project.stepStates[4] === 'done' ? 'Generated ✓' : 'Pending Step 5'}
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-6">
                  {chapters.map((chap, idx) => (
                    <ChapterCard
                      key={idx}
                      chapter={chap}
                      isGenerating={project.stepStates[4] === 'running'}
                      onRegenerateImage={() => handleRegenerateSingleImage('illustration', idx)}
                    />
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Right Column (Sidebar Summary & Book Text - 4 Cols) */}
          <div className="lg:col-span-4 space-y-6">
            {/* Pipeline Status Summary Card */}
            <div className="bg-[#F2EEE7] border border-[#BAB7B1] rounded-2xl p-6 shadow-xs">
              <h3 className="text-xs font-bold text-[#919699] uppercase tracking-wider mb-4">
                Pipeline Specifications
              </h3>
              <div className="space-y-3 text-xs leading-relaxed">
                <div className="flex justify-between py-1.5 border-b border-[#BAB7B1]/40">
                  <span className="text-[#595959]">Gemini Model:</span>
                  <span className="font-mono font-bold text-[#231F20]">gemini-flash-latest</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-[#BAB7B1]/40">
                  <span className="text-[#595959]">Max Characters:</span>
                  <span className="font-mono font-bold text-[#231F20]">2 (Server Validated)</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-[#BAB7B1]/40">
                  <span className="text-[#595959]">Max Chapters:</span>
                  <span className="font-mono font-bold text-[#231F20]">1 (Server Validated)</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-[#BAB7B1]/40">
                  <span className="text-[#595959]">State Storage:</span>
                  <span className="font-mono font-bold text-[#231F20]">Atomic JSON File</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-[#595959]">Concurrency Guard:</span>
                  <span className="font-mono font-bold text-[#FF6B00]">409 Conflict Shield</span>
                </div>
              </div>
            </div>

            {/* Book Text Section (Collapsible Accordion) */}
            <section className="bg-[#F2EEE7] border border-[#BAB7B1] rounded-2xl p-6 shadow-xs">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-bold text-[#231F20]">Book Context Text</h3>
                <button
                  onClick={() => setShowFullBook(!showFullBook)}
                  className="text-xs font-semibold text-[#FF6B00] hover:underline focus:outline-none"
                >
                  {showFullBook ? 'Collapse' : 'Expand'}
                </button>
              </div>
              <div
                className={`bg-white border border-[#BAB7B1] rounded-xl p-4 font-mono text-xs text-[#434343] whitespace-pre-wrap leading-relaxed transition-all ${
                  showFullBook ? 'max-h-[500px] overflow-y-auto' : 'max-h-[160px] overflow-hidden'
                }`}
              >
                {project.bookText}
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function ProjectDetailPage() {
  return (
    <ToastProvider>
      <ProjectDetailContent />
    </ToastProvider>
  );
}

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trash,
  Plus,
  CheckCircle,
  Clock,
  Sparkle,
  X,
  Warning,
  ArrowRight,
  BookOpen,
} from '@phosphor-icons/react';
import AnimatedButton from '@/components/ui/AnimatedButton';
import SkeletonLoader from '@/components/ui/SkeletonLoader';
import ApiKeyBadge from '@/components/ui/ApiKeyBadge';
import { useToast } from '@/components/ui/Toast';

interface CharacterItem {
  name: string;
  prompt: string;
  imagePath?: string;
}

interface ChapterItem {
  name: string;
  prompt: string;
  illustrationPath?: string;
}

interface Project {
  id: string;
  title: string;
  createdAt: string;
  status: 'draft' | 'in_progress' | 'done';
  currentStep: number;
  stepStates: Record<number, string>;
  stepResults?: {
    0?: { style: string } | null;
    1?: { characters: CharacterItem[] } | null;
    2?: { portraits: CharacterItem[] } | null;
    3?: { chapters: ChapterItem[] } | null;
    4?: { illustrations: ChapterItem[] } | null;
  };
}

export default function ProjectsCatalogPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/projects');
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch projects');
      }
      setProjects(data.projects || []);
    } catch (err: any) {
      setError(err.message || 'Error loading projects');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Session Auth Guard check
    fetch('/api/auth')
      .then((res) => res.json())
      .then((data) => {
        if (!data.authenticated) {
          router.push('/');
        }
      })
      .catch(() => router.push('/'));
  }, [router]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleSignOut = async () => {
    await fetch('/api/auth', { method: 'DELETE' });
    router.push('/');
  };

  const handleDeleteProject = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/projects/${deleteTarget.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete project');

      setProjects((prev) => prev.filter((p) => p.id !== deleteTarget.id));
      showToast(`Deleted "${deleteTarget.title}" successfully`, 'success');
      setDeleteTarget(null);
    } catch (err: any) {
      showToast(err.message || 'Failed to delete project', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const getThumbnail = (project: Project) => {
    if (project.stepResults?.[4]?.illustrations?.[0]?.illustrationPath) {
      return project.stepResults[4].illustrations[0].illustrationPath;
    }
    if (project.stepResults?.[2]?.portraits?.[0]?.imagePath) {
      return project.stepResults[2].portraits[0].imagePath;
    }
    if (project.stepResults?.[2]?.portraits?.[1]?.imagePath) {
      return project.stepResults[2].portraits[1].imagePath;
    }
    return null;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'done':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#0D0D10]/85 border border-emerald-500/40 text-emerald-400 text-[11px] font-bold rounded-full uppercase tracking-wider shadow-md backdrop-blur-md">
            <CheckCircle weight="fill" className="w-3.5 h-3.5 text-emerald-400" />
            Completed
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#0D0D10]/85 border border-[#FF6B00]/40 text-[#FF9D54] text-[11px] font-bold rounded-full uppercase tracking-wider shadow-md backdrop-blur-md">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FF6B00] animate-pulse" />
            In Progress
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#0D0D10]/85 border border-gray-600/40 text-gray-300 text-[11px] font-bold rounded-full uppercase tracking-wider shadow-md backdrop-blur-md">
            <Clock weight="bold" className="w-3.5 h-3.5 text-gray-400" />
            Draft
          </span>
        );
    }
  };

  const totalProjects = projects.length;
  const completedCount = projects.filter((p) => p.status === 'done').length;
  const inProgressCount = projects.filter((p) => p.status === 'in_progress').length;

  return (
    <div className="min-h-screen bg-[#F8F8F8] text-[#231F20] pb-24 font-sans selection:bg-[#FF6B00] selection:text-white">
      {/* Top Header Navigation */}
      <header className="border-b border-[#BAB7B1] bg-[#F2EEE7]/90 backdrop-blur-md px-6 py-4 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-[1300px] mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Link href="/projects" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
              <Image
                src="/gradion-logo.png"
                alt="Gradion"
                width={88}
                height={31}
                priority
                className="object-contain opacity-95"
              />
              <span className="text-[#919699] text-sm font-light select-none">·</span>
              <span className="text-xs font-mono tracking-widest text-[#FF6B00] uppercase font-bold">
                STUDIO WORKSPACE
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <ApiKeyBadge variant="light" />
            <Link href="/projects/new">
              <AnimatedButton variant="primary" size="sm" className="gap-1.5">
                <Plus weight="bold" className="w-4 h-4" />
                New Project
              </AnimatedButton>
            </Link>
            <button
              onClick={handleSignOut}
              className="text-xs font-semibold text-[#595959] hover:text-[#FF6B00] transition-colors"
            >
              Sign Out →
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-[1300px] mx-auto p-6 lg:p-8 mt-4">
        {/* Studio Hero Banner & Stats Counter */}
        <div className="mb-10 bg-[#F2EEE7] border border-[#BAB7B1] rounded-3xl p-6 lg:p-8 relative overflow-hidden shadow-xs">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#FF6B00]/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Sparkle weight="fill" className="w-4 h-4 text-[#FF6B00]" />
                <span className="text-[11px] font-mono text-[#FF6B00] uppercase tracking-widest font-bold">
                  GEMINI AI ILLUSTRATION STUDIO CATALOG
                </span>
              </div>
              <h2 className="text-3xl lg:text-4xl font-extrabold tracking-tight text-[#231F20]">
                Your Illustration Pipelines
              </h2>
              <p className="text-xs lg:text-sm text-[#595959] mt-1 max-w-xl leading-relaxed">
                Automated 5-step visual consistency pipelines powered by Gemini Flash models and resilient SVG studio artwork generation.
              </p>
            </div>

            {/* Live Stats Row */}
            <div className="flex items-center gap-3 bg-white/90 border border-[#CBD5E1] p-3 rounded-2xl shadow-xs">
              <div className="px-4 py-2 text-center border-r border-[#E2E8F0]">
                <div className="text-xl font-black text-[#231F20]">{totalProjects}</div>
                <div className="text-[10px] font-mono text-[#595959] uppercase tracking-wider">Projects</div>
              </div>
              <div className="px-4 py-2 text-center border-r border-[#E2E8F0]">
                <div className="text-xl font-black text-emerald-600">{completedCount}</div>
                <div className="text-[10px] font-mono text-[#595959] uppercase tracking-wider">Completed</div>
              </div>
              <div className="px-4 py-2 text-center">
                <div className="text-xl font-black text-[#FF6B00]">{inProgressCount}</div>
                <div className="text-[10px] font-mono text-[#595959] uppercase tracking-wider">Active</div>
              </div>
            </div>
          </div>
        </div>

        {/* Projects Grid Container */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <SkeletonLoader className="h-72 rounded-2xl bg-[#F2EEE7]" />
            <SkeletonLoader className="h-72 rounded-2xl bg-[#F2EEE7]" />
            <SkeletonLoader className="h-72 rounded-2xl bg-[#F2EEE7]" />
          </div>
        ) : error ? (
          <div className="p-5 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-sm font-medium flex items-center gap-3">
            <Warning className="w-5 h-5 text-red-500 flex-shrink-0" />
            <span>{error}</span>
          </div>
        ) : projects.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#F2EEE7] border border-[#BAB7B1] rounded-3xl p-12 text-center max-w-lg mx-auto shadow-xs relative overflow-hidden flex flex-col items-center justify-center"
          >
            <div className="w-16 h-16 rounded-2xl bg-white text-[#FF6B00] border border-[#CBD5E1] font-bold text-2xl flex items-center justify-center mx-auto mb-5 shadow-xs">
              <BookOpen weight="bold" className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-bold mb-2 tracking-tight text-[#231F20]">No Active Projects</h3>
            <p className="text-xs text-[#595959] mb-6 leading-relaxed max-w-sm mx-auto">
              Start your first multi-step book illustration project by selecting sample book text or pasting your custom story.
            </p>
            <div className="flex justify-center w-full">
              <Link href="/projects/new" className="inline-flex justify-center">
                <AnimatedButton variant="primary" size="lg" className="gap-2 mx-auto">
                  <Plus weight="bold" className="w-5 h-5" />
                  Create First Project
                </AnimatedButton>
              </Link>
            </div>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project, index) => {
              const doneCount = Object.values(project.stepStates).filter((s) => s === 'done').length;
              const thumbnail = getThumbnail(project);

              return (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.06 }}
                  className="bg-[#F2EEE7] hover:bg-[#EBE5DA] border border-[#BAB7B1] hover:border-[#FF6B00] rounded-2xl overflow-hidden transition-all duration-300 shadow-xs hover:shadow-md flex flex-col justify-between group relative"
                >
                  {/* Card Artwork Header Thumbnail */}
                  <div
                    onClick={() => router.push(`/projects/${project.id}`)}
                    className="h-44 w-full bg-[#E5E0D8] relative overflow-hidden cursor-pointer border-b border-[#BAB7B1]"
                  >
                    {thumbnail ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={thumbnail}
                        alt={project.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-[#F2EEE7] via-[#E8E2D7] to-[#DDD6C8] flex flex-col items-center justify-center p-4 text-center group-hover:scale-105 transition-transform duration-500">
                        <div className="w-10 h-10 rounded-xl bg-[#FF6B00]/10 border border-[#FF6B00]/30 flex items-center justify-center text-[#FF6B00] mb-2">
                          <Sparkle weight="bold" className="w-5 h-5" />
                        </div>
                        <span className="text-[10px] font-mono text-[#595959] uppercase tracking-wider">
                          Ready for Generation
                        </span>
                      </div>
                    )}

                    <div className="absolute top-3 left-3">{getStatusBadge(project.status)}</div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteTarget(project);
                      }}
                      className="absolute top-3 right-3 p-2 rounded-xl bg-white/80 hover:bg-red-50 text-gray-600 hover:text-red-600 border border-gray-300 transition-colors shadow-xs opacity-0 group-hover:opacity-100"
                      title="Delete Project"
                    >
                      <Trash weight="bold" className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Card Body & Progress Stepper */}
                  <div
                    onClick={() => router.push(`/projects/${project.id}`)}
                    className="p-5 cursor-pointer flex-grow flex flex-col justify-between"
                  >
                    <div>
                      <h3 className="text-lg font-bold text-[#231F20] group-hover:text-[#FF6B00] transition-colors line-clamp-1 mb-1">
                        {project.title}
                      </h3>
                      <div className="flex items-center justify-between text-xs text-[#595959] font-mono mb-4">
                        <span>Created {new Date(project.createdAt).toLocaleDateString()}</span>
                        <span>{doneCount}/5 Steps Complete</span>
                      </div>
                    </div>

                    {/* 5-Segment Progress Bar */}
                    <div>
                      <div className="flex justify-between items-center text-[10px] font-mono font-bold text-[#595959] uppercase tracking-wider mb-1.5">
                        <span>Pipeline Progress</span>
                        <span className="text-[#FF6B00] font-black">{Math.round((doneCount / 5) * 100)}%</span>
                      </div>

                      <div className="grid grid-cols-5 gap-1.5">
                        {[0, 1, 2, 3, 4].map((stepIdx) => {
                          const state = project.stepStates[stepIdx];
                          const isDone = state === 'done';
                          const isRunning = state === 'running';

                          return (
                            <div
                              key={stepIdx}
                              className={`h-2 rounded-full transition-all duration-300 ${
                                isDone
                                  ? 'bg-[#FF6B00]'
                                  : isRunning
                                  ? 'bg-[#FF6B00]/60 animate-pulse'
                                  : 'bg-[#DCD6CA]'
                              }`}
                            />
                          );
                        })}
                      </div>

                      <div className="grid grid-cols-5 gap-1 text-[9px] font-mono text-[#78716C] mt-1 text-center font-semibold">
                        <span>Style</span>
                        <span>Characters</span>
                        <span>Portraits</span>
                        <span>Chapters</span>
                        <span>Illustrations</span>
                      </div>
                    </div>
                  </div>

                  {/* Card Footer CTA */}
                  <div
                    onClick={() => router.push(`/projects/${project.id}`)}
                    className="px-5 py-3.5 bg-[#E8E2D7] border-t border-[#BAB7B1] flex justify-between items-center text-xs font-bold text-[#231F20] group-hover:bg-[#FF6B00] group-hover:text-white transition-colors cursor-pointer"
                  >
                    <span>
                      {project.status === 'done'
                        ? 'View Studio Artwork'
                        : project.status === 'in_progress'
                        ? 'Continue Pipeline'
                        : 'Start Pipeline'}
                    </span>
                    <ArrowRight weight="bold" className="w-4 h-4" />
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </main>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeleteTarget(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-xs"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md bg-[#F2EEE7] border border-[#BAB7B1] rounded-3xl p-6 shadow-2xl text-[#231F20] z-10"
            >
              <div className="flex items-center justify-between border-b border-[#BAB7B1] pb-3 mb-4">
                <div className="flex items-center gap-2 text-red-600 font-bold text-sm">
                  <Warning weight="fill" className="w-5 h-5" />
                  Confirm Project Deletion
                </div>
                <button
                  onClick={() => setDeleteTarget(null)}
                  className="w-7 h-7 rounded-full bg-gray-200 text-gray-700 hover:bg-gray-300 flex items-center justify-center font-bold text-xs"
                >
                  <X weight="bold" className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-[#595959] leading-relaxed mb-6">
                Are you sure you want to delete <b className="text-[#231F20]">&quot;{deleteTarget.title}&quot;</b>? This action will remove all generated character portraits and chapter illustrations from disk.
              </p>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setDeleteTarget(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-[#595959] hover:text-[#231F20]"
                >
                  Cancel
                </button>
                <AnimatedButton
                  variant="danger"
                  size="sm"
                  loading={isDeleting}
                  onClick={handleDeleteProject}
                >
                  Delete Project
                </AnimatedButton>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

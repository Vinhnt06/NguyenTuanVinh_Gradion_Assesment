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

const STEP_LABELS = ['Style', 'Characters', 'Portraits', 'Chapters', 'Illustrations'];

export default function ProjectsPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchProjects = useCallback(async () => {
    try {
      const res = await fetch('/api/projects');
      if (res.status === 401) {
        router.push('/');
        return;
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch projects');
      setProjects(data.projects || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
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
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#1A2E20] border border-[#2D5A38] text-[#4ADE80] text-[11px] font-bold rounded-full uppercase tracking-wider">
            <CheckCircle weight="fill" className="w-3.5 h-3.5 text-[#4ADE80]" />
            Completed
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#3A1B0E] border border-[#7C3615] text-[#FF9D54] text-[11px] font-bold rounded-full uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FF6B00] animate-ping" />
            In Progress
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#1C1C22] border border-[#2E2E38] text-[#A1A1AA] text-[11px] font-bold rounded-full uppercase tracking-wider">
            <Clock weight="bold" className="w-3.5 h-3.5 text-[#A1A1AA]" />
            Draft
          </span>
        );
    }
  };

  const totalProjects = projects.length;
  const completedCount = projects.filter((p) => p.status === 'done').length;
  const inProgressCount = projects.filter((p) => p.status === 'in_progress').length;

  return (
    <div className="min-h-screen bg-[#0D0D0F] text-[#F2EEE7] pb-24 font-sans selection:bg-[#FF6B00] selection:text-white">
      {/* Top Header Navigation */}
      <header className="border-b border-[#23232A] bg-[#121216]/90 backdrop-blur-md px-6 py-4 sticky top-0 z-30 shadow-md">
        <div className="max-w-[1300px] mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Link href="/projects" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
              <Image
                src="/gradion-logo.png"
                alt="Gradion"
                width={88}
                height={31}
                priority
                className="object-contain brightness-0 invert opacity-95"
              />
              <span className="text-[#3F3F46] text-sm font-light select-none">·</span>
              <span className="text-xs font-mono tracking-widest text-[#FF6B00] uppercase font-bold">
                STUDIO WORKSPACE
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <ApiKeyBadge />
            <Link href="/projects/new">
              <AnimatedButton variant="primary" size="sm" className="gap-1.5">
                <Plus weight="bold" className="w-4 h-4" />
                New Project
              </AnimatedButton>
            </Link>
            <button
              onClick={handleSignOut}
              className="text-xs font-semibold text-[#8E8E93] hover:text-[#FF6B00] transition-colors"
            >
              Sign Out →
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-[1300px] mx-auto p-6 lg:p-8 mt-4">
        {/* Studio Hero Banner & Stats Counter */}
        <div className="mb-10 bg-gradient-to-r from-[#16161B] via-[#1A1A22] to-[#121216] border border-[#272730] rounded-3xl p-6 lg:p-8 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#FF6B00]/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Sparkle weight="fill" className="w-4 h-4 text-[#FF6B00]" />
                <span className="text-[11px] font-mono text-[#FF6B00] uppercase tracking-widest font-bold">
                  GEMINI AI ILLUSTRATION STUDIO CATALOG
                </span>
              </div>
              <h2 className="text-3xl lg:text-4xl font-extrabold tracking-tight text-white">
                Your Illustration Pipelines
              </h2>
              <p className="text-xs lg:text-sm text-[#8E8E93] mt-1 max-w-xl leading-relaxed">
                Automated 5-step visual consistency pipelines powered by Gemini Flash models and resilient SVG studio artwork generation.
              </p>
            </div>

            {/* Live Stats Row */}
            <div className="flex items-center gap-3 bg-[#0D0D10]/80 border border-[#2D2D38] p-3 rounded-2xl">
              <div className="px-4 py-2 text-center border-r border-[#262630]">
                <div className="text-xl font-black text-white">{totalProjects}</div>
                <div className="text-[10px] font-mono text-[#8E8E93] uppercase tracking-wider">Projects</div>
              </div>
              <div className="px-4 py-2 text-center border-r border-[#262630]">
                <div className="text-xl font-black text-[#4ADE80]">{completedCount}</div>
                <div className="text-[10px] font-mono text-[#8E8E93] uppercase tracking-wider">Completed</div>
              </div>
              <div className="px-4 py-2 text-center">
                <div className="text-xl font-black text-[#FF9D54]">{inProgressCount}</div>
                <div className="text-[10px] font-mono text-[#8E8E93] uppercase tracking-wider">Active</div>
              </div>
            </div>
          </div>
        </div>

        {/* Projects Grid Container */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <SkeletonLoader className="h-72 rounded-2xl bg-[#16161A]" />
            <SkeletonLoader className="h-72 rounded-2xl bg-[#16161A]" />
            <SkeletonLoader className="h-72 rounded-2xl bg-[#16161A]" />
          </div>
        ) : error ? (
          <div className="p-5 bg-red-950/40 border border-red-800 text-red-300 rounded-2xl text-sm font-medium flex items-center gap-3">
            <Warning className="w-5 h-5 text-red-400 flex-shrink-0" />
            <span>{error}</span>
          </div>
        ) : projects.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#141418] border border-[#272732] rounded-3xl p-12 text-center max-w-lg mx-auto shadow-2xl relative overflow-hidden flex flex-col items-center justify-center"
          >
            <div className="w-16 h-16 rounded-2xl bg-[#1E1E26] text-[#FF6B00] border border-[#333342] font-bold text-2xl flex items-center justify-center mx-auto mb-5 shadow-inner">
              <BookOpen weight="bold" className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-bold mb-2 tracking-tight text-white">No Active Projects</h3>
            <p className="text-xs text-[#8E8E93] mb-6 leading-relaxed max-w-sm mx-auto">
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
                  className="bg-[#141419] hover:bg-[#1A1A22] border border-[#262632] hover:border-[#3F3F52] rounded-2xl overflow-hidden transition-all duration-300 shadow-lg hover:shadow-2xl flex flex-col justify-between group relative"
                >
                  {/* Card Artwork Header Thumbnail */}
                  <div
                    onClick={() => router.push(`/projects/${project.id}`)}
                    className="h-44 w-full bg-[#1A1A22] relative overflow-hidden cursor-pointer border-b border-[#262632]"
                  >
                    {thumbnail ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={thumbnail}
                        alt={project.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-[#1C1C24] via-[#13131A] to-[#26160F] flex flex-col items-center justify-center p-4 text-center group-hover:scale-105 transition-transform duration-500">
                        <div className="w-10 h-10 rounded-xl bg-[#FF6B00]/10 border border-[#FF6B00]/30 flex items-center justify-center text-[#FF6B00] mb-2">
                          <Sparkle weight="bold" className="w-5 h-5" />
                        </div>
                        <span className="text-[10px] font-mono text-[#8E8E93] uppercase tracking-wider">
                          Ready for Generation
                        </span>
                      </div>
                    )}

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#141419] via-transparent to-black/30 pointer-events-none" />

                    {/* Top Badges */}
                    <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10">
                      <div>{getStatusBadge(project.status)}</div>

                      {/* Delete Icon Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteTarget(project);
                        }}
                        title="Delete project"
                        className="w-8 h-8 rounded-full bg-black/60 hover:bg-red-600/90 backdrop-blur-md border border-white/10 hover:border-red-500 text-[#8E8E93] hover:text-white flex items-center justify-center transition-all duration-200 shadow-md"
                      >
                        <Trash weight="bold" className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Card Content Footer */}
                  <div
                    onClick={() => router.push(`/projects/${project.id}`)}
                    className="p-5 cursor-pointer flex-1 flex flex-col justify-between gap-4"
                  >
                    <div>
                      <h3 className="text-lg font-bold text-white group-hover:text-[#FF6B00] transition-colors leading-snug mb-1 truncate">
                        {project.title}
                      </h3>
                      <p className="text-[11px] text-[#8E8E93] font-mono">
                        Created {new Date(project.createdAt).toLocaleDateString()} · {doneCount}/5 Steps Complete
                      </p>
                    </div>

                    {/* 5-Step Visual Node Bar */}
                    <div className="space-y-1.5 pt-3 border-t border-[#262632]">
                      <div className="flex justify-between text-[10px] font-mono font-semibold text-[#8E8E93]">
                        <span>Pipeline Progress</span>
                        <span className="text-white">{Math.round((doneCount / 5) * 100)}%</span>
                      </div>
                      <div className="grid grid-cols-5 gap-1.5">
                        {STEP_LABELS.map((label, idx) => {
                          const isDone = project.stepStates[idx] === 'done';
                          const isCurrent = project.stepStates[idx] === 'running';
                          return (
                            <div key={label} className="space-y-1">
                              <div
                                className={`h-1.5 rounded-full transition-all ${
                                  isDone
                                    ? 'bg-[#FF6B00]'
                                    : isCurrent
                                    ? 'bg-[#FF9D54] animate-pulse'
                                    : 'bg-[#2B2B36]'
                                }`}
                              />
                              <span className="text-[8px] font-mono text-[#71717A] block text-center truncate">
                                {label}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-[#18181E] border border-[#30303D] rounded-3xl p-6 lg:p-8 max-w-md w-full shadow-2xl relative overflow-hidden"
            >
              <div className="w-12 h-12 rounded-2xl bg-red-950/60 border border-red-800/80 text-red-500 flex items-center justify-center mb-4">
                <Warning weight="bold" className="w-6 h-6" />
              </div>

              <h3 className="text-xl font-bold text-white mb-2">Delete Project?</h3>
              <p className="text-xs text-[#8E8E93] leading-relaxed mb-6">
                Are you sure you want to delete <span className="text-white font-bold">&quot;{deleteTarget.title}&quot;</span>? This will permanently remove all state data, prompts, and generated artwork files.
              </p>

              <div className="flex items-center justify-end gap-3">
                <button
                  disabled={isDeleting}
                  onClick={() => setDeleteTarget(null)}
                  className="px-4 py-2.5 rounded-xl border border-[#333342] text-xs font-semibold text-[#8E8E93] hover:text-white hover:border-[#4A4A5E] transition-colors"
                >
                  Cancel
                </button>
                <button
                  disabled={isDeleting}
                  onClick={handleDeleteProject}
                  className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-all shadow-md flex items-center gap-2"
                >
                  {isDeleting ? (
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Trash weight="bold" className="w-4 h-4" />
                  )}
                  Delete Forever
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

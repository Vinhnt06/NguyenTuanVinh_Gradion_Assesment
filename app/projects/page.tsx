'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'motion/react';
import AnimatedButton from '@/components/ui/AnimatedButton';
import SkeletonLoader from '@/components/ui/SkeletonLoader';

interface Project {
  id: string;
  title: string;
  createdAt: string;
  status: 'draft' | 'in_progress' | 'done';
  currentStep: number;
  stepStates: Record<number, string>;
}

const STEP_LABELS = ['Style', 'Characters', 'Portraits', 'Chapters', 'Illustrations'];

export default function ProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'done':
        return (
          <span className="px-2.5 py-0.5 bg-[#231F20] text-white text-[11px] font-bold rounded-full uppercase tracking-wider">
            Completed ✓
          </span>
        );
      case 'in_progress':
        return (
          <span className="px-2.5 py-0.5 bg-[#FF6B00] text-white text-[11px] font-bold rounded-full uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            In Progress
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 bg-[#BAB7B1] text-[#434343] text-[11px] font-bold rounded-full uppercase tracking-wider">
            Draft
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F8F8] text-[#231F20] pb-16">
      {/* Top Header Navigation */}
      <header className="border-b border-[#BAB7B1] bg-[#F2EEE7] px-6 py-4 sticky top-0 z-30 shadow-2xs backdrop-blur-md bg-[#F2EEE7]/90">
        <div className="max-w-[1200px] mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#FF6B00] text-white font-black text-sm flex items-center justify-center shadow-xs">
              G
            </div>
            <div>
              <span className="text-[10px] font-mono text-[#919699] uppercase tracking-widest block">
                GRADION ASSESSMENT
              </span>
              <h1 className="text-base font-bold text-[#231F20] leading-none">
                Book Illustration Studio
              </h1>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="text-xs font-semibold text-[#595959] hover:text-[#FF6B00] transition-colors"
          >
            Sign Out →
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-[1200px] mx-auto p-6 lg:p-8 mt-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <span className="text-[11px] font-bold text-[#FF6B00] uppercase tracking-wider block">
              PIPELINE CATALOG
            </span>
            <h2 className="text-3xl font-extrabold tracking-tight">Your Illustration Projects</h2>
            <p className="text-xs text-[#595959] mt-1">
              Manage multi-step Gemini AI book illustration pipelines
            </p>
          </div>
          <Link href="/projects/new">
            <AnimatedButton variant="primary" size="md">
              Start New Project +
            </AnimatedButton>
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <SkeletonLoader className="h-44 rounded-2xl" />
            <SkeletonLoader className="h-44 rounded-2xl" />
          </div>
        ) : error ? (
          <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm font-medium">
            {error}
          </div>
        ) : projects.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#F2EEE7] border border-[#BAB7B1] rounded-2xl p-12 text-center max-w-lg mx-auto shadow-sm"
          >
            <div className="w-12 h-12 rounded-full bg-[#E8E2E0] text-[#FF6B00] font-bold text-xl flex items-center justify-center mx-auto mb-4">
              📚
            </div>
            <h3 className="text-xl font-bold mb-2 tracking-tight">No Active Projects</h3>
            <p className="text-xs text-[#595959] mb-6 leading-relaxed">
              Initiate your first book illustration pipeline by providing a title and pasting book content or uploading a file.
            </p>
            <Link href="/projects/new">
              <AnimatedButton variant="primary" size="lg">
                Create First Project →
              </AnimatedButton>
            </Link>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {projects.map((project, index) => {
              const doneCount = Object.values(project.stepStates).filter((s) => s === 'done').length;
              return (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  onClick={() => router.push(`/projects/${project.id}`)}
                  className="bg-[#F2EEE7] hover:bg-white border border-[#BAB7B1] hover:border-[#919699] rounded-2xl p-6 transition-all duration-200 cursor-pointer shadow-xs hover:shadow-md flex flex-col justify-between gap-6 group"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-xl font-bold text-[#231F20] group-hover:text-[#FF6B00] transition-colors leading-tight">
                        {project.title}
                      </h3>
                      {getStatusBadge(project.status)}
                    </div>
                    <p className="text-xs text-[#919699] font-mono">
                      Created {new Date(project.createdAt).toLocaleDateString()} · {doneCount}/5 Steps Done
                    </p>
                  </div>

                  {/* Visual 5-Step Progress Bar */}
                  <div className="space-y-2 pt-2 border-t border-[#BAB7B1]/40">
                    <div className="flex justify-between text-[11px] font-semibold text-[#595959]">
                      <span>Pipeline Progress</span>
                      <span>{Math.round((doneCount / 5) * 100)}%</span>
                    </div>
                    <div className="grid grid-cols-5 gap-1.5">
                      {STEP_LABELS.map((label, idx) => {
                        const isDone = project.stepStates[idx] === 'done';
                        const isCurrent = project.stepStates[idx] === 'running';
                        return (
                          <div key={label} className="space-y-1">
                            <div
                              className={`h-2 rounded-full transition-all ${
                                isDone
                                  ? 'bg-[#231F20]'
                                  : isCurrent
                                  ? 'bg-[#FF6B00] animate-pulse'
                                  : 'bg-[#BAB7B1]/60'
                              }`}
                            />
                            <span className="text-[9px] text-[#919699] block text-center truncate">
                              {label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

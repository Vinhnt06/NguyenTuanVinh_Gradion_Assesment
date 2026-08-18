'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

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

  const getStatusPill = (status: string) => {
    switch (status) {
      case 'done':
        return (
          <span className="px-3 py-1 bg-[#231F20] text-white text-xs font-bold rounded-full">
            Done
          </span>
        );
      case 'in_progress':
        return (
          <span className="px-3 py-1 bg-[#FF6B00] text-white text-xs font-bold rounded-full flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            In Progress
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 bg-[#919699] text-white text-xs font-bold rounded-full">
            Draft
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F8F8] text-[#231F20]">
      {/* Header Bar */}
      <header className="border-b border-[#BAB7B1] bg-[#F2EEE7] px-6 py-4">
        <div className="max-w-[1100px] mx-auto flex justify-between items-center">
          <div>
            <span className="text-xs font-semibold text-[#919699] uppercase tracking-wider">
              GRADION ASSESSMENT
            </span>
            <h1 className="text-xl font-bold text-[#231F20]">Book Illustration Studio</h1>
          </div>
          <button
            onClick={handleSignOut}
            className="text-xs font-semibold text-[#595959] hover:text-[#FF6B00] transition-colors"
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[1100px] mx-auto p-6">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold">Your Projects</h2>
            <p className="text-sm text-[#595959]">
              Manage and continue your book illustration pipelines
            </p>
          </div>
          <Link
            href="/projects/new"
            className="px-5 py-2.5 bg-[#FF6B00] hover:bg-[#E85F00] text-white font-semibold rounded-lg text-sm transition-colors flex items-center gap-2"
          >
            Start New Project +
          </Link>
        </div>

        {loading ? (
          <div className="p-12 text-center text-sm text-[#919699]">
            Loading your projects...
          </div>
        ) : error ? (
          <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
            {error}
          </div>
        ) : projects.length === 0 ? (
          <div className="bg-[#F2EEE7] border border-[#BAB7B1] rounded-2xl p-12 text-center">
            <h3 className="text-lg font-bold mb-2">No Projects Yet</h3>
            <p className="text-sm text-[#595959] mb-6 max-w-md mx-auto">
              Create your first project by adding a book&apos;s title and pasting its text or uploading a .txt file.
            </p>
            <Link
              href="/projects/new"
              className="inline-flex px-6 py-3 bg-[#FF6B00] hover:bg-[#E85F00] text-white font-semibold rounded-lg text-sm transition-colors"
            >
              Create First Project →
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {projects.map((project) => (
              <div
                key={project.id}
                onClick={() => router.push(`/projects/${project.id}`)}
                className="bg-[#F2EEE7] hover:bg-[#E8E2E0] border border-[#BAB7B1] rounded-xl p-6 transition-all duration-150 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-bold">{project.title}</h3>
                    {getStatusPill(project.status)}
                  </div>
                  <p className="text-xs text-[#919699]">
                    Created {new Date(project.createdAt).toLocaleDateString()}
                  </p>
                </div>

                {/* Stepper preview */}
                <div className="flex items-center gap-2">
                  {STEP_LABELS.map((label, idx) => {
                    const isDone = project.stepStates[idx] === 'done';
                    const isCurrent = project.stepStates[idx] === 'running';
                    return (
                      <div key={label} className="flex items-center gap-2">
                        <div
                          className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center ${
                            isDone
                              ? 'bg-[#231F20] text-white'
                              : isCurrent
                              ? 'bg-[#FF6B00] text-white animate-pulse'
                              : 'bg-[#BAB7B1] text-white'
                          }`}
                        >
                          {isDone ? '✓' : idx + 1}
                        </div>
                        {idx < STEP_LABELS.length - 1 && (
                          <div
                            className={`w-4 h-0.5 ${
                              isDone ? 'bg-[#231F20]' : 'bg-[#BAB7B1]'
                            }`}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

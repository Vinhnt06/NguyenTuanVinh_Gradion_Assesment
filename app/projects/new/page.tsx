'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'motion/react';
import AnimatedButton from '@/components/ui/AnimatedButton';

export default function NewProjectPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState('');
  const [bookText, setBookText] = useState('');
  const [fileName, setFileName] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const wordCount = bookText.trim() ? bookText.trim().split(/\s+/).length : 0;
  const estimatedMin = Math.max(1, Math.ceil(wordCount / 500));

  const handleFileChange = (file: File | undefined) => {
    if (!file) return;

    if (!file.name.endsWith('.txt')) {
      setError('Please upload a plain text file (.txt)');
      return;
    }

    setError('');
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setBookText(text || '');
    };
    reader.readAsText(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    handleFileChange(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('Please enter a project title');
      return;
    }

    if (!bookText.trim()) {
      setError('Please provide book text by pasting or uploading a .txt file');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          bookText: bookText.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create project');
      }

      router.push(`/projects/${data.project.id}`);
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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
          <span className="text-[10px] font-bold text-[#919699] uppercase tracking-widest">
            STUDIO WIZARD
          </span>
        </div>
      </header>

      {/* Main Wizard Form */}
      <main className="max-w-[680px] mx-auto p-6 mt-6">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-[#F2EEE7] border border-[#BAB7B1] rounded-2xl p-8 shadow-sm"
        >
          <div className="mb-6">
            <span className="text-[10px] font-extrabold text-[#FF6B00] uppercase tracking-wider block mb-1">
              PIPELINE INITIALIZATION
            </span>
            <h2 className="text-2xl font-extrabold tracking-tight mb-1">
              Start New Illustration Studio
            </h2>
            <p className="text-xs text-[#595959] leading-relaxed">
              Provide a descriptive book title and the source text. This text is reused for context across all 5 automated steps.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-[#231F20] mb-1.5">
                Project Title <span className="text-[#FF6B00]">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. The Wind in the Willows — Sepia Woodcut"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-[#BAB7B1] rounded-xl text-sm text-[#231F20] focus:outline-none focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00] transition-all"
                disabled={loading}
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-bold text-[#231F20]">
                  Source Book Text <span className="text-[#FF6B00]">*</span>
                </label>
                {wordCount > 0 && (
                  <span className="text-[11px] font-mono text-[#595959]">
                    {wordCount.toLocaleString()} words · ~{estimatedMin} min context
                  </span>
                )}
              </div>

              {/* Drag and Drop Zone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200 mb-3 ${
                  isDragging
                    ? 'border-[#FF6B00] bg-[#FF6B00]/5 scale-[0.99]'
                    : fileName
                    ? 'border-[#231F20] bg-white'
                    : 'border-[#BAB7B1] hover:border-[#FF6B00] bg-white'
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".txt"
                  onChange={(e) => handleFileChange(e.target.files?.[0])}
                  className="hidden"
                />
                <div className="w-10 h-10 rounded-full bg-[#F8F8F8] border border-[#BAB7B1] text-[#FF6B00] text-lg font-bold flex items-center justify-center mx-auto mb-2">
                  📄
                </div>
                <p className="text-xs font-bold text-[#231F20]">
                  {fileName ? `File Selected: ${fileName}` : 'Drop your .txt book file here or click to browse'}
                </p>
                <p className="text-[11px] text-[#919699] mt-0.5">
                  Plain text only (.txt) · Enforces session context reuse
                </p>
              </div>

              <div className="relative flex py-1 items-center mb-3">
                <div className="flex-grow border-t border-[#BAB7B1]/60" />
                <span className="flex-shrink mx-3 text-[11px] font-semibold text-[#919699]">
                  OR PASTE DIRECTLY
                </span>
                <div className="flex-grow border-t border-[#BAB7B1]/60" />
              </div>

              <textarea
                rows={7}
                placeholder="Once upon a time, in a small burrow by the river, lived a quiet mole..."
                value={bookText}
                onChange={(e) => setBookText(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-[#BAB7B1] rounded-xl text-xs font-mono text-[#231F20] focus:outline-none focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00] leading-relaxed transition-all"
                disabled={loading}
              />
            </div>

            {error && (
              <div className="p-3.5 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs font-medium">
                {error}
              </div>
            )}

            <AnimatedButton
              type="submit"
              loading={loading}
              variant="primary"
              size="lg"
              className="w-full"
            >
              {loading ? 'Initializing Pipeline...' : 'Initialize Studio Pipeline →'}
            </AnimatedButton>
          </form>
        </motion.div>
      </main>
    </div>
  );
}

'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function NewProjectPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState('');
  const [bookText, setBookText] = useState('');
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
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
    <div className="min-h-screen bg-[#F8F8F8] text-[#231F20]">
      {/* Header Bar */}
      <header className="border-b border-[#BAB7B1] bg-[#F2EEE7] px-6 py-4">
        <div className="max-w-[1100px] mx-auto flex justify-between items-center">
          <Link
            href="/projects"
            className="text-xs font-semibold text-[#595959] hover:text-[#FF6B00] transition-colors"
          >
            ← Back to Projects
          </Link>
          <span className="text-xs font-semibold text-[#919699] uppercase tracking-wider">
            NEW PROJECT
          </span>
        </div>
      </header>

      {/* Main Form */}
      <main className="max-w-[640px] mx-auto p-6 mt-6">
        <div className="bg-[#F2EEE7] border border-[#BAB7B1] rounded-2xl p-8 shadow-sm">
          <h2 className="text-2xl font-bold mb-1">Start a new illustration project</h2>
          <p className="text-xs text-[#595959] mb-6">
            Give it a title, then paste the book's text or upload a .txt file.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-[#231F20] mb-1">
                Project Title <span className="text-[#FF6B00]">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. The Wind in the Willows — cottage-core"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-[#BAB7B1] rounded-lg text-sm text-[#231F20] focus:outline-none focus:border-[#FF6B00]"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#231F20] mb-1">
                Book Text <span className="text-[#FF6B00]">*</span>
              </label>

              {/* Upload Dropzone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-[#BAB7B1] hover:border-[#FF6B00] bg-white rounded-lg p-6 text-center cursor-pointer transition-colors mb-3"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".txt"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <p className="text-xs font-semibold text-[#231F20]">
                  {fileName ? `Selected: ${fileName}` : 'Click to choose a .txt file'}
                </p>
                <p className="text-[11px] text-[#919699] mt-0.5">
                  Plain text only · used once as context for every step
                </p>
              </div>

              <div className="relative flex py-1 items-center mb-3">
                <div className="flex-grow border-t border-[#BAB7B1]" />
                <span className="flex-shrink mx-3 text-xs text-[#919699]">or paste text</span>
                <div className="flex-grow border-t border-[#BAB7B1]" />
              </div>

              <textarea
                rows={6}
                placeholder="Once upon a time, in a small burrow by the river..."
                value={bookText}
                onChange={(e) => setBookText(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-[#BAB7B1] rounded-lg text-sm text-[#231F20] focus:outline-none focus:border-[#FF6B00]"
                disabled={loading}
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-xs font-medium">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#FF6B00] hover:bg-[#E85F00] text-white font-semibold rounded-lg text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? 'Creating Project...' : 'Create Project →'}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function IdentityPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Please enter your full name');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: email.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      router.push('/projects');
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-[#F8F8F8]">
      <div className="w-full max-w-[480px] bg-[#F2EEE7] rounded-2xl p-8 border border-[#BAB7B1] shadow-sm">
        <div className="mb-6 text-center">
          <p className="text-xs font-semibold tracking-wider text-[#919699] uppercase mb-1">
            GRADION ASSESSMENT · <b>SOFTWARE ENGINEER INTERN</b>
          </p>
          <h1 className="text-3xl font-bold text-[#231F20] tracking-tight mb-2">
            Book Illustration Studio
          </h1>
          <p className="text-sm text-[#595959]">
            Enter your details to access your projects or create a new illustration workspace.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#231F20] mb-1">
              Full Name <span className="text-[#FF6B00]">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Tuấn Vinh Nguyễn"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2.5 bg-white border border-[#BAB7B1] rounded-lg text-sm text-[#231F20] focus:outline-none focus:border-[#FF6B00]"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#231F20] mb-1">
              Email Address <span className="text-[#FF6B00]">*</span>
            </label>
            <input
              type="email"
              placeholder="e.g. vinhnt@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2.5 bg-white border border-[#BAB7B1] rounded-lg text-sm text-[#231F20] focus:outline-none focus:border-[#FF6B00]"
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
            className="w-full py-3 bg-[#FF6B00] hover:bg-[#E85F00] text-white font-semibold rounded-lg text-sm transition-colors duration-150 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? 'Entering Studio...' : 'Continue to Studio →'}
          </button>
        </form>
      </div>
    </main>
  );
}

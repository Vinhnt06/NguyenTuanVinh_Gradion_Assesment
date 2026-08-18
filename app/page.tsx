'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion } from 'framer-motion';
import AnimatedButton from '@/components/ui/AnimatedButton';

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
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-[#F8F8F8] selection:bg-[#FF6B00] selection:text-white overflow-hidden">
      {/* Left Artwork Hero Panel (7 Cols desktop) - Radical Visual Identity */}
      <motion.div
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="lg:col-span-7 bg-[#231F20] text-white p-8 lg:p-16 flex flex-col justify-between relative overflow-hidden min-h-[400px] lg:min-h-screen"
      >
        {/* Abstract Decorative Geometry */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-[#FF6B00]/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-[#FFA861]/10 rounded-full blur-3xl pointer-events-none" />

        {/* Brand Header */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <span className="w-3 h-3 rounded-full bg-[#FF6B00] animate-pulse flex-shrink-0" />
            <Image
              src="/gradion-logo.png"
              alt="Gradion"
              width={100}
              height={35}
              priority
              className="object-contain brightness-0 invert opacity-90"
            />
            <span className="text-[10px] font-mono tracking-widest text-[#919699] uppercase">
              SOFTWARE ENGINEER INTERN
            </span>
          </div>

          <h1 className="text-4xl lg:text-6xl font-extrabold tracking-tight leading-[1.05] mb-6">
            Book Illustration <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF6B00] via-[#FFA861] to-white">
              Studio Workspace
            </span>
          </h1>

          <p className="text-sm lg:text-base text-[#919699] max-w-lg leading-relaxed">
            Automated 5-step generative pipeline turning raw book text into consistent character portraits and chapter scene illustrations via Gemini AI API.
          </p>
        </div>

        {/* Feature Highlights Grid */}
        <div className="relative z-10 grid grid-cols-2 gap-4 my-8 lg:my-0">
          <div className="p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xs">
            <div className="text-[#FF6B00] font-bold text-lg mb-1">01. Style &amp; Prompts</div>
            <div className="text-xs text-[#919699]">Atomic JSON state &amp; Gemini analysis</div>
          </div>
          <div className="p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xs">
            <div className="text-[#FF6B00] font-bold text-lg mb-1">02. Character Consistency</div>
            <div className="text-xs text-[#919699]">Max 2 characters strictly enforced</div>
          </div>
          <div className="p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xs">
            <div className="text-[#FF6B00] font-bold text-lg mb-1">03. Resumable State</div>
            <div className="text-xs text-[#919699]">Atomic storage across restarts</div>
          </div>
          <div className="p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xs">
            <div className="text-[#FF6B00] font-bold text-lg mb-1">04. Stuck Step Guard</div>
            <div className="text-xs text-[#919699]">409 Concurrent call prevention</div>
          </div>
        </div>

        {/* Footer Credit */}
        <div className="relative z-10 text-xs text-[#595959] flex items-center justify-between border-t border-white/10 pt-4">
          <span>Candidate: <b>Tuấn Vinh Nguyễn</b></span>
          <span className="font-mono text-[10px]">v1.1.0 · Gradion Intern AI Studio</span>
        </div>
      </motion.div>

      {/* Right Login Form Panel (5 Cols desktop) */}
      <motion.div
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 0.1, ease: 'easeOut' }}
        className="lg:col-span-5 flex items-center justify-center p-6 lg:p-12"
      >
        <div className="w-full max-w-[420px] bg-[#F2EEE7] rounded-2xl p-8 border border-[#BAB7B1] shadow-sm">
          <div className="mb-6">
            <span className="text-[10px] font-bold text-[#FF6B00] uppercase tracking-wider block mb-1">
              STUDIO AUTHENTICATION
            </span>
            <h2 className="text-2xl font-bold text-[#231F20] tracking-tight mb-1">
              Enter Workspace
            </h2>
            <p className="text-xs text-[#595959] leading-relaxed">
              Identify yourself to load existing illustration projects or initiate a new pipeline.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#231F20] mb-1.5">
                Full Name <span className="text-[#FF6B00]">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Tuấn Vinh Nguyễn"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-[#BAB7B1] rounded-lg text-sm text-[#231F20] focus:outline-none focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00] transition-colors"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#231F20] mb-1.5">
                Email Address <span className="text-[#FF6B00]">*</span>
              </label>
              <input
                type="email"
                placeholder="e.g. vinhnt@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-[#BAB7B1] rounded-lg text-sm text-[#231F20] focus:outline-none focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00] transition-colors"
                disabled={loading}
              />
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-xs font-medium"
              >
                {error}
              </motion.div>
            )}

            <AnimatedButton
              type="submit"
              loading={loading}
              variant="primary"
              size="lg"
              className="w-full mt-2"
            >
              {loading ? 'Entering Studio...' : 'Continue to Studio →'}
            </AnimatedButton>
          </form>
        </div>
      </motion.div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Sparkle, ShieldCheck, Cpu, ArrowRight } from '@phosphor-icons/react';
import AnimatedButton from '@/components/ui/AnimatedButton';

export default function LandingPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Please enter your name');
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

  // Stagger animation variants for clean sequential entry
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as const } },
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-[#0D0D0F] text-[#F2EEE7] selection:bg-[#FF6B00] selection:text-white overflow-hidden font-sans">
      {/* Left Artwork Hero Panel (7 Cols desktop) - Animated Visual Identity */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="lg:col-span-7 bg-[#121216] text-white p-8 lg:p-16 flex flex-col justify-between relative overflow-hidden min-h-[500px] lg:min-h-screen border-r border-[#22222B]"
      >
        {/* Animated Ambient Fluid Orbs */}
        <motion.div
          animate={{
            x: [0, 50, -30, 0],
            y: [0, -40, 30, 0],
            scale: [1, 1.25, 0.95, 1],
          }}
          transition={{
            duration: 18,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute -top-32 -left-32 w-[520px] h-[520px] bg-[#FF6B00]/15 rounded-full blur-[140px] pointer-events-none"
        />

        <motion.div
          animate={{
            x: [0, -40, 40, 0],
            y: [0, 50, -20, 0],
            scale: [1, 1.15, 1.3, 1],
          }}
          transition={{
            duration: 22,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute -bottom-32 -right-32 w-[520px] h-[520px] bg-[#FFA861]/10 rounded-full blur-[140px] pointer-events-none"
        />

        {/* Subtle Geometric Background Mesh */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff04_1px,transparent_1px),linear-gradient(to_bottom,#ffffff04_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />

        {/* Content Stagger Wrapper */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="relative z-10"
        >
          {/* Brand Header */}
          <motion.div variants={itemVariants} className="flex items-center gap-3 mb-10">
            <span className="w-2.5 h-2.5 rounded-full bg-[#FF6B00] animate-pulse flex-shrink-0" />
            <Image
              src="/gradion-logo.png"
              alt="Gradion"
              width={96}
              height={33}
              priority
              className="object-contain brightness-0 invert opacity-95"
            />
            <span className="text-[#3A3A45] font-light">·</span>
            <span className="text-[10px] font-mono tracking-widest text-[#8E8E93] uppercase">
              ASSESSMENT WORKSPACE
            </span>
          </motion.div>

          <motion.h1
            variants={itemVariants}
            className="text-4xl lg:text-6xl font-black tracking-tight leading-[1.05] mb-6 text-white max-w-xl"
          >
            Generative Book <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF6B00] via-[#FFA861] to-white">
              Illustration Studio.
            </span>
          </motion.h1>

          <motion.p variants={itemVariants} className="text-sm lg:text-base text-[#8E8E93] max-w-md leading-relaxed">
            Turn raw book text into consistent character artwork and chapter scene illustrations via Gemini AI API.
          </motion.p>
        </motion.div>

        {/* Refined Feature Badges with Magnetic Motion */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 grid grid-cols-1 sm:grid-cols-3 gap-3 my-8 lg:my-0"
        >
          <motion.div
            whileHover={{ y: -4, scale: 1.02 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="p-3.5 rounded-2xl bg-[#181820]/90 border border-[#272736] hover:border-[#FF6B00]/40 transition-colors flex items-center gap-3 cursor-pointer shadow-sm backdrop-blur-xs"
          >
            <Sparkle weight="fill" className="w-4 h-4 text-[#FF6B00] flex-shrink-0" />
            <div>
              <div className="text-xs font-bold text-white">01. Style Engine</div>
              <div className="text-[10px] text-[#8E8E93] font-mono">Gemini AI Prompt</div>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ y: -4, scale: 1.02 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="p-3.5 rounded-2xl bg-[#181820]/90 border border-[#272736] hover:border-[#FF6B00]/40 transition-colors flex items-center gap-3 cursor-pointer shadow-sm backdrop-blur-xs"
          >
            <ShieldCheck weight="fill" className="w-4 h-4 text-[#FF6B00] flex-shrink-0" />
            <div>
              <div className="text-xs font-bold text-white">02. Character Lock</div>
              <div className="text-[10px] text-[#8E8E93] font-mono">Max 2 Adults</div>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ y: -4, scale: 1.02 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="p-3.5 rounded-2xl bg-[#181820]/90 border border-[#272736] hover:border-[#FF6B00]/40 transition-colors flex items-center gap-3 cursor-pointer shadow-sm backdrop-blur-xs"
          >
            <Cpu weight="fill" className="w-4 h-4 text-[#FF6B00] flex-shrink-0" />
            <div>
              <div className="text-xs font-bold text-white">03. Resumable</div>
              <div className="text-[10px] text-[#8E8E93] font-mono">Atomic State</div>
            </div>
          </motion.div>
        </motion.div>

        {/* Footer Credit Line */}
        <div className="relative z-10 text-xs text-[#71717A] flex items-center justify-between border-t border-[#22222B] pt-4">
          <span>Candidate: <b className="text-[#A1A1AA]">Tuấn Vinh Nguyễn</b></span>
          <span className="font-mono text-[10px]">v1.2.0 · Gradion Assessment</span>
        </div>
      </motion.div>

      {/* Right Form Panel (5 Cols desktop) - Dark Glass Authentication */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
        className="lg:col-span-5 flex items-center justify-center p-6 lg:p-12 bg-[#0D0D0F] relative overflow-hidden"
      >
        {/* Subtle Background Glow behind form */}
        <div className="absolute w-72 h-72 bg-[#FF6B00]/10 rounded-full blur-[100px] pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-[400px] bg-[#141419]/90 backdrop-blur-md rounded-3xl p-8 border border-[#262632] hover:border-[#353545] transition-colors shadow-2xl relative z-10"
        >
          <div className="mb-6">
            <span className="text-[10px] font-mono font-bold text-[#FF6B00] uppercase tracking-widest block mb-1">
              STUDIO AUTHENTICATION
            </span>
            <h2 className="text-2xl font-bold text-white tracking-tight mb-1">
              Enter Workspace
            </h2>
            <p className="text-xs text-[#8E8E93]">
              Enter your name and email to access project pipelines.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#D4D4D8] mb-1.5">
                Full Name <span className="text-[#FF6B00]">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Tuấn Vinh Nguyễn"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 bg-[#0D0D0F] border border-[#2D2D3B] rounded-xl text-sm text-white placeholder-[#52525B] focus:outline-none focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00] transition-all"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#D4D4D8] mb-1.5">
                Email Address <span className="text-[#FF6B00]">*</span>
              </label>
              <input
                type="email"
                placeholder="e.g. vinhnt@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-[#0D0D0F] border border-[#2D2D3B] rounded-xl text-sm text-white placeholder-[#52525B] focus:outline-none focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00] transition-all"
                disabled={loading}
              />
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-red-950/60 border border-red-800 text-red-300 rounded-xl text-xs font-medium"
              >
                {error}
              </motion.div>
            )}

            <AnimatedButton
              type="submit"
              loading={loading}
              variant="primary"
              size="lg"
              className="w-full mt-2 gap-2"
            >
              {loading ? 'Entering Studio...' : 'Continue to Studio →'}
            </AnimatedButton>
          </form>
        </motion.div>
      </motion.div>
    </div>
  );
}

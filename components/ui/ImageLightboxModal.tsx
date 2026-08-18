'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Copy, Check, ArrowsOut, Sparkle } from '@phosphor-icons/react';
import AnimatedButton from '@/components/ui/AnimatedButton';

interface ImageLightboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  typeLabel: string;
  prompt: string;
  imagePath: string;
  onRegenerate?: () => void;
  isRegenerating?: boolean;
}

export default function ImageLightboxModal({
  isOpen,
  onClose,
  title,
  typeLabel,
  prompt,
  imagePath,
  onRegenerate,
  isRegenerating = false,
}: ImageLightboxModalProps) {
  const [mounted, setMounted] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!mounted || !isOpen) return null;

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isSVG = imagePath.endsWith('.svg');

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 lg:p-8">
        {/* Fullscreen Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/90 backdrop-blur-md"
        />

        {/* Lightbox Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 10 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-5xl bg-[#141418] border border-[#272736] rounded-3xl overflow-hidden shadow-2xl z-10 grid grid-cols-1 lg:grid-cols-12 max-h-[90vh]"
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-[#1F1F28] hover:bg-[#2D2D3B] text-gray-300 hover:text-white flex items-center justify-center transition-colors border border-[#323242]"
            title="Close viewer (ESC)"
          >
            <X weight="bold" className="w-5 h-5" />
          </button>

          {/* Left Column: Image Viewer Panel (7 cols desktop) */}
          <div className="lg:col-span-7 bg-black/60 p-6 flex flex-col items-center justify-center relative overflow-hidden border-b lg:border-b-0 lg:border-r border-[#272736] min-h-[350px]">
            {/* Background Subtle Ambient Glow */}
            <div className="absolute w-72 h-72 bg-[#FF6B00]/15 rounded-full blur-[100px] pointer-events-none" />

            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imagePath}
              alt={title}
              className="max-h-[70vh] max-w-full object-contain rounded-xl shadow-2xl relative z-10"
            />

            <div className="absolute bottom-3 left-4 text-[10px] font-mono text-gray-400 flex items-center gap-2">
              <ArrowsOut weight="bold" className="w-3.5 h-3.5 text-[#FF6B00]" />
              <span>{isSVG ? 'Vector Studio Artwork' : 'HD Studio Render'}</span>
            </div>
          </div>

          {/* Right Column: Details & Actions Panel (5 cols desktop) */}
          <div className="lg:col-span-5 p-6 lg:p-8 flex flex-col justify-between overflow-y-auto bg-[#141418] text-[#F2EEE7]">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 bg-[#FF6B00]/15 text-[#FF6B00] border border-[#FF6B00]/30 rounded uppercase tracking-wider">
                  {typeLabel}
                </span>
                <span className="text-[10px] font-mono text-[#8E8E93]">
                  {isSVG ? 'SVG Vector' : 'High Quality'}
                </span>
              </div>

              <h3 className="text-2xl font-extrabold text-white tracking-tight mb-4">{title}</h3>

              {/* Prompt Box */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-mono font-bold text-gray-400 uppercase tracking-wider">
                    AI Generation Prompt
                  </span>
                  <button
                    onClick={handleCopyPrompt}
                    className="text-[11px] font-mono text-[#FF6B00] hover:underline flex items-center gap-1"
                  >
                    {copied ? (
                      <>
                        <Check weight="bold" className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy weight="bold" className="w-3.5 h-3.5" />
                        <span>Copy Prompt</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="p-4 bg-[#0B0B0E] border border-[#232330] rounded-xl text-xs font-mono text-gray-300 leading-relaxed max-h-48 overflow-y-auto selection:bg-[#FF6B00]">
                  {prompt}
                </div>
              </div>
            </div>

            {/* Bottom Actions Row */}
            <div className="space-y-3 pt-4 border-t border-[#232330]">
              <a
                href={imagePath}
                download={`${title.toLowerCase().replace(/\s+/g, '-')}-artwork`}
                className="w-full"
              >
                <AnimatedButton variant="secondary" size="md" className="w-full gap-2 justify-center">
                  <Download weight="bold" className="w-4 h-4 text-[#FF6B00]" />
                  Download Artwork File
                </AnimatedButton>
              </a>

              {onRegenerate && (
                <AnimatedButton
                  variant="primary"
                  size="md"
                  loading={isRegenerating}
                  onClick={onRegenerate}
                  className="w-full gap-2 justify-center"
                >
                  <Sparkle weight="bold" className="w-4 h-4" />
                  {isRegenerating ? 'Generating New Picture...' : 'Re-generate AI Picture'}
                </AnimatedButton>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}

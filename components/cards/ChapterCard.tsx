'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowClockwise } from '@phosphor-icons/react';
import SkeletonLoader from '@/components/ui/SkeletonLoader';

interface ChapterCardProps {
  chapter: {
    name: string;
    prompt: string;
    illustrationPath?: string;
  };
  isGenerating?: boolean;
  onRegenerateImage?: () => void;
}

export default function ChapterCard({
  chapter,
  isGenerating,
  onRegenerateImage,
}: ChapterCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);

  const handleRegenerate = async () => {
    if (!onRegenerateImage || isRegenerating) return;
    setIsRegenerating(true);
    try {
      await onRegenerateImage();
    } finally {
      setIsRegenerating(false);
    }
  };

  const isLocalSVG = chapter.illustrationPath?.endsWith('.svg');

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
      className="bg-[#F2EEE7] border border-[#BAB7B1] rounded-2xl p-6 flex flex-col gap-4 shadow-sm hover:border-[#919699] transition-all"
    >
      {/* 16:9 Aspect Ratio Illustration Banner */}
      <div className="relative aspect-[16/9] w-full rounded-xl bg-[#F8F8F8] border border-[#BAB7B1] overflow-hidden flex items-center justify-center group">
        {chapter.illustrationPath ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={chapter.illustrationPath}
              alt={chapter.name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-103"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-4">
              <span className="text-xs font-mono text-white/90">
                {isLocalSVG ? 'SVG Studio Vector' : 'Scene Illustration Completed ✓'}
              </span>
              <div className="flex items-center gap-2">
                {onRegenerateImage && (
                  <button
                    disabled={isRegenerating}
                    onClick={handleRegenerate}
                    className="text-xs font-mono font-bold px-3 py-1 bg-[#FF6B00] hover:bg-[#FFA861] text-white rounded-md backdrop-blur-xs transition-colors flex items-center gap-1.5 shadow"
                  >
                    <ArrowClockwise className={`w-3.5 h-3.5 ${isRegenerating ? 'animate-spin' : ''}`} />
                    {isRegenerating ? 'Generating...' : 'Re-gen AI Scene'}
                  </button>
                )}
                <a
                  href={chapter.illustrationPath}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-semibold px-3 py-1 bg-white/20 hover:bg-white/30 text-white rounded-md backdrop-blur-xs transition-colors"
                >
                  View HD ↗
                </a>
              </div>
            </div>
          </>
        ) : isGenerating || isRegenerating ? (
          <div className="flex flex-col items-center justify-center gap-3 p-6 text-center w-full h-full relative">
            <SkeletonLoader variant="rectangular" className="w-full h-full absolute inset-0" />
            <div className="relative z-10 bg-[#231F20]/80 backdrop-blur-xs px-5 py-2.5 rounded-full flex items-center gap-2.5">
              <div className="w-4 h-4 border-2 border-[#FF6B00] border-t-transparent rounded-full animate-spin" />
              <span className="text-xs font-semibold text-white">
                Rendering 16:9 Scene Illustration...
              </span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 p-8 text-center">
            <div className="w-12 h-12 rounded-full bg-[#E8E2E0] flex items-center justify-center text-[#919699] font-bold text-lg">
              🖼️
            </div>
            <span className="text-xs text-[#919699] font-medium">
              Scene Illustration Pending (Step 5)
            </span>
          </div>
        )}
      </div>

      {/* Chapter Metadata & Prompt */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <h4 className="text-lg font-bold text-[#231F20] tracking-tight">{chapter.name}</h4>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold px-2 py-0.5 bg-[#231F20] text-white rounded uppercase">
              Chapter Scene (Max 1)
            </span>
            {onRegenerateImage && chapter.illustrationPath && (
              <button
                disabled={isRegenerating}
                onClick={handleRegenerate}
                title="Re-generate HD AI Scene"
                className="p-1 text-[#8E8E93] hover:text-[#FF6B00] transition-colors rounded hover:bg-black/5"
              >
                <ArrowClockwise className={`w-3.5 h-3.5 ${isRegenerating ? 'animate-spin' : ''}`} />
              </button>
            )}
          </div>
        </div>

        <p
          className={`text-xs text-[#434343] leading-relaxed ${
            expanded ? '' : 'line-clamp-3'
          }`}
        >
          {chapter.prompt}
        </p>

        {chapter.prompt && chapter.prompt.length > 150 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-[11px] font-semibold text-[#FF6B00] hover:underline mt-1 focus:outline-none"
          >
            {expanded ? 'Collapse Description ▲' : 'Read Full Scene Prompt ▼'}
          </button>
        )}
      </div>
    </motion.div>
  );
}

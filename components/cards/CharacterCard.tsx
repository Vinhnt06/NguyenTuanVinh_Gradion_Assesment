'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import SkeletonLoader from '@/components/ui/SkeletonLoader';

interface CharacterCardProps {
  character: {
    name: string;
    prompt: string;
    imagePath?: string;
  };
  isGenerating?: boolean;
}

export default function CharacterCard({ character, isGenerating }: CharacterCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-[#F2EEE7] border border-[#BAB7B1] rounded-2xl p-5 flex flex-col gap-4 shadow-sm hover:border-[#919699] transition-all"
    >
      {/* Portrait Image Container (3:4 portrait ratio) */}
      <div className="relative aspect-[3/4] w-full rounded-xl bg-[#F8F8F8] border border-[#BAB7B1] overflow-hidden flex items-center justify-center group">
        {character.imagePath ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={character.imagePath}
              alt={character.name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
              <span className="text-[11px] font-mono text-white/90 truncate">
                Portrait Generated ✓
              </span>
            </div>
          </>
        ) : isGenerating ? (
          <div className="flex flex-col items-center gap-3 p-6 text-center w-full">
            <SkeletonLoader variant="rectangular" className="w-full h-full absolute inset-0" />
            <div className="relative z-10 bg-[#231F20]/80 backdrop-blur-xs px-4 py-2 rounded-full flex items-center gap-2">
              <div className="w-3.5 h-3.5 border-2 border-[#FF6B00] border-t-transparent rounded-full animate-spin" />
              <span className="text-xs font-semibold text-white">
                Generating Portrait...
              </span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 p-6 text-center">
            <div className="w-10 h-10 rounded-full bg-[#E8E2E0] flex items-center justify-center text-[#919699] font-bold text-sm">
              👤
            </div>
            <span className="text-xs text-[#919699] font-medium">Portrait Pending (Step 3)</span>
          </div>
        )}
      </div>

      {/* Character Info & Prompt */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <h4 className="text-base font-bold text-[#231F20] tracking-tight">{character.name}</h4>
          <span className="text-[10px] font-bold px-2 py-0.5 bg-[#FF6B00]/10 text-[#FF6B00] rounded uppercase">
            Character
          </span>
        </div>

        <p
          className={`text-xs text-[#434343] leading-relaxed transition-all ${
            expanded ? '' : 'line-clamp-3'
          }`}
        >
          {character.prompt}
        </p>

        {character.prompt && character.prompt.length > 120 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-[11px] font-semibold text-[#FF6B00] hover:underline mt-1 focus:outline-none"
          >
            {expanded ? 'Show Less ▲' : 'Read Full Prompt ▼'}
          </button>
        )}
      </div>
    </motion.div>
  );
}

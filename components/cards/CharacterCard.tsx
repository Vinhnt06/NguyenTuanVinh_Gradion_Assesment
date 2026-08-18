'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowsOut } from '@phosphor-icons/react';
import SkeletonLoader from '@/components/ui/SkeletonLoader';
import ImageLightboxModal from '@/components/ui/ImageLightboxModal';

interface CharacterCardProps {
  character: {
    name: string;
    prompt: string;
    imagePath?: string;
  };
  isGenerating?: boolean;
  onRegenerateImage?: () => void;
}

export default function CharacterCard({
  character,
  isGenerating,
  onRegenerateImage,
}: CharacterCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const handleRegenerate = async () => {
    if (!onRegenerateImage || isRegenerating) return;
    setIsRegenerating(true);
    try {
      await onRegenerateImage();
    } finally {
      setIsRegenerating(false);
    }
  };

  const isLocalSVG = character.imagePath?.endsWith('.svg');

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-[#F2EEE7] border border-[#BAB7B1] rounded-2xl p-5 flex flex-col gap-4 shadow-xs hover:border-[#919699] transition-all"
      >
        {/* Portrait Image Container (3:4 portrait ratio) */}
        <div
          onClick={() => character.imagePath && setLightboxOpen(true)}
          className={`relative aspect-[3/4] w-full rounded-xl bg-[#F8F8F8] border border-[#BAB7B1] overflow-hidden flex items-center justify-center group ${
            character.imagePath ? 'cursor-pointer' : ''
          }`}
        >
          {character.imagePath ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={character.imagePath}
                alt={character.name}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-3">
                <span className="text-[11px] font-mono text-white/90 truncate flex items-center gap-1.5">
                  <ArrowsOut weight="bold" className="w-3.5 h-3.5 text-[#FF6B00]" />
                  Click to View Lightbox
                </span>

                {onRegenerateImage && (
                  <button
                    disabled={isRegenerating}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRegenerate();
                    }}
                    className="text-[10px] font-mono font-bold px-2.5 py-1 bg-[#FF6B00] hover:bg-[#FFA861] text-white rounded shadow-xs transition-colors shrink-0"
                  >
                    {isRegenerating ? 'Generating...' : 'Re-gen'}
                  </button>
                )}
              </div>
            </>
          ) : isGenerating || isRegenerating ? (
            <div className="flex flex-col items-center gap-3 p-6 text-center w-full">
              <SkeletonLoader variant="rectangular" className="w-full h-full absolute inset-0" />
              <div className="relative z-10 bg-[#231F20]/80 backdrop-blur-xs px-4 py-2 rounded-full flex items-center gap-2">
                <div className="w-3.5 h-3.5 border-2 border-[#FF6B00] border-t-transparent rounded-full animate-spin" />
                <span className="text-xs font-semibold text-white">
                  Generating AI Picture...
                </span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1.5 p-6 text-center">
              <span className="text-xs font-mono font-bold text-[#8E8E93] uppercase tracking-wider">
                PORTRAIT PENDING
              </span>
              <span className="text-[11px] text-[#919699]">Run Step 3 to Generate</span>
            </div>
          )}
        </div>

        {/* Character Info & Prompt */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <h4 className="text-base font-bold text-[#231F20] tracking-tight">{character.name}</h4>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold px-2 py-0.5 bg-[#FF6B00]/10 text-[#FF6B00] rounded uppercase">
                Character
              </span>
              {onRegenerateImage && character.imagePath && (
                <button
                  disabled={isRegenerating}
                  onClick={handleRegenerate}
                  title="Re-generate HD AI Picture"
                  className="text-[11px] font-mono font-bold text-[#8E8E93] hover:text-[#FF6B00] transition-colors"
                >
                  {isRegenerating ? '...' : 'Re-gen'}
                </button>
              )}
            </div>
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
              {expanded ? 'Show Less' : 'Read Full Prompt'}
            </button>
          )}
        </div>
      </motion.div>

      {/* Lightbox Modal */}
      {character.imagePath && (
        <ImageLightboxModal
          isOpen={lightboxOpen}
          onClose={() => setLightboxOpen(false)}
          title={character.name}
          typeLabel="Character Portrait"
          prompt={character.prompt}
          imagePath={character.imagePath}
          onRegenerate={onRegenerateImage ? handleRegenerate : undefined}
          isRegenerating={isRegenerating}
        />
      )}
    </>
  );
}

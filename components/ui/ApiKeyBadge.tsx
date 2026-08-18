'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import ApiKeyModal from './ApiKeyModal';

export default function ApiKeyBadge() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [status, setStatus] = useState<{
    isConfigured: boolean;
    source: string;
    maskedKey: string;
  } | null>(null);

  const checkKeyStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/settings/key');
      const data = await res.json();
      setStatus(data);
    } catch (err) {
      // Ignore network errors
    }
  }, []);

  useEffect(() => {
    checkKeyStatus();
  }, [checkKeyStatus]);

  if (!status) return null;

  return (
    <>
      <motion.button
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.96 }}
        onClick={() => setIsModalOpen(true)}
        className={`px-3 py-1.5 rounded-full border font-mono text-xs font-bold transition-all flex items-center gap-2 shadow-xs cursor-pointer ${
          status.isConfigured
            ? 'bg-emerald-950/40 border-emerald-600/50 text-emerald-400 hover:bg-emerald-900/50'
            : 'bg-amber-950/60 border-amber-500/80 text-amber-300 hover:bg-amber-900/70 animate-pulse'
        }`}
      >
        <span
          className={`w-2 h-2 rounded-full ${
            status.isConfigured ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400 animate-ping'
          }`}
        />
        <span>
          {status.isConfigured
            ? `Gemini API Active ${status.maskedKey ? `(${status.maskedKey})` : ''}`
            : '⚠️ API Key Required — Click to Configure'}
        </span>
      </motion.button>

      <ApiKeyModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onKeySaved={checkKeyStatus}
      />
    </>
  );
}

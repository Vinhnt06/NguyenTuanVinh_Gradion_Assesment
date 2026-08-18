'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import AnimatedButton from '@/components/ui/AnimatedButton';
import { useToast } from '@/components/ui/Toast';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onKeySaved?: () => void;
}

export default function ApiKeyModal({ isOpen, onClose, onKeySaved }: ApiKeyModalProps) {
  const { showToast } = useToast();
  const [mounted, setMounted] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{
    isConfigured: boolean;
    source: string;
    maskedKey: string;
  } | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch current status when modal opens
  useEffect(() => {
    if (isOpen) {
      setError('');
      fetch('/api/settings/key')
        .then((res) => res.json())
        .then((data) => setStatus(data))
        .catch(() => {});
    }
  }, [isOpen]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey.trim()) {
      setError('Please paste your Gemini API Key first');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/settings/key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: apiKey.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to validate API Key');
      }

      showToast('API Key Connected! ✓', 'Validated live with Google Gemini API', 'success');
      setStatus({ isConfigured: true, source: 'ui_session', maskedKey: data.maskedKey });
      setApiKey('');
      if (onKeySaved) onKeySaved();
      onClose();
    } catch (err: any) {
      setError(err.message);
      showToast('Connection Error', err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = async () => {
    setLoading(true);
    try {
      await fetch('/api/settings/key', { method: 'DELETE' });
      showToast('Custom Key Cleared', 'Reverted to server environment key', 'info');
      setStatus(null);
      setApiKey('');
      if (onKeySaved) onKeySaved();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !mounted) return null;

  return createPortal(
    <AnimatePresence>
      {/* Root fixed container attached to document.body spanning full viewport */}
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        {/* Backdrop spanning entire window */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/80 backdrop-blur-md"
        />

        {/* Modal Card - dead-centered in full window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="relative my-auto w-full max-w-lg bg-[#141416] border border-[#33333E] rounded-3xl p-6 lg:p-8 shadow-2xl text-left text-white overflow-hidden z-10"
        >
          {/* Ambient Glow */}
          <div className="absolute -top-16 -right-16 w-48 h-48 bg-[#FF6B00]/15 rounded-full blur-3xl pointer-events-none" />

          {/* Modal Header */}
          <div className="flex items-center justify-between border-b border-[#2D2D38] pb-4 mb-5">
            <div>
              <span className="text-[10px] font-mono font-bold text-[#FF6B00] uppercase tracking-widest block">
                EVALUATOR SETUP · GEMINI API KEY
              </span>
              <h3 className="text-xl font-extrabold tracking-tight">Connect Google Gemini API</h3>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-[#23232C] hover:bg-[#33333E] text-[#919699] hover:text-white flex items-center justify-center font-bold text-sm transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Current Key Status Badge */}
          {status && (
            <div className="mb-5 p-3.5 bg-[#1C1C24] border border-[#2D2D38] rounded-xl flex items-center justify-between text-xs font-mono">
              <div className="flex items-center gap-2">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    status.isConfigured ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500 animate-ping'
                  }`}
                />
                <span className="font-bold text-white">
                  {status.isConfigured ? 'API Key Connected' : 'No API Key Configured'}
                </span>
                {status.maskedKey && (
                  <span className="text-[#919699] font-normal">({status.maskedKey})</span>
                )}
              </div>
              {status.source === 'ui_session' && (
                <button
                  onClick={handleClear}
                  disabled={loading}
                  className="text-[11px] text-red-400 hover:underline font-semibold"
                >
                  Clear Custom Key
                </button>
              )}
            </div>
          )}

          {/* Direct 1-Click Link to Google AI Studio */}
          <div className="mb-5 p-4 bg-[#FF6B00]/10 border border-[#FF6B00]/30 rounded-2xl text-xs space-y-2">
            <div className="font-bold text-[#FFA861] uppercase tracking-wider text-[10px]">
              QUICK API KEY ACQUISITION
            </div>
            <p className="text-white/90 leading-relaxed">
              Don’t have a Gemini API key? You can get a free key instantly from Google AI Studio without credit card:
            </p>
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 font-bold text-[#FF6B00] hover:text-[#FFA861] underline text-xs pt-1"
            >
              Get Free Gemini API Key on Google AI Studio ↗
            </a>
          </div>

          {/* Form */}
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#919699] uppercase tracking-wider mb-2">
                Paste Your Gemini API Key
              </label>
              <div className="relative">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="AIzaSy..."
                  className="w-full bg-[#1C1C24] border border-[#33333E] focus:border-[#FF6B00] text-white placeholder-[#595959] rounded-xl px-4 py-3 text-xs font-mono outline-none transition-colors pr-16"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-mono font-bold text-[#919699] hover:text-white px-2 py-1 bg-[#282834] rounded"
                >
                  {showKey ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-950/60 border border-red-800 text-red-300 rounded-xl text-xs font-medium leading-relaxed">
                {error}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-[#8E8E93] hover:text-white transition-colors"
              >
                Cancel
              </button>
              <AnimatedButton variant="primary" loading={loading} type="submit">
                Validate &amp; Save API Key →
              </AnimatedButton>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}

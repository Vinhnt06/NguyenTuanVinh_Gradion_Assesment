'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { SignOut, WarningCircle } from '@phosphor-icons/react';

interface SignOutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading?: boolean;
}

export default function SignOutModal({
  isOpen,
  onClose,
  onConfirm,
  loading = false,
}: SignOutModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !loading) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, loading, onClose]);

  if (!mounted || typeof document === 'undefined') return null;

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          {/* Backdrop Blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={!loading ? onClose : undefined}
            className="fixed inset-0 bg-[#0D0D10]/60 backdrop-blur-sm"
          />

          {/* Modal Box */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="relative w-full max-w-sm bg-[#F2EEE7] border border-[#BAB7B1] rounded-2xl p-6 shadow-2xl z-10 text-[#231F20]"
          >
            {/* Warning Icon Badge */}
            <div className="w-12 h-12 rounded-2xl bg-[#FF6B00]/10 border border-[#FF6B00]/20 flex items-center justify-center text-[#FF6B00] mb-4 mx-auto">
              <SignOut weight="bold" className="w-6 h-6" />
            </div>

            <div className="text-center mb-6">
              <h3 className="text-xl font-extrabold tracking-tight text-[#231F20] mb-2">
                Sign Out Confirmation
              </h3>
              <p className="text-xs text-[#595959] leading-relaxed">
                Are you sure you want to sign out of your studio workspace? All your projects and generated artwork remain safely saved on disk.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="flex-1 px-4 py-2.5 bg-white border border-[#BAB7B1] text-[#231F20] text-xs font-bold rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onConfirm}
                disabled={loading}
                className="flex-1 px-4 py-2.5 bg-[#FF6B00] text-white text-xs font-bold rounded-xl hover:bg-[#FFA861] transition-colors shadow-xs flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {loading ? (
                  <span>Signing out...</span>
                ) : (
                  <>
                    <span>Yes, Sign Out</span>
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
}

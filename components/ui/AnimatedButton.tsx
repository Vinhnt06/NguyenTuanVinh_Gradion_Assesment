'use client';

import { motion, HTMLMotionProps } from 'framer-motion';
import React from 'react';

interface AnimatedButtonProps extends HTMLMotionProps<'button'> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'amber';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  children: React.ReactNode;
}

export default function AnimatedButton({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  children,
  className = '',
  ...props
}: AnimatedButtonProps) {
  const baseClasses =
    'font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-[#FF6B00] focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none cursor-pointer';

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-5 py-2.5 text-sm',
    lg: 'px-6 py-3.5 text-base',
  };

  const variantClasses = {
    primary: 'bg-[#FF6B00] hover:bg-[#E85F00] text-white shadow-sm',
    secondary: 'bg-[#231F20] hover:bg-[#1D1C1D] text-white shadow-sm',
    ghost: 'bg-transparent hover:bg-[#E8E2E0] text-[#434343] border border-[#BAB7B1]',
    danger: 'bg-red-600 hover:bg-red-700 text-white shadow-sm',
    amber: 'bg-amber-600 hover:bg-amber-700 text-white shadow-sm',
  };

  return (
    <motion.button
      whileHover={{ scale: disabled || loading ? 1 : 1.02 }}
      whileTap={{ scale: disabled || loading ? 1 : 0.97 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      disabled={disabled || loading}
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {loading && (
        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin shrink-0" />
      )}
      {children}
    </motion.button>
  );
}

'use client';

interface SkeletonLoaderProps {
  className?: string;
  variant?: 'rectangular' | 'circular' | 'text';
  width?: string | number;
  height?: string | number;
}

export default function SkeletonLoader({
  className = '',
  variant = 'rectangular',
  width,
  height,
}: SkeletonLoaderProps) {
  const baseClasses =
    'animate-pulse bg-[#E8E2E0] relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.5s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/40 before:to-transparent';

  let roundedClass = 'rounded-lg';
  if (variant === 'circular') roundedClass = 'rounded-full';
  if (variant === 'text') roundedClass = 'rounded h-4 my-1';

  const style: React.CSSProperties = {
    width: width !== undefined ? width : undefined,
    height: height !== undefined ? height : undefined,
  };

  return (
    <div
      className={`${baseClasses} ${roundedClass} ${className}`}
      style={style}
      aria-label="Loading..."
    />
  );
}

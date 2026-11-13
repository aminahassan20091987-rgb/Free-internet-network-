import React, { useState } from 'react';

interface LogoImageProps {
  src: string;
  alt: string;
  fallbackText: string;
  className?: string;
}

export const LogoImage: React.FC<LogoImageProps> = ({
  src,
  alt,
  fallbackText,
  className = 'h-8 w-12 rounded-lg object-cover',
}) => {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <span
        aria-label={alt}
        className={`inline-flex items-center justify-center bg-slate-200 font-mono text-[10px] font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200 ${className}`}
      >
        {fallbackText}
      </span>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      loading="lazy"
      onError={() => setFailed(true)}
      className={className}
    />
  );
};

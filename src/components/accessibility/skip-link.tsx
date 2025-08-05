'use client';

import { useEffect, useRef } from 'react';
import { useAccessibility } from '@/hooks/use-accessibility';

interface SkipLinkProps {
  targetId?: string;
  children?: React.ReactNode;
  className?: string;
}

export function SkipLink({ 
  targetId = 'main-content', 
  children = 'Skip to main content',
  className = ''
}: SkipLinkProps) {
  const linkRef = useRef<HTMLAnchorElement>(null);
  const { focusManager } = useAccessibility();

  useEffect(() => {
    const link = linkRef.current;
    if (!link) return;

    const handleClick = (e: MouseEvent) => {
      e.preventDefault();
      
      const target = document.getElementById(targetId);
      if (target) {
        target.focus();
        target.scrollIntoView({ behavior: 'smooth' });
      } else {
        // Fallback to main content
        focusManager.skipToContent();
      }
    };

    link.addEventListener('click', handleClick);
    return () => link.removeEventListener('click', handleClick);
  }, [targetId, focusManager]);

  return (
    <a
      ref={linkRef}
      href={`#${targetId}`}
      className={`
        fixed top-4 left-4 z-50 px-4 py-2 
        bg-blue-600 text-white font-medium text-sm
        rounded-md shadow-lg
        transform -translate-y-full
        focus:translate-y-0 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        transition-transform duration-200 ease-in-out
        ${className}
      `}
      tabIndex={0}
    >
      {children}
    </a>
  );
}

// Skip links for different sections
export function SkipLinks() {
  return (
    <div className="sr-only focus:not-sr-only">
      <SkipLink targetId="main-content">
        Skip to main content
      </SkipLink>
      <SkipLink targetId="navigation" className="top-16">
        Skip to navigation
      </SkipLink>
      <SkipLink targetId="footer" className="top-28">
        Skip to footer
      </SkipLink>
    </div>
  );
}

export default SkipLink; 
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

export function useSafeRouter() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Return a safe router object that only works when mounted
  return {
    ...router,
    push: (href: string) => {
      if (mounted) {
        router.push(href);
      }
    },
    replace: (href: string) => {
      if (mounted) {
        router.replace(href);
      }
    },
    back: () => {
      if (mounted) {
        router.back();
      }
    },
    forward: () => {
      if (mounted) {
        router.forward();
      }
    },
    refresh: () => {
      if (mounted) {
        router.refresh();
      }
    },
    mounted
  };
} 
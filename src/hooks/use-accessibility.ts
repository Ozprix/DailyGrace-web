import { useEffect, useRef, useCallback, useState } from 'react';

// Accessibility features interface
interface AccessibilityFeatures {
  highContrast: boolean;
  largeText: boolean;
  reducedMotion: boolean;
  screenReader: boolean;
  keyboardOnly: boolean;
}

// Focus management interface
interface FocusManager {
  trapFocus: (containerRef: React.RefObject<HTMLElement>) => void;
  releaseFocus: () => void;
  focusFirstElement: (containerRef: React.RefObject<HTMLElement>) => void;
  focusLastElement: (containerRef: React.RefObject<HTMLElement>) => void;
  skipToContent: () => void;
}

// Keyboard navigation interface
interface KeyboardNavigation {
  handleKeyDown: (event: KeyboardEvent) => void;
  handleArrowKeys: (event: KeyboardEvent) => void;
  handleEscape: (event: KeyboardEvent) => void;
  handleEnter: (event: KeyboardEvent) => void;
  handleSpace: (event: KeyboardEvent) => void;
}

// Screen reader interface
interface ScreenReader {
  announce: (message: string, priority?: 'polite' | 'assertive') => void;
  announcePageTitle: (title: string) => void;
  announceLoading: (isLoading: boolean) => void;
  announceError: (error: string) => void;
  announceSuccess: (message: string) => void;
}

export function useAccessibility() {
  const [features, setFeatures] = useState<AccessibilityFeatures>({
    highContrast: false,
    largeText: false,
    reducedMotion: false,
    screenReader: false,
    keyboardOnly: false,
  });

  const [isKeyboardUser, setIsKeyboardUser] = useState(false);
  const [currentFocus, setCurrentFocus] = useState<HTMLElement | null>(null);
  const focusHistory = useRef<HTMLElement[]>([]);
  const skipLinkRef = useRef<HTMLAnchorElement>(null);

  // Detect accessibility features
  useEffect(() => {
    const detectAccessibilityFeatures = () => {
      const mediaQueries = {
        highContrast: window.matchMedia('(prefers-contrast: high)'),
        reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)'),
        largeText: window.matchMedia('(prefers-reduced-motion: reduce)'), // Simplified detection
      };

      const updateFeatures = () => {
        setFeatures(prev => ({
          ...prev,
          highContrast: mediaQueries.highContrast.matches,
          reducedMotion: mediaQueries.reducedMotion.matches,
          largeText: document.documentElement.style.fontSize === 'large' || 
                    window.getComputedStyle(document.body).fontSize > '16px',
        }));
      };

      // Initial detection
      updateFeatures();

      // Listen for changes
      mediaQueries.highContrast.addEventListener('change', updateFeatures);
      mediaQueries.reducedMotion.addEventListener('change', updateFeatures);

      // Detect screen reader
      const detectScreenReader = () => {
        const isScreenReader = 
          'speechSynthesis' in window ||
          'webkitSpeechSynthesis' in window ||
          navigator.userAgent.includes('NVDA') ||
          navigator.userAgent.includes('JAWS') ||
          navigator.userAgent.includes('VoiceOver');
        
        setFeatures(prev => ({ ...prev, screenReader: isScreenReader }));
      };

      detectScreenReader();

      return () => {
        mediaQueries.highContrast.removeEventListener('change', updateFeatures);
        mediaQueries.reducedMotion.removeEventListener('change', updateFeatures);
      };
    };

    detectAccessibilityFeatures();
  }, []);

  // Detect keyboard usage
  useEffect(() => {
    const handleKeyDown = () => {
      setIsKeyboardUser(true);
      // Reset after mouse usage
      setTimeout(() => setIsKeyboardUser(false), 1000);
    };

    const handleMouseDown = () => {
      setIsKeyboardUser(false);
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleMouseDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, []);

  // Focus management
  const focusManager: FocusManager = {
    trapFocus: useCallback((containerRef: React.RefObject<HTMLElement>) => {
      const container = containerRef.current;
      if (!container) return;

      const focusableElements = container.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );

      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

      const handleTabKey = (e: KeyboardEvent) => {
        if (e.key === 'Tab') {
          if (e.shiftKey) {
            if (document.activeElement === firstElement) {
              e.preventDefault();
              lastElement.focus();
            }
          } else {
            if (document.activeElement === lastElement) {
              e.preventDefault();
              firstElement.focus();
            }
          }
        }
      };

      document.addEventListener('keydown', handleTabKey);
      firstElement?.focus();

      return () => {
        document.removeEventListener('keydown', handleTabKey);
      };
    }, []),

    releaseFocus: useCallback(() => {
      // Restore focus to the last focused element
      const lastFocused = focusHistory.current[focusHistory.current.length - 1];
      if (lastFocused) {
        lastFocused.focus();
        focusHistory.current.pop();
      }
    }, []),

    focusFirstElement: useCallback((containerRef: React.RefObject<HTMLElement>) => {
      const container = containerRef.current;
      if (!container) return;

      const focusableElements = container.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );

      const firstElement = focusableElements[0] as HTMLElement;
      if (firstElement) {
        firstElement.focus();
      }
    }, []),

    focusLastElement: useCallback((containerRef: React.RefObject<HTMLElement>) => {
      const container = containerRef.current;
      if (!container) return;

      const focusableElements = container.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );

      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
      if (lastElement) {
        lastElement.focus();
      }
    }, []),

    skipToContent: useCallback(() => {
      const mainContent = document.querySelector('main');
      if (mainContent) {
        (mainContent as HTMLElement).focus();
        (mainContent as HTMLElement).setAttribute('tabindex', '-1');
      }
    }, []),
  };

  // Keyboard navigation
  const keyboardNavigation: KeyboardNavigation = {
    handleKeyDown: useCallback((event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      
      // Track focus history
      if (target !== currentFocus) {
        if (currentFocus) {
          focusHistory.current.push(currentFocus);
        }
        setCurrentFocus(target);
      }

      // Handle different key combinations
      switch (event.key) {
        case 'ArrowUp':
        case 'ArrowDown':
        case 'ArrowLeft':
        case 'ArrowRight':
          keyboardNavigation.handleArrowKeys(event);
          break;
        case 'Escape':
          keyboardNavigation.handleEscape(event);
          break;
        case 'Enter':
          keyboardNavigation.handleEnter(event);
          break;
        case ' ':
          keyboardNavigation.handleSpace(event);
          break;
      }
    }, [currentFocus]),

    handleArrowKeys: useCallback((event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      
      // Handle arrow key navigation for custom components
      if (target.getAttribute('role') === 'button' || target.tagName === 'BUTTON') {
        // Find next/previous focusable element based on arrow direction
        const focusableElements = Array.from(
          document.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')
        ) as HTMLElement[];

        const currentIndex = focusableElements.indexOf(target);
        let nextIndex = currentIndex;

        switch (event.key) {
          case 'ArrowRight':
          case 'ArrowDown':
            nextIndex = (currentIndex + 1) % focusableElements.length;
            break;
          case 'ArrowLeft':
          case 'ArrowUp':
            nextIndex = currentIndex === 0 ? focusableElements.length - 1 : currentIndex - 1;
            break;
        }

        if (nextIndex !== currentIndex) {
          event.preventDefault();
          focusableElements[nextIndex].focus();
        }
      }
    }, []),

    handleEscape: useCallback((event: KeyboardEvent) => {
      // Close modals, dropdowns, etc.
      const modals = document.querySelectorAll('[role="dialog"], [role="alertdialog"]');
      const dropdowns = document.querySelectorAll('[aria-expanded="true"]');
      
      if (modals.length > 0) {
        const lastModal = modals[modals.length - 1] as HTMLElement;
        const closeButton = lastModal.querySelector('[aria-label*="close"], [aria-label*="Close"]') as HTMLElement;
        if (closeButton) {
          event.preventDefault();
          closeButton.click();
        }
      } else if (dropdowns.length > 0) {
        const lastDropdown = dropdowns[dropdowns.length - 1] as HTMLElement;
        event.preventDefault();
        lastDropdown.setAttribute('aria-expanded', 'false');
      }
    }, []),

    handleEnter: useCallback((event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      
      // Activate buttons and links
      if (target.getAttribute('role') === 'button' || target.tagName === 'BUTTON') {
        event.preventDefault();
        target.click();
      }
    }, []),

    handleSpace: useCallback((event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      
      // Prevent page scroll and activate buttons
      if (target.getAttribute('role') === 'button' || target.tagName === 'BUTTON') {
        event.preventDefault();
        target.click();
      }
    }, []),
  };

  // Screen reader support
  const screenReader: ScreenReader = {
    announce: useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(message);
        speechSynthesis.speak(utterance);
      }

      // Also use aria-live regions
      const liveRegion = document.getElementById('aria-live-region') || createLiveRegion();
      liveRegion.setAttribute('aria-live', priority);
      liveRegion.textContent = message;
      
      // Clear after announcement
      setTimeout(() => {
        liveRegion.textContent = '';
      }, 1000);
    }, []),

    announcePageTitle: useCallback((title: string) => {
      document.title = title;
      screenReader.announce(`Page loaded: ${title}`, 'assertive');
    }, []),

    announceLoading: useCallback((isLoading: boolean) => {
      if (isLoading) {
        screenReader.announce('Loading content', 'polite');
      } else {
        screenReader.announce('Content loaded', 'polite');
      }
    }, []),

    announceError: useCallback((error: string) => {
      screenReader.announce(`Error: ${error}`, 'assertive');
    }, []),

    announceSuccess: useCallback((message: string) => {
      screenReader.announce(`Success: ${message}`, 'polite');
    }, []),
  };

  // Create aria-live region for announcements
  const createLiveRegion = () => {
    const liveRegion = document.createElement('div');
    liveRegion.id = 'aria-live-region';
    liveRegion.setAttribute('aria-live', 'polite');
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.style.position = 'absolute';
    liveRegion.style.left = '-10000px';
    liveRegion.style.width = '1px';
    liveRegion.style.height = '1px';
    liveRegion.style.overflow = 'hidden';
    document.body.appendChild(liveRegion);
    return liveRegion;
  };

  // Apply accessibility features to document
  useEffect(() => {
    const root = document.documentElement;
    
    // Apply high contrast
    if (features.highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }

    // Apply large text
    if (features.largeText) {
      root.classList.add('large-text');
    } else {
      root.classList.remove('large-text');
    }

    // Apply reduced motion
    if (features.reducedMotion) {
      root.classList.add('reduced-motion');
    } else {
      root.classList.remove('reduced-motion');
    }

    // Apply keyboard-only styles
    if (isKeyboardUser) {
      root.classList.add('keyboard-user');
    } else {
      root.classList.remove('keyboard-user');
    }
  }, [features, isKeyboardUser]);

  // Global keyboard event listener
  useEffect(() => {
    const handleGlobalKeyDown = (event: KeyboardEvent) => {
      keyboardNavigation.handleKeyDown(event);
    };

    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => {
      document.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, [keyboardNavigation]);

  return {
    features,
    isKeyboardUser,
    currentFocus,
    focusManager,
    keyboardNavigation,
    screenReader,
    skipLinkRef,
  };
}

export default useAccessibility; 
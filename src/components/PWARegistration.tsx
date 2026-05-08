'use client';

import { useEffect } from 'react';

/**
 * PWA Registration Component
 * Handles service worker registration and update prompts
 */
export default function PWARegistration() {
  useEffect(() => {
    // Only register service worker in production
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      // Wait for page to fully load
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((registration) => {
            console.log('SW registered:', registration.scope);

            // Check for updates
            registration.addEventListener('updatefound', () => {
              const newWorker = registration.installing;
              if (newWorker) {
                newWorker.addEventListener('statechange', () => {
                  if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    // New content available, prompt user to refresh
                    console.log('New content available, please refresh.');
                    
                    // Dispatch custom event for UI to show refresh prompt
                    window.dispatchEvent(new CustomEvent('sw-update-available'));
                  }
                });
              }
            });
          })
          .catch((error) => {
            console.log('SW registration failed:', error);
          });
      });

      // Handle offline event
      window.addEventListener('offline', () => {
        console.log('App is offline');
        window.dispatchEvent(new CustomEvent('sw-offline'));
      });

      window.addEventListener('online', () => {
        console.log('App is online');
        window.dispatchEvent(new CustomEvent('sw-online'));
      });
    }
  }, []);

  return null;
}

/**
 * Hook to trigger service worker skipWaiting and force reload
 */
export function usePWAUpdate() {
  const triggerUpdate = () => {
    navigator.serviceWorker.ready.then((registration) => {
      if (registration.waiting) {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        window.location.reload();
      }
    });
  };

  return { triggerUpdate };
}

/**
 * Hook to check online status
 */
export function useOnlineStatus() {
  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
  return isOnline;
}
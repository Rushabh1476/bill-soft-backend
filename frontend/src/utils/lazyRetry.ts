import React from 'react';

/**
 * Enhanced React.lazy with retry logic for "ChunkLoadError".
 * This happens when a new version is deployed and the old JS chunks are gone.
 *
 * IMPORTANT: The retry MUST call componentImport() directly — not lazyWithRetry()
 * recursively — because React.lazy's factory must return { default: Component },
 * NOT another LazyExoticComponent (which would resolve to undefined).
 */
export function lazyWithRetry<T extends React.ComponentType<any>>(
  componentImport: () => Promise<{ default: T }>,
  retriesLeft = 2,
  interval = 1500
): React.LazyExoticComponent<T> {
  return React.lazy(async () => {
    let lastError: unknown;
    for (let attempt = 0; attempt <= retriesLeft; attempt++) {
      try {
        return await componentImport();
      } catch (error) {
        lastError = error;
        if (attempt < retriesLeft) {
          await new Promise((resolve) => setTimeout(resolve, interval));
        }
      }
    }
    throw lastError;
  });
}

/** In-flight board writes; navbar waits briefly before navigating. */

const pending = new Set<Promise<unknown>>();

/** Track a save/insert/delete so flushPendingSaves can wait on it. */
export function trackSave<T>(p: Promise<T>): Promise<T> {
  pending.add(p);
  const clear = () => {
    pending.delete(p);
  };
  p.then(clear, clear);
  return p;
}

/** Wait for in-flight saves, or `timeoutMs`, whichever comes first. */
export function flushPendingSaves(timeoutMs = 1000): Promise<void> {
  if (pending.size === 0) return Promise.resolve();
  return Promise.race([
    Promise.allSettled([...pending]).then(() => undefined),
    new Promise<void>((resolve) => {
      setTimeout(resolve, timeoutMs);
    }),
  ]);
}

export function hasPendingSaves(): boolean {
  return pending.size > 0;
}

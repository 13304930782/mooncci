import { useEffect } from 'react';

const clamp = (value: number, min: number, max: number) => {
  return Math.min(Math.max(value, min), max);
};

const shouldIgnoreWheel = (event: WheelEvent) => {
  if (event.ctrlKey || event.metaKey) return true;
  if (window.location.pathname.startsWith('/admin')) return true;

  const target = event.target as HTMLElement | null;
  if (!target) return false;

  const tag = target.tagName?.toLowerCase();

  if (['input', 'textarea', 'select', 'option'].includes(tag)) return true;
  if (target.isContentEditable) return true;
  if (target.closest('[data-no-inertial-scroll]')) return true;
  if (target.closest('[data-native-scroll]')) return true;
  if (target.closest('textarea, input, select, [contenteditable="true"]')) return true;

  return false;
};

export function useInertialScroll() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const coarsePointer = window.matchMedia('(pointer: coarse)').matches;

    if (reduceMotion || coarsePointer) return;

    let currentY = window.scrollY;
    let targetY = window.scrollY;
    let rafId = 0;
    let isAnimating = false;

    const maxScroll = () => Math.max(document.documentElement.scrollHeight - window.innerHeight, 0);

    const animate = () => {
      const distance = targetY - currentY;
      currentY += distance * 0.14;

      if (Math.abs(distance) < 0.45) {
        currentY = targetY;
        window.scrollTo(0, currentY);
        isAnimating = false;
        rafId = 0;
        return;
      }

      window.scrollTo(0, currentY);
      rafId = window.requestAnimationFrame(animate);
    };

    const startAnimation = () => {
      if (isAnimating) return;
      isAnimating = true;
      rafId = window.requestAnimationFrame(animate);
    };

    const onWheel = (event: WheelEvent) => {
      if (shouldIgnoreWheel(event)) return;

      event.preventDefault();

      const multiplier = event.deltaMode === 1 ? 34 : 1;
      targetY = clamp(targetY + event.deltaY * multiplier * 0.86, 0, maxScroll());
      startAnimation();
    };

    const syncNativeScroll = () => {
      if (!isAnimating) {
        currentY = window.scrollY;
        targetY = window.scrollY;
      }
    };

    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('scroll', syncNativeScroll, { passive: true });

    return () => {
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('scroll', syncNativeScroll);

      if (rafId) {
        window.cancelAnimationFrame(rafId);
      }
    };
  }, []);
}

import { useEffect, useState } from 'react';

// Per dotaitooldesign.md §6.2: parallax is capped at 8 px and never required
// to understand or use the interface. All hooks below honour
// `prefers-reduced-motion`.

function getReducedMotion() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function useReducedMotion() {
  const [reduced, setReduced] = useState(getReducedMotion);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(mq.matches);
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);
  return reduced;
}

export function useScrollY() {
  const reduced = useReducedMotion();
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const main = document.querySelector('main');
      const top = (main && main.scrollTop) || window.scrollY || 0;
      setScrollY(top);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    const main = document.querySelector('main');
    if (main) main.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (main) main.removeEventListener('scroll', onScroll);
    };
  }, []);

  return reduced ? 0 : scrollY;
}

export function usePointerOffset(intensity = 8) {
  const reduced = useReducedMotion();
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (reduced) return undefined;

    const handle = (event) => {
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      const dx = ((event.clientX - cx) / cx) * intensity;
      const dy = ((event.clientY - cy) / cy) * intensity;
      // Cap per §6.2.
      const capped = {
        x: Math.max(-intensity, Math.min(intensity, dx)),
        y: Math.max(-intensity, Math.min(intensity, dy)),
      };
      setOffset(capped);
    };

    window.addEventListener('pointermove', handle, { passive: true });
    return () => window.removeEventListener('pointermove', handle);
  }, [intensity, reduced]);

  return reduced ? { x: 0, y: 0 } : offset;
}

// Per-element pointer offset for hover parallax on cards. Reads the cursor
// position relative to the element and returns a centred offset capped at
// `intensity` pixels in either direction.
export function useHoverParallax(intensity = 4) {
  const reduced = useReducedMotion();
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (reduced) return undefined;

    const handleMove = (event) => {
      const target = event.currentTarget;
      const rect = target.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = ((event.clientX - cx) / (rect.width / 2)) * intensity;
      const dy = ((event.clientY - cy) / (rect.height / 2)) * intensity;
      setOffset({
        x: Math.max(-intensity, Math.min(intensity, dx)),
        y: Math.max(-intensity, Math.min(intensity, dy)),
      });
    };

    const reset = () => setOffset({ x: 0, y: 0 });

    const el = document;
    el.addEventListener('mousemove', handleMove);
    el.addEventListener('mouseleave', reset);
    return () => {
      el.removeEventListener('mousemove', handleMove);
      el.removeEventListener('mouseleave', reset);
    };
  }, [intensity, reduced]);

  return reduced ? { x: 0, y: 0 } : offset;
}

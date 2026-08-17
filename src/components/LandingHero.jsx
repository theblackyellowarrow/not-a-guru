import { useEffect, useState } from 'react';
import ParticleAccelerator from './ParticleAccelerator';
import EnterButton from './EnterButton';
import GeometricBackdrop from './GeometricBackdrop';

export default function LandingHero({ onEnter, reducedMotion = false }) {
  const [entered, setEntered] = useState(false);
  const [phase, setPhase] = useState('hero'); // hero | collapsing | done

  useEffect(() => {
    if (entered && phase === 'collapsing') {
      const timer = window.setTimeout(() => setPhase('done'), 720);
      return () => window.clearTimeout(timer);
    }
    return undefined;
  }, [entered, phase]);

  function handleEnter() {
    if (entered) return;
    setEntered(true);
    setPhase('collapsing');
    if (typeof onEnter === 'function') onEnter();
  }

  if (phase === 'done') return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#090909]">
      <GeometricBackdrop />

      <div
        className={`relative z-10 flex flex-col items-center gap-8 transition-all duration-700 ease-out ${
          phase === 'collapsing' ? 'scale-50 opacity-0' : 'scale-100 opacity-100'
        }`}
      >
        <ParticleAccelerator
          size={420}
          paused={reducedMotion}
          className="drop-shadow-[0_0_60px_rgba(0,241,222,0.18)]"
        />

        <EnterButton onClick={handleEnter} size="lg" />
      </div>

      <p className="relative z-10 mt-10 font-mono uppercase text-[10px] tracking-[0.32em] text-[#9A968D]">
        Not a Guru · {entered ? 'opening…' : 'click enter to begin'}
      </p>
    </div>
  );
}

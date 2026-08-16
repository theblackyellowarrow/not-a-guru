import { Check, Flag } from 'lucide-react';
import { getFlowStages } from '../chatRuntime';

export default function QuestTracker({ stage, flow = 'start_project' }) {
  const stages = getFlowStages(flow);
  if (!stages.length) return null;

  const questClear = stage >= stages.length - 1;

  return (
    <div className="select-none border border-[#00F1DE]/40 bg-[#0f0f0f] p-3">
      <div className="flex items-center justify-center">
        {stages.map((label, index) => {
          const complete = index < stage || questClear;
          const active = index === stage && !questClear;

          return (
            <div key={label} className="flex items-center">
              <div
                className={`relative flex items-center gap-2 border-2 px-3 py-1 text-[10px] uppercase font-mono tracking-[0.1em] ${
                  complete
                    ? 'border-[#00F1DE] bg-[#00F1DE]/10 text-[#00F1DE]'
                    : active
                      ? 'border-[#00F1DE] text-white'
                      : 'border-[#2a2a2a] text-[#6B6965]'
                }`}
              >
                {complete && <Check size={12} />}
                {label}
                {active && (
                  <span
                    aria-hidden="true"
                    className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-[#FF00A8]"
                  />
                )}
              </div>
              {index < stages.length - 1 && (
                <div className={`h-0.5 w-4 md:w-6 ${index < stage ? 'bg-[#00F1DE]' : 'bg-[#2a2a2a]'}`} />
              )}
            </div>
          );
        })}
      </div>
      {questClear && (
        <div className="mt-2 flex items-center justify-center gap-2 text-[10px] uppercase font-mono tracking-[0.15em] text-[#00F1DE]">
          <Flag size={12} /> Quest clear
        </div>
      )}
    </div>
  );
}

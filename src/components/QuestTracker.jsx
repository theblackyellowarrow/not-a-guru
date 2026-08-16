import { Check, Flag } from 'lucide-react';

const STAGES = ['Raw Idea', 'Problem Statement', 'Solution'];

export default function QuestTracker({ stage }) {
  const questClear = stage >= STAGES.length - 1;

  return (
    <div className="select-none border border-[#6B6965] bg-[#0f0f0f] p-3">
      <div className="flex items-center justify-center">
        {STAGES.map((label, index) => {
          const complete = index < stage || questClear;
          const active = index === stage && !questClear;

          return (
            <div key={label} className="flex items-center">
              <div
                className={`flex items-center gap-2 border-2 px-3 py-1 text-[10px] uppercase font-mono tracking-[0.1em] ${
                  complete
                    ? 'border-[#FF00A8] bg-[#FF00A8]/10 text-[#FF00A8]'
                    : active
                      ? 'border-[#C8C5BF] text-white'
                      : 'border-[#2a2a2a] text-[#6B6965]'
                }`}
              >
                {complete && <Check size={12} />}
                {label}
              </div>
              {index < STAGES.length - 1 && (
                <div className={`h-0.5 w-6 ${index < stage ? 'bg-[#FF00A8]' : 'bg-[#2a2a2a]'}`} />
              )}
            </div>
          );
        })}
      </div>
      {questClear && (
        <div className="mt-2 flex items-center justify-center gap-2 text-[10px] uppercase font-mono tracking-[0.15em] text-[#FF00A8]">
          <Flag size={12} /> Quest clear
        </div>
      )}
    </div>
  );
}

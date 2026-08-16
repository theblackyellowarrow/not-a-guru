import { Check, Flag } from 'lucide-react';

const STAGES = ['Raw Idea', 'Problem Statement', 'Solution'];

export default function QuestTracker({ stage }) {
  const questClear = stage >= STAGES.length - 1;

  return (
    <div className="select-none">
      <div className="flex items-center justify-center">
        {STAGES.map((label, index) => {
          const complete = index < stage || questClear;
          const active = index === stage && !questClear;

          return (
            <div key={label} className="flex items-center">
              <div
                className={`flex items-center gap-2 border-2 px-3 py-1 text-xs uppercase font-mono tracking-wider ${
                  complete
                    ? 'border-fuchsia-400 bg-fuchsia-900/20 text-fuchsia-200'
                    : active
                      ? 'border-gray-500 text-gray-200'
                      : 'border-gray-800 text-gray-600'
                }`}
              >
                {complete && <Check size={12} />}
                {label}
              </div>
              {index < STAGES.length - 1 && (
                <div className={`h-0.5 w-6 ${index < stage ? 'bg-fuchsia-400' : 'bg-gray-800'}`} />
              )}
            </div>
          );
        })}
      </div>
      {questClear && (
        <div className="mt-2 flex items-center justify-center gap-2 text-xs uppercase font-mono tracking-widest text-fuchsia-400">
          <Flag size={12} /> Quest clear
        </div>
      )}
    </div>
  );
}

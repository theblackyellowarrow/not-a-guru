import { useState } from 'react';
import { ArrowRight, BookOpen, FilePlus, HelpCircle, MessageSquare, SearchCheck, Wrench } from 'lucide-react';
import GeometricBackdrop from './GeometricBackdrop';

const modeOptions = [
  {
    key: 'start_project',
    label: 'Frame a new idea',
    followUp:
      'Good place to start. We will take your raw idea and turn it into a scored problem statement, then a solution statement and a future workflow.',
    icon: FilePlus,
  },
  {
    key: 'process_review',
    label: 'Review my process',
    followUp:
      'Smart. We will trace your research and decisions to see where the work might be shaky. I will start gentle and get sharper as we go.',
    icon: Wrench,
  },
  {
    key: 'final_review',
    label: 'Roast my final output',
    followUp:
      'Brave. Upload your final assets and framing, and I will critique the finished work against intent and trade-offs.',
    icon: SearchCheck,
  },
];

export default function Onboarding({
  username,
  lastThreadTitle,
  onSetUsername,
  onContinueSession,
  onSelect,
  onOpenHelp,
  isLoading,
}) {
  const [draftUsername, setDraftUsername] = useState(username || '');
  const [chatLog, setChatLog] = useState([
    {
      id: 'intro',
      type: 'guru',
      text: "Aight. I'm Not a Guru — a design peer built to keep your work honest. What are you here to do?",
    },
  ]);
  const [highlightedMode, setHighlightedMode] = useState(null);

  const handleModePick = (mode) => {
    if (chatLog.some((entry) => entry.key === mode.key)) return;
    setHighlightedMode(mode.key);
    setChatLog((prev) => [
      ...prev,
      { id: `user-${mode.key}`, type: 'user', text: mode.label, key: mode.key },
      { id: `guru-${mode.key}`, type: 'guru', text: mode.followUp },
      {
        id: 'next',
        type: 'guru',
        text: 'Ready? Add your username on the right and begin a session. I will bring you back to your last active chat next time.',
      },
    ]);
  };

  const handleSubmitUsername = (event) => {
    event.preventDefault();
    if (!draftUsername.trim()) return;
    onSetUsername(draftUsername.trim());
  };

  const ModeIcon = highlightedMode ? modeOptions.find((m) => m.key === highlightedMode)?.icon || MessageSquare : MessageSquare;

return (
    <div className="view-enter bg-[#090909] text-white min-h-screen antialiased overflow-y-auto">
      <GeometricBackdrop />
      <div className="relative z-10 mx-auto max-w-6xl px-4 py-8 md:py-12">
        {/* Hero: logo + name + tagline, independent of the columns below */}
        <header className="flex flex-col items-center text-center mb-10 md:mb-14">
          <div className="relative inline-flex items-center justify-center w-32 h-32 md:w-40 md:h-40 rounded-full border-[3px] border-[#FF00A8] mb-6 bg-[#090909]">
            <span
              aria-hidden="true"
              className="absolute inset-1 rounded-full border border-[#FF00A8]/40"
            />
            <img
              src="/brand/dotai-logo-mark.png"
              alt="dotai"
              className="relative h-14 w-auto md:h-16 opacity-95"
              loading="eager"
            />
          </div>
          <h1 className="text-4xl md:text-5xl font-semibold text-white uppercase font-mono tracking-[0.18em]">
            Not a Guru
          </h1>
          <p className="mt-3 text-[#00F1DE] text-base md:text-lg font-medium tracking-wide">
            Your Design Process Mentor
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10 items-start">
          {/* Left: guide chat */}
          <div className="border border-[#6B6965] bg-[#090909]/90 flex flex-col">
            <div className="border-b border-[#2a2a2a] px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-[10px] uppercase font-mono tracking-[0.15em] text-[#00F1DE]">
                <ModeIcon size={16} /> Not a Guru guide
              </div>
              <button
                onClick={onOpenHelp}
                className="text-[#6B6965] hover:text-white transition-colors"
                aria-label="Open help"
              >
                <HelpCircle size={18} />
              </button>
            </div>

            <div className="flex-1 p-4 md:p-6 space-y-4 min-h-[420px]">
              {chatLog.map((entry, index) =>
                entry.type === 'guru' ? (
                  <div key={entry.id} className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center border border-[#6B6965] bg-[#090909]">
                      <MessageSquare size={16} className="text-white" />
                    </div>
                    <div className="flex-1 border border-[#2a2a2a] bg-[#0f0f0f] p-3 text-sm text-[#EFEDE8]">
                      {entry.text}
                    </div>
                  </div>
                ) : (
                  <div key={entry.id} className="flex items-start gap-3 flex-row-reverse">
                    <div className="flex-shrink-0 w-7 h-7 flex items-center justify-center border border-[#00F1DE] bg-[#090909]">
                      <span className="text-[#00F1DE] text-[10px] font-mono">YOU</span>
                    </div>
                    <div className="flex-1 border-r-2 border-[#00F1DE] bg-[#090909] p-3 text-sm text-white text-right">
                      {entry.text}
                    </div>
                  </div>
                )
              )}
            </div>

            <div className="border-t border-[#2a2a2a] p-4 md:p-6">
              <p className="text-[10px] uppercase font-mono tracking-[0.15em] text-[#6B6965] mb-3">Pick a path</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {modeOptions.map((mode) => {
                  const Icon = mode.icon;
                  const active = highlightedMode === mode.key;
                  return (
                    <button
                      key={mode.key}
                      onClick={() => handleModePick(mode)}
                      disabled={isLoading}
                      className={`text-left border px-4 py-3 transition-all disabled:opacity-50 ${
                        active
? 'border-[#00F1DE] bg-[#003D39]/30 text-white'
                          : 'border-[#F7F5F0] hover:border-[#00F1DE] hover:shadow-[3px_3px_0_0_#00F1DE] bg-[#090909]'
                      }`}
                    >
                      <Icon size={18} className={active ? 'text-[#00F1DE]' : 'text-[#C8C5BF]'} />
                      <div className="mt-2 text-sm font-semibold font-mono uppercase tracking-wider">{mode.label}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right: begin a session */}
          <div className="border border-[#F7F5F0] bg-[#090909]/90 p-6 md:p-8">
            <div className="mt-2 space-y-6">
              {username ? (
                <>
                  <div>
                    <p className="text-sm text-[#C8C5BF]">
                      Signed in as <span className="text-white font-semibold">{username}</span>.
                    </p>
                  </div>

                  {lastThreadTitle && (
                    <div className="border border-[#6B6965] bg-[#0f0f0f] p-4">
                      <div className="flex items-center gap-2 text-[10px] uppercase font-mono tracking-[0.15em] text-[#00F1DE] mb-2">
                        <BookOpen size={14} /> Continue where you left off
                      </div>
                      <p className="text-sm text-[#EFEDE8] truncate">{lastThreadTitle}</p>
                      <button
                        onClick={onContinueSession}
                        disabled={isLoading}
                        className="mt-3 group relative flex items-center gap-2 border border-white bg-[#F7F5F0] text-black px-4 py-2 text-sm uppercase font-mono transition-all hover:border-[#00F1DE] hover:shadow-[3px_3px_0_0_#00F1DE] disabled:opacity-50 clip-corner"
                      >
                        Continue session <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                      </button>
                    </div>
                  )}

                  <div>
                    <p className="text-[10px] uppercase font-mono tracking-[0.15em] text-[#6B6965] mb-3">
                      {lastThreadTitle ? 'Or start a new quest' : 'Start your first quest'}
                    </p>
                    <div className="grid grid-cols-1 gap-3">
                      {modeOptions.map((mode) => {
                        const Icon = mode.icon;
                        const active = highlightedMode === mode.key;
                        return (
                          <button
                            key={mode.key}
                            onClick={() => onSelect(mode.key)}
                            disabled={isLoading}
                            className={`text-left border px-4 py-3 transition-all disabled:opacity-50 flex items-start gap-3 ${
                              active
                                ? 'border-[#00F1DE] bg-[#003D39]/40'
                                : 'border-[#F7F5F0] hover:border-[#00F1DE] hover:shadow-[3px_3px_0_0_#00F1DE] bg-[#090909]'
                            }`}
                          >
                            <Icon size={20} className={active ? 'text-[#00F1DE]' : 'text-[#C8C5BF]'} />
                            <div>
                              <div className="text-sm font-semibold font-mono uppercase tracking-wider">{mode.label}</div>
                              <p className="mt-1 text-xs text-[#C8C5BF]">{mode.followUp}</p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              ) : (
                <form onSubmit={handleSubmitUsername}>
                  <label className="block text-[10px] uppercase font-mono tracking-[0.15em] text-[#6B6965] mb-2">
                    Begin a session
                  </label>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input
                      type="text"
                      value={draftUsername}
                      onChange={(event) => setDraftUsername(event.target.value)}
                      placeholder="Enter your username"
                      className="flex-1 bg-transparent border border-[#6B6965] px-4 py-3 text-white placeholder-[#6B6965] focus:outline-none focus:border-[#FF00A8] font-mono"
                      disabled={isLoading}
                    />
                    <button
                      type="submit"
                      disabled={!draftUsername.trim() || isLoading}
                      className="relative overflow-hidden bg-[#FF00A8] text-black px-6 py-3 text-sm uppercase font-mono font-semibold tracking-wider clip-corner hover:brightness-110 disabled:opacity-40 transition-all flex items-center justify-center gap-2"
                    >
                      Start <ArrowRight size={16} />
                    </button>
                  </div>
                  <p className="mt-2 text-xs text-[#6B6965]">
                    Your username identifies your session history on this device.
                  </p>
                </form>
              )}
            </div>

            <div className="mt-10 border-t border-[#2a2a2a] pt-6">
              <p className="text-xs text-[#6B6965] leading-relaxed">
                Not a Guru is built by <span className="text-white">dotai</span>. It asks better questions,
                scores your work stage-by-stage, and helps you leave with a marksheet.
              </p>
              <p className="mt-4 text-[10px] text-[#6B6965] font-mono tracking-[0.2em]">powered by dotai</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

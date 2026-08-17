import { useEffect, useRef, useState } from 'react';
import { ArrowRight, BookOpen, HelpCircle, MessageSquare, Send, Sparkles } from 'lucide-react';
import GeometricBackdrop from './GeometricBackdrop';
import VectorPanel from './VectorPanel';
import { useHoverParallax, usePointerOffset } from '../hooks/useParallax.js';
import { callAI } from '../aiClient';
import {
  createTriagePayload,
  extractTriageRoute,
  generateId,
  parseAIResponse,
  stripTriageMarker,
} from '../chatRuntime';

const TRIAGE_GREETING =
  'How can Not a Guru help you? You can call me NG. Do you have a design problem to discuss?';

const FLOW_TITLES = {
  start_project: 'Build a Problem Statement',
  process_review: 'Design Process Critique',
  final_review: 'Final Roast',
};

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
  useEffect(() => {
    setDraftUsername(username || '');
  }, [username]);
  const [chatLog, setChatLog] = useState([
    { id: 'triage_intro', type: 'guru', text: TRIAGE_GREETING, timestamp: new Date().toISOString() },
  ]);
  const [triageInput, setTriageInput] = useState('');
  const [triageLoading, setTriageLoading] = useState(false);
  const [triageRoute, setTriageRoute] = useState(null);
  const [triageError, setTriageError] = useState(null);
  const triageInFlightRef = useRef(false);

  const heroRef = useRef(null);
  const heroPointer = usePointerOffset(6);
  const heroHover = useHoverParallax(2);

  async function handleTriageSend(event) {
    event?.preventDefault?.();
    const userText = triageInput.trim();
    if (!userText || triageLoading || triageInFlightRef.current || triageRoute) return;

    const userMessage = {
      id: generateId('triage_user'),
      type: 'user',
      text: userText,
      timestamp: new Date().toISOString(),
    };

    const placeholderId = generateId('triage_guru');
    const placeholderMessage = {
      id: placeholderId,
      type: 'guru',
      text: 'Thinking…',
      phase: 'generating',
      timestamp: new Date().toISOString(),
    };

    setChatLog((prev) => [...prev, userMessage, placeholderMessage]);
    setTriageInput('');
    setTriageLoading(true);
    setTriageError(null);
    triageInFlightRef.current = true;

    try {
      const history = [...chatLog, userMessage];
      const payload = createTriagePayload(history, [{ text: userText }]);
      const response = await callAI(payload);
      const finalText = await parseAIResponse(response, { label: 'triage reply' });

      const route = extractTriageRoute(finalText);
      const cleanedText = stripTriageMarker(finalText);

      setChatLog((prev) =>
        prev.map((m) =>
          m.id === placeholderId ? { ...m, text: cleanedText, phase: 'ready' } : m
        )
      );

      if (route) {
        setTriageRoute(route);
      }
    } catch (requestError) {
      console.error('Triage error:', requestError);
      setTriageError(requestError.message || 'Could not reach NG.');
      setChatLog((prev) => prev.filter((m) => m.id !== placeholderId));
    } finally {
      setTriageLoading(false);
      triageInFlightRef.current = false;
    }
  }

  function handleRouteSubmit(event) {
    event.preventDefault();
    if (!draftUsername.trim()) return;
    onSetUsername(draftUsername.trim());
    if (triageRoute) {
      onSelect(triageRoute);
    }
  }

  const chatDisabled = triageLoading || Boolean(triageRoute);

  return (
    <div className="view-enter bg-[#090909] text-white min-h-screen antialiased overflow-y-auto">
      <GeometricBackdrop />
      <div className="relative z-10 mx-auto max-w-6xl px-4 py-8 md:py-12">
        {/* Hero: logo + name + tagline, independent of the columns below */}
        <header
          ref={heroRef}
          className="flex flex-col items-center text-center mb-10 md:mb-14"
          style={{
            transform: `translate3d(${heroPointer.x}px, ${heroPointer.y + heroHover.y}px, 0)`,
            transition: 'transform 160ms ease-out',
            willChange: 'transform',
          }}
        >
          <div className="relative inline-flex items-center justify-center w-32 h-32 md:w-40 md:h-40 rounded-full border-[3px] border-[#FF00A8] mb-6 bg-[#090909]">
            <span aria-hidden="true" className="absolute inset-1 rounded-full border border-[#FF00A8]/40" />
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-stretch">
          {/* Left: free conversational triage with NG */}
          <VectorPanel variant="cyan" className="flex flex-col">
            <div className="flex items-center justify-between pb-3">
              <div className="flex items-center gap-2 text-[10px] uppercase font-mono tracking-[0.15em] text-[#00F1DE]">
                <MessageSquare size={16} /> Chat with NG
              </div>
              <button
                onClick={onOpenHelp}
                className="text-[#6B6965] hover:text-white transition-colors"
                aria-label="Open help"
              >
                <HelpCircle size={18} />
              </button>
            </div>

            <div className="flex-1 space-y-3">
              {chatLog.map((entry) =>
                entry.type === 'guru' ? (
                  <div key={entry.id} className="flex items-start gap-3 message-rise">
                    <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center border border-[#6B6965] bg-[#090909]">
                      <MessageSquare size={16} className="text-white" />
                    </div>
                    <div className="flex-1 border border-[#2a2a2a] bg-[#0f0f0f] p-3 text-sm text-white whitespace-pre-wrap leading-relaxed">
                      {entry.text}
                    </div>
                  </div>
                ) : (
                  <div key={entry.id} className="flex items-start gap-3 flex-row-reverse message-rise">
                    <div className="flex-shrink-0 w-7 h-7 flex items-center justify-center border border-[#00F1DE] bg-[#090909]">
                      <span className="text-[#00F1DE] text-[10px] font-mono">YOU</span>
                    </div>
                    <div className="flex-1 border-r-2 border-[#00F1DE] bg-[#090909] p-3 text-sm text-white text-right whitespace-pre-wrap leading-relaxed">
                      {entry.text}
                    </div>
                  </div>
                )
              )}
            </div>

            <div className="pt-3 mt-3 border-t border-[#2a2a2a]">
              {triageRoute ? (
                <div className="flex items-start gap-3 text-[#00F1DE]">
                  <Sparkles size={16} className="mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[10px] uppercase font-mono tracking-[0.15em]">
                      Routed to {FLOW_TITLES[triageRoute]}
                    </p>
                    <p className="mt-1 text-xs text-[#D8D4CC] font-sans tracking-normal normal-case">
                      Add a username on the right to begin.
                    </p>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleTriageSend} className="flex flex-col gap-2">
                  <label className="text-[10px] uppercase font-mono tracking-[0.15em] text-[#9A968D]">
                    Tell NG what you are working on
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={triageInput}
                      onChange={(event) => setTriageInput(event.target.value)}
                      placeholder="A rough idea I have been sitting on…"
                      className="flex-1 bg-transparent border border-[#6B6965] px-3 py-2 text-sm text-white placeholder-[#9A968D] focus:outline-none focus:border-[#FF00A8] font-mono"
                      disabled={chatDisabled}
                      aria-label="Message to NG"
                    />
                    <button
                      type="submit"
                      disabled={chatDisabled || !triageInput.trim()}
                      className="relative overflow-hidden bg-[#FF00A8] text-black px-4 py-2 text-sm uppercase font-mono font-semibold tracking-wider clip-corner hover:brightness-110 disabled:opacity-40 transition-all flex items-center justify-center gap-2"
                      aria-label="Send to NG"
                    >
                      <Send size={14} />
                    </button>
                  </div>
                  {triageError && (
                    <p className="text-xs text-[#B42318]">{triageError}</p>
                  )}
                </form>
              )}
            </div>
          </VectorPanel>

          {/* Right: username + session control */}
          <VectorPanel variant="bone" className="flex flex-col">
            <div className="space-y-6">
              {username ? (
                <>
                  <div>
                    <p className="text-sm text-[#D8D4CC]">
                      Signed in as <span className="text-white font-semibold">{username}</span>.
                    </p>
                  </div>

                  {lastThreadTitle && (
                    <div className="border border-[#6B6965] bg-[#0f0f0f] p-4">
                      <div className="flex items-center gap-2 text-[10px] uppercase font-mono tracking-[0.15em] text-[#00F1DE] mb-2">
                        <BookOpen size={14} /> Continue where you left off
                      </div>
                      <p className="text-sm text-white truncate">{lastThreadTitle}</p>
                      <button
                        onClick={onContinueSession}
                        disabled={isLoading}
                        className="mt-3 group relative flex items-center gap-2 border border-white bg-[#F7F5F0] text-black px-4 py-2 text-sm uppercase font-mono transition-all hover:border-[#00F1DE] hover:shadow-[3px_3px_0_0_#00F1DE] disabled:opacity-50 clip-corner"
                      >
                        Continue session <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                      </button>
                    </div>
                  )}

                  {triageRoute ? (
                    <button
                      onClick={() => onSelect(triageRoute)}
                      disabled={isLoading}
                      className="group w-full flex items-center justify-center gap-2 bg-[#FF00A8] text-black px-6 py-3 text-sm uppercase font-mono font-semibold tracking-wider clip-corner hover:brightness-110 disabled:opacity-40 transition-all"
                    >
                      Begin {FLOW_TITLES[triageRoute]} <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                  ) : (
                    <p className="text-xs text-[#9A968D]">
                      NG is figuring out where to take you on the left. Once routed, a Begin button will appear here.
                    </p>
                  )}
                </>
              ) : (
                <form onSubmit={handleRouteSubmit}>
                  <h2 className="text-2xl md:text-3xl font-semibold text-white leading-tight mb-4">
                    Start your design process from scratch — become a <span className="text-[#00F1DE]">dotai</span> Design Ninja
                  </h2>
                  <label className="block text-[10px] uppercase font-mono tracking-[0.15em] text-[#9A968D] mb-2">
                    Pick your ninja name
                  </label>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input
                      type="text"
                      value={draftUsername}
                      onChange={(event) => setDraftUsername(event.target.value)}
                      placeholder="Enter your username"
                      className="flex-1 bg-transparent border border-[#6B6965] px-4 py-3 text-white placeholder-[#9A968D] focus:outline-none focus:border-[#FF00A8] font-mono"
                      disabled={isLoading}
                    />
                    <button
                      type="submit"
                      disabled={isLoading || !draftUsername.trim()}
                      className="relative overflow-hidden bg-[#FF00A8] text-black px-6 py-3 text-sm uppercase font-mono font-semibold tracking-wider clip-corner hover:brightness-110 disabled:opacity-40 transition-all flex items-center justify-center gap-2"
                    >
                      {triageRoute ? 'Begin' : 'Set ninja name'} <ArrowRight size={16} />
                    </button>
                  </div>
                  <p className="mt-2 text-xs text-[#9A968D]">
                    {triageRoute
                      ? `NG will take you straight into ${FLOW_TITLES[triageRoute]}.`
                      : 'Chat with NG on the left first. Your username identifies your session history on this device.'}
                  </p>
                </form>
              )}
            </div>

            <div className="mt-auto pt-6">
              <p className="text-xs text-[#9A968D] leading-relaxed">
                Not a Guru is built by <span className="text-[#00F1DE]">dotai</span>. It asks better questions,
                scores every stage, and signs off with a <span className="text-[#00F1DE]">dotai</span> Design Ninja certificate addressed to your ninja name.
              </p>
              <p className="mt-4 text-[10px] text-[#9A968D] font-mono tracking-[0.2em]">powered by <span className="text-[#00F1DE]">dotai</span></p>
            </div>
          </VectorPanel>
        </div>
      </div>
    </div>
  );
}

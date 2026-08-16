import DOMPurify from 'dompurify';
import { marked } from 'marked';
import { ArrowRight, BrainCircuit, FileText, Flag, Pencil, RefreshCcw, ShieldAlert, Sparkles, User, X } from 'lucide-react';
import { stripMarkers } from '../chatRuntime';

function formatTimestamp(iso) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

export function MessageRenderer({ message, isLoading, isLastMessage, onRepeat, onReviseFrom }) {
  switch (message.type) {
    case 'user':
      return (
        <ChatMessage
          message={message}
          onReviseFrom={onReviseFrom}
        />
      );
    case 'guru':
      return <ChatMessage message={message} isLoading={isLoading} isLastMessage={isLastMessage} />;
    case 'tool_personas':
      return <PersonaMessage personas={message.personas} />;
    case 'tool_critique':
      return <CritiqueMessage text={message.text} />;
    case 'stage_marker':
      return <StageMarker text={message.text} />;
    case 'score_card':
      return <ScoreCard data={message} onRepeat={onRepeat} />;
    case 'workflow_card':
      return <WorkflowCard data={message} />;
    default:
      return null;
  }
}

function StageMarker({ text }) {
  return (
    <div className="my-6 flex items-center gap-3">
      <div className="h-px flex-1 bg-[#6B6965]" />
      <span className="text-xs uppercase font-mono tracking-[0.15em] text-[#FF00A8]">{text}</span>
      <div className="h-px flex-1 bg-[#6B6965]" />
    </div>
  );
}

function MarkdownRenderer({ text, isStreaming }) {
  const cleanText = stripMarkers(text || '');
  const html = DOMPurify.sanitize(marked.parse(cleanText || '', { async: false }));

  return (
    <div
      className={`prose-styles ${isStreaming ? 'blinking-cursor' : ''}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

function AttachmentList({ attachments }) {
  if (!attachments?.length) return null;

  return (
    <div className="mt-3 border-t border-[#2a2a2a] pt-2 text-xs text-[#C8C5BF] space-y-1 font-mono">
      {attachments.map((attachment) => (
        <div key={`${attachment.name}-${attachment.label || 'attachment'}`} className="flex items-center gap-2">
          <FileText size={14} className="text-[#FF00A8]" />
          <span className="truncate">
            {attachment.label ? `${attachment.label}: ` : ''}
            {attachment.name}
          </span>
        </div>
      ))}
    </div>
  );
}

function ChatMessage({ message, isLoading, isLastMessage, onReviseFrom }) {
  const isGuru = message.type === 'guru';
  const Icon = isGuru ? BrainCircuit : User;
  const isStreaming = isGuru && isLoading && isLastMessage;
  const attachments = message.attachments || (message.file ? [message.file] : []);

  if (isGuru) {
    return (
      <div className="flex items-start gap-3 my-6">
        <div className="flex-shrink-0 w-9 h-9 flex items-center justify-center border border-[#6B6965] bg-[#090909]">
          <Icon size={20} className="text-white" />
        </div>
        <div className="flex flex-1 min-w-0 items-stretch gap-3">
          <div
            aria-hidden="true"
            className="field-vector flex-shrink-0 self-stretch"
          />
          <div className="flex-1 min-w-0 border border-[#2a2a2a] bg-[#0f0f0f] p-4">
            {isStreaming && message.text === 'Thinking...' ? (
              <div className="flex items-center gap-2 text-[#6B6965] text-sm font-mono uppercase tracking-wider">
                <span className="inline-block w-2 h-2 bg-[#FF00A8] animate-pulse" />
                Thinking…
              </div>
            ) : (
              <MarkdownRenderer text={message.text} isStreaming={isStreaming} />
            )}
            <AttachmentList attachments={attachments} />
            <div className="mt-3 text-[10px] font-mono text-[#6B6965] tracking-wider">
              {formatTimestamp(message.timestamp)}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative my-4 border-l-2 border-[#FF00A8] bg-[#090909] pl-4 py-3 pr-3">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center border border-[#6B6965]">
          <Icon size={14} className="text-[#FF00A8]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white whitespace-pre-wrap text-base leading-relaxed">{message.text}</p>
          <AttachmentList attachments={attachments} />
        </div>
      </div>
      <div className="mt-2 flex items-center gap-3 text-[10px] font-mono text-[#6B6965] tracking-wider">
        <span>{formatTimestamp(message.timestamp)}</span>
        {onReviseFrom && (
          <button
            type="button"
            onClick={() => onReviseFrom(message)}
            className="inline-flex items-center gap-1 hover:text-[#FF00A8] transition-colors underline-offset-2 hover:underline"
            aria-label="Revise from this turn"
            title="Copy this turn into the composer as the next message"
          >
            <Pencil size={12} /> Revise
          </button>
        )}
      </div>
    </div>
  );
}

function ScoreCard({ data, onRepeat }) {
  const { score, rationale, strengths, weaknesses, suggestedImprovement, stageIndex = 0 } = data;
  const passed = score >= 80;
  const scoreColor = passed ? 'text-[#FF00A8] border-[#FF00A8]' : 'text-[#A45A00] border-[#A45A00]';
  const stageLabel = data.stageLabel || (stageIndex === 0 ? 'Problem statement score' : `Stage ${stageIndex + 1} score`);

  return (
    <div className={`my-6 border-2 ${scoreColor} bg-[#4A002D]/30 p-5`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-[10px] uppercase font-mono tracking-[0.15em] text-[#6B6965] mb-1">
            {stageLabel}
          </div>
          <div className="flex items-baseline gap-3">
            <span className={`text-5xl font-bold font-mono ${passed ? 'text-[#FF00A8]' : 'text-[#A45A00]'}`}>
              {score}
            </span>
            <span className="text-sm text-[#C8C5BF] font-mono">/ 100</span>
          </div>
        </div>
        <div className={`border px-3 py-1 text-[10px] uppercase font-mono tracking-wider ${passed ? 'border-[#FF00A8] text-[#FF00A8]' : 'border-[#A45A00] text-[#A45A00]'}`}>
          {passed ? 'Good to go' : 'Needs work'}
        </div>
      </div>

      <p className="mt-4 text-[#EFEDE8] text-sm leading-relaxed">{rationale}</p>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <div>
          <h4 className="uppercase font-mono text-[10px] tracking-[0.15em] text-[#6B6965] mb-2">Strengths</h4>
          <ul className="list-disc list-inside text-[#C8C5BF] space-y-1">
            {strengths.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="uppercase font-mono text-[10px] tracking-[0.15em] text-[#6B6965] mb-2">Weaknesses</h4>
          <ul className="list-disc list-inside text-[#C8C5BF] space-y-1">
            {weaknesses.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-4 border-t border-[#2a2a2a] pt-4">
        <h4 className="uppercase font-mono text-[10px] tracking-[0.15em] text-[#6B6965] mb-1">Suggested improvement</h4>
        <p className="text-[#EFEDE8] text-sm">{suggestedImprovement}</p>
      </div>

      {!passed && onRepeat && (
        <div className="mt-5 flex items-center gap-3">
          <button
            onClick={onRepeat}
            className="group flex items-center gap-2 border border-[#A45A00] bg-[#A45A00]/10 px-4 py-2 text-sm uppercase font-mono text-[#EFEDE8] transition-all hover:border-[#FF00A8] hover:text-[#FF00A8]"
          >
            <RefreshCcw size={14} className="group-hover:-rotate-180 transition-transform duration-500" /> Repeat for a better statement
          </button>
        </div>
      )}
    </div>
  );
}

function WorkflowCard({ data }) {
  const { workflow, nextMilestone, risks, openQuestions } = data;
  const html = DOMPurify.sanitize(marked.parse(workflow || '', { async: false }));

  return (
    <div className="my-6 border-2 border-[#FF00A8] bg-[#4A002D]/20 p-5">
      <div className="flex items-center gap-2 text-[#FF00A8] uppercase font-mono text-[10px] tracking-[0.15em] mb-4">
        <Flag size={16} /> Proposed workflow
      </div>

      <div className="prose-styles text-[#EFEDE8] text-sm" dangerouslySetInnerHTML={{ __html: html }} />

      <div className="mt-5 border-t border-[#2a2a2a] pt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <div>
          <h4 className="uppercase font-mono text-[10px] tracking-[0.15em] text-[#6B6965] mb-2">Next milestone</h4>
          <p className="text-[#EFEDE8]">{nextMilestone}</p>
        </div>
        <div>
          <h4 className="uppercase font-mono text-[10px] tracking-[0.15em] text-[#6B6965] mb-2">Risks</h4>
          <ul className="list-disc list-inside text-[#C8C5BF] space-y-1">
            {risks.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-4 text-sm">
        <h4 className="uppercase font-mono text-[10px] tracking-[0.15em] text-[#6B6965] mb-2">Open questions</h4>
        <ul className="list-disc list-inside text-[#C8C5BF] space-y-1">
          {openQuestions.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function PersonaMessage({ personas }) {
  return (
    <div className="my-6 border border-[#2a2a2a] bg-[#0f0f0f] p-4">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2 uppercase font-mono tracking-wider">
        <Sparkles size={18} className="text-[#FF00A8]" /> Draft Personas
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {personas.map((persona) => (
          <div key={persona.name} className="border border-[#2a2a2a] bg-[#090909] p-4 hover:border-[#FF00A8] transition-colors">
            <h4 className="font-bold text-white text-lg uppercase font-mono tracking-wider">{persona.name}</h4>
            <p className="text-base text-[#C8C5BF] mb-2 font-mono text-sm">{persona.demographic}</p>
            <p className="text-base italic text-[#EFEDE8] my-3 font-serif-reading">&quot;{persona.quote}&quot;</p>
            <div className="text-base">
              <strong className="text-white block mt-2 uppercase font-mono text-xs tracking-wider">Needs:</strong>
              <ul className="list-disc list-inside text-[#C8C5BF]">
                {persona.needs.map((need) => (
                  <li key={need}>{need}</li>
                ))}
              </ul>
              <strong className="text-white block mt-2 uppercase font-mono text-xs tracking-wider">Frustrations:</strong>
              <ul className="list-disc list-inside text-[#C8C5BF]">
                {persona.frustrations.map((frustration) => (
                  <li key={frustration}>{frustration}</li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CritiqueMessage({ text }) {
  return (
    <div className="my-6 border-l-2 border-[#A45A00] bg-[#0f0f0f] p-4">
      <h3 className="text-sm font-semibold text-[#A45A00] mb-2 flex items-center gap-2 uppercase font-mono tracking-wider">
        <ShieldAlert size={18} /> Bias Check
      </h3>
      <div className="text-[#EFEDE8] whitespace-pre-wrap text-base">{text}</div>
    </div>
  );
}

export function LoadingIndicator() {
  return (
    <div className="flex items-start gap-3 my-6">
      <div className="flex-shrink-0 w-9 h-9 flex items-center justify-center border border-[#6B6965]">
        <BrainCircuit size={20} className="text-white animate-pulse" />
      </div>
      <div className="flex-1 border border-[#2a2a2a] bg-[#0f0f0f] p-4">
        <div className="flex items-center gap-2 text-[#6B6965] text-sm font-mono uppercase tracking-wider">
          <span className="inline-block w-2 h-2 bg-[#FF00A8] animate-pulse" />
          Thinking…
        </div>
      </div>
    </div>
  );
}

export function ToolActivity({ phase }) {
  if (!phase) return null;
  return (
    <div
      role="status"
      aria-live="polite"
      className="my-4 border border-dashed border-[#6B6965] bg-[#0f0f0f]/40 px-4 py-3"
    >
      <span className="tool-activity">{phase}</span>
    </div>
  );
}

export function ErrorMessage({ message, onClose }) {
  return (
    <div className="mb-2 p-3 border border-[#B42318] bg-[#B42318]/10 flex items-center justify-between text-sm text-[#EFEDE8]">
      <span>{message}</span>
      <button onClick={onClose} className="p-1 text-[#C8C5BF] hover:text-white">
        <X size={16} />
      </button>
    </div>
  );
}

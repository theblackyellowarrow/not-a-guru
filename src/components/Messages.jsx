import DOMPurify from 'dompurify';
import { marked } from 'marked';
import { ArrowRight, BrainCircuit, FileText, Flag, RefreshCcw, ShieldAlert, Sparkles, User, X } from 'lucide-react';
import { stripMarkers } from '../chatRuntime';

export function MessageRenderer({ message, isLoading, isLastMessage, onRepeat }) {
  switch (message.type) {
    case 'user':
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
      <div className="h-px flex-1 bg-gray-800" />
      <span className="text-xs uppercase font-mono tracking-widest text-cyan-400">{text}</span>
      <div className="h-px flex-1 bg-gray-800" />
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
    <div className="mt-3 border-t-2 border-gray-700/50 pt-2 text-xs text-gray-400 space-y-2">
      {attachments.map((attachment) => (
        <div key={`${attachment.name}-${attachment.label || 'attachment'}`} className="flex items-center gap-2">
          <FileText size={14} />
          <span className="truncate">
            {attachment.label ? `${attachment.label}: ` : ''}
            {attachment.name}
          </span>
        </div>
      ))}
    </div>
  );
}

function ChatMessage({ message, isLoading, isLastMessage }) {
  const isGuru = message.type === 'guru';
  const Icon = isGuru ? BrainCircuit : User;
  const isStreaming = isGuru && isLoading && isLastMessage;
  const attachments = message.attachments || (message.file ? [message.file] : []);

  return (
    <div className={`flex items-start gap-4 ${isGuru ? '' : 'flex-row-reverse'}`}>
      <div
        className={`flex-shrink-0 w-10 h-10 flex items-center justify-center border-2 ${
          isGuru ? 'border-gray-700' : 'border-cyan-400'
        }`}
      >
        <Icon size={24} className={isGuru ? 'text-gray-200' : 'text-cyan-400'} />
      </div>
      <div
        className={`w-full max-w-xl p-4 border-2 ${
          isGuru ? 'border-gray-800 bg-gray-900' : 'border-cyan-800 bg-cyan-900/20'
        }`}
      >
        {isGuru ? (
          <MarkdownRenderer text={message.text} isStreaming={isStreaming} />
        ) : (
          <p className="text-gray-200 whitespace-pre-wrap text-base">{message.text}</p>
        )}
        <AttachmentList attachments={attachments} />
      </div>
    </div>
  );
}

function ScoreCard({ data, onRepeat }) {
  const { score, rationale, strengths, weaknesses, suggestedImprovement } = data;
  const passed = score >= 80;
  const scoreColor = passed ? 'text-cyan-400 border-cyan-400' : 'text-amber-400 border-amber-400';
  const bgColor = passed ? 'bg-cyan-900/10' : 'bg-amber-900/10';

  return (
    <div className={`my-6 border-2 ${scoreColor} ${bgColor} p-5`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xs uppercase font-mono tracking-widest text-gray-500 mb-1">Problem statement score</div>
          <div className="flex items-baseline gap-3">
            <span className={`text-5xl font-bold font-mono ${passed ? 'text-cyan-400' : 'text-amber-400'}`}>
              {score}
            </span>
            <span className="text-sm text-gray-400">/ 100</span>
          </div>
        </div>
        <div className={`border px-3 py-1 text-xs uppercase font-mono ${passed ? 'border-cyan-400 text-cyan-300' : 'border-amber-400 text-amber-300'}`}>
          {passed ? 'Good to go' : 'Needs work'}
        </div>
      </div>

      <p className="mt-4 text-gray-300 text-sm leading-relaxed">{rationale}</p>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <div>
          <h4 className="uppercase font-mono text-xs tracking-widest text-gray-500 mb-2">Strengths</h4>
          <ul className="list-disc list-inside text-gray-400 space-y-1">
            {strengths.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="uppercase font-mono text-xs tracking-widest text-gray-500 mb-2">Weaknesses</h4>
          <ul className="list-disc list-inside text-gray-400 space-y-1">
            {weaknesses.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-4 border-t border-gray-700/50 pt-4">
        <h4 className="uppercase font-mono text-xs tracking-widest text-gray-500 mb-1">Suggested improvement</h4>
        <p className="text-gray-300 text-sm">{suggestedImprovement}</p>
      </div>

      {!passed && onRepeat && (
        <div className="mt-5 flex items-center gap-3">
          <button
            onClick={onRepeat}
            className="flex items-center gap-2 border-2 border-amber-600 bg-amber-900/30 px-4 py-2 text-sm uppercase font-mono text-amber-200 transition-colors hover:bg-amber-900/50 hover:border-amber-400"
          >
            <RefreshCcw size={14} /> Repeat for a better statement
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
    <div className="my-6 border-2 border-cyan-400 bg-cyan-900/10 p-5">
      <div className="flex items-center gap-2 text-cyan-300 uppercase font-mono text-sm tracking-widest mb-4">
        <Flag size={16} /> Proposed workflow
      </div>

      <div className="prose-styles text-gray-300 text-sm" dangerouslySetInnerHTML={{ __html: html }} />

      <div className="mt-5 border-t border-gray-700/50 pt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <div>
          <h4 className="uppercase font-mono text-xs tracking-widest text-gray-500 mb-2">Next milestone</h4>
          <p className="text-gray-300">{nextMilestone}</p>
        </div>
        <div>
          <h4 className="uppercase font-mono text-xs tracking-widest text-gray-500 mb-2">Risks</h4>
          <ul className="list-disc list-inside text-gray-400 space-y-1">
            {risks.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-4 text-sm">
        <h4 className="uppercase font-mono text-xs tracking-widest text-gray-500 mb-2">Open questions</h4>
        <ul className="list-disc list-inside text-gray-400 space-y-1">
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
    <div className="my-6">
      <h3 className="text-xl font-semibold text-gray-300 mb-4 flex items-center gap-2 uppercase font-mono">
        <Sparkles size={20} className="text-cyan-300" /> Draft Personas
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {personas.map((persona) => (
          <div key={persona.name} className="bg-gray-900/50 border-2 border-gray-800 p-4">
            <h4 className="font-bold text-cyan-300 text-lg uppercase font-mono">{persona.name}</h4>
            <p className="text-base text-gray-400 mb-2">{persona.demographic}</p>
            <p className="text-base italic text-gray-300 my-3">&quot;{persona.quote}&quot;</p>
            <div className="text-base">
              <strong className="text-gray-300 block mt-2 uppercase font-mono">Needs:</strong>
              <ul className="list-disc list-inside text-gray-400">
                {persona.needs.map((need) => (
                  <li key={need}>{need}</li>
                ))}
              </ul>
              <strong className="text-gray-300 block mt-2 uppercase font-mono">Frustrations:</strong>
              <ul className="list-disc list-inside text-gray-400">
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
    <div className="my-6 p-4 bg-amber-900/20 border-2 border-amber-700/50">
      <h3 className="text-lg font-semibold text-amber-300 mb-2 flex items-center gap-2 uppercase font-mono">
        <ShieldAlert size={20} /> Bias Check
      </h3>
      <div className="text-amber-200 whitespace-pre-wrap text-base">{text}</div>
    </div>
  );
}

export function LoadingIndicator() {
  return (
    <div className="flex items-start gap-4">
      <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center border-2 border-gray-700">
        <BrainCircuit size={24} className="text-gray-200 animate-pulse" />
      </div>
      <div className="w-full max-w-xl p-4 border-2 border-gray-800 bg-gray-900">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-gray-600 animate-pulse" style={{ animationDelay: '0s' }} />
          <div className="w-3 h-3 bg-gray-600 animate-pulse" style={{ animationDelay: '0.2s' }} />
          <div className="w-3 h-3 bg-gray-600 animate-pulse" style={{ animationDelay: '0.4s' }} />
        </div>
      </div>
    </div>
  );
}

export function ErrorMessage({ message, onClose }) {
  return (
    <div className="mb-2 p-3 bg-red-900/50 border-2 border-red-700 flex items-center justify-between text-sm text-red-200">
      <span>{message}</span>
      <button onClick={onClose} className="p-1 text-red-300 hover:text-white">
        <X size={16} />
      </button>
    </div>
  );
}

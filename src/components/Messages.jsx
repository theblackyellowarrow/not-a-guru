import { marked } from 'marked';
import { BrainCircuit, FileText, ShieldAlert, Sparkles, User, X } from 'lucide-react';

export function MessageRenderer({ message, isLoading, isLastMessage }) {
  switch (message.type) {
    case 'user':
    case 'guru':
      return <ChatMessage message={message} isLoading={isLoading} isLastMessage={isLastMessage} />;
    case 'tool_personas':
      return <PersonaMessage personas={message.personas} />;
    case 'tool_critique':
      return <CritiqueMessage text={message.text} />;
    default:
      return null;
  }
}

function MarkdownRenderer({ text, isStreaming }) {
  const html = marked.parse(text || '', { async: false });

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
    <div className="mt-3 border-t-2 border-light/50 pt-2 text-xs text-muted space-y-2">
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
          isGuru ? 'border-light' : 'border-accent'
        }`}
      >
        <Icon size={24} className={isGuru ? 'text-primary' : 'text-accent'} />
      </div>
      <div
        className={`w-full max-w-xl p-4 border-2 ${
          isGuru ? 'border-main bg-card' : 'border-accent bg-accent-subtle'
        }`}
      >
        {isGuru ? (
          <MarkdownRenderer text={message.text} isStreaming={isStreaming} />
        ) : (
          <p className="text-primary whitespace-pre-wrap text-base">{message.text}</p>
        )}
        <AttachmentList attachments={attachments} />
      </div>
    </div>
  );
}

function PersonaMessage({ personas }) {
  return (
    <div className="my-6">
      <h3 className="text-xl font-semibold text-secondary mb-4 flex items-center gap-2 uppercase font-mono">
        <Sparkles size={20} className="text-accent" /> Draft Personas
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {personas.map((persona) => (
          <div key={persona.name} className="bg-card-alt border-2 border-main p-4">
            <h4 className="font-bold text-accent text-lg uppercase font-mono">{persona.name}</h4>
            <p className="text-base text-muted mb-2">{persona.demographic}</p>
            <p className="text-base italic text-secondary my-3">&quot;{persona.quote}&quot;</p>
            <div className="text-base">
              <strong className="text-secondary block mt-2 uppercase font-mono">Needs:</strong>
              <ul className="list-disc list-inside text-muted">
                {persona.needs.map((need) => (
                  <li key={need}>{need}</li>
                ))}
              </ul>
              <strong className="text-secondary block mt-2 uppercase font-mono">Frustrations:</strong>
              <ul className="list-disc list-inside text-muted">
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
    <div className="my-6 p-4 bg-accent-subtle border-2 border-accent">
      <h3 className="text-lg font-semibold text-accent mb-2 flex items-center gap-2 uppercase font-mono">
        <ShieldAlert size={20} /> Bias Check
      </h3>
      <div className="text-primary whitespace-pre-wrap text-base">{text}</div>
    </div>
  );
}

export function LoadingIndicator() {
  return (
    <div className="flex items-start gap-4">
      <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center border-2 border-light">
        <BrainCircuit size={24} className="text-primary animate-pulse" />
      </div>
      <div className="w-full max-w-xl p-4 border-2 border-main bg-card">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-muted animate-pulse" style={{ animationDelay: '0s' }} />
          <div className="w-3 h-3 bg-muted animate-pulse" style={{ animationDelay: '0.2s' }} />
          <div className="w-3 h-3 bg-muted animate-pulse" style={{ animationDelay: '0.4s' }} />
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

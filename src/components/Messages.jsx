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
  const blocks = [];
  const lines = (text || '').split('\n');
  let paragraphLines = [];
  let listItems = [];
  let orderedItems = [];

  function flushParagraph() {
    if (paragraphLines.length === 0) return;
    blocks.push({
      type: 'paragraph',
      content: paragraphLines.join(' '),
    });
    paragraphLines = [];
  }

  function flushList() {
    if (listItems.length > 0) {
      blocks.push({ type: 'unordered-list', content: [...listItems] });
      listItems = [];
    }

    if (orderedItems.length > 0) {
      blocks.push({ type: 'ordered-list', content: [...orderedItems] });
      orderedItems = [];
    }
  }

  lines.forEach((line) => {
    const trimmed = line.trim();

    if (!trimmed) {
      flushParagraph();
      flushList();
      return;
    }

    const headingMatch = trimmed.match(/^(#{1,6})\s+(.*)$/);
    if (headingMatch) {
      flushParagraph();
      flushList();
      blocks.push({
        type: 'heading',
        level: headingMatch[1].length,
        content: headingMatch[2],
      });
      return;
    }

    const orderedMatch = trimmed.match(/^\d+\.\s+(.*)$/);
    if (orderedMatch) {
      flushParagraph();
      if (listItems.length > 0) {
        flushList();
      }
      orderedItems.push(orderedMatch[1]);
      return;
    }

    const unorderedMatch = trimmed.match(/^[-*]\s+(.*)$/);
    if (unorderedMatch) {
      flushParagraph();
      if (orderedItems.length > 0) {
        flushList();
      }
      listItems.push(unorderedMatch[1]);
      return;
    }

    paragraphLines.push(trimmed);
  });

  flushParagraph();
  flushList();

  return (
    <div className={`prose-styles ${isStreaming ? 'blinking-cursor' : ''}`}>
      {blocks.map((block, index) => {
        if (block.type === 'heading') {
          return (
            <p key={`${block.type}-${index}`} className="prose-heading">
              {renderInline(block.content)}
            </p>
          );
        }

        if (block.type === 'unordered-list') {
          return (
            <ul key={`${block.type}-${index}`}>
              {block.content.map((item, itemIndex) => (
                <li key={`${block.type}-${index}-${itemIndex}`}>{renderInline(item)}</li>
              ))}
            </ul>
          );
        }

        if (block.type === 'ordered-list') {
          return (
            <ol key={`${block.type}-${index}`}>
              {block.content.map((item, itemIndex) => (
                <li key={`${block.type}-${index}-${itemIndex}`}>{renderInline(item)}</li>
              ))}
            </ol>
          );
        }

        return (
          <p key={`${block.type}-${index}`}>
            {renderInline(block.content)}
          </p>
        );
      })}
    </div>
  );
}

function renderInline(text) {
  const parts = [];
  const pattern = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g;
  let lastIndex = 0;
  let match;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    const token = match[0];
    if (token.startsWith('**') && token.endsWith('**')) {
      parts.push(<strong key={`${match.index}-strong`}>{token.slice(2, -2)}</strong>);
    } else if (token.startsWith('*') && token.endsWith('*')) {
      parts.push(<em key={`${match.index}-em`}>{token.slice(1, -1)}</em>);
    } else if (token.startsWith('`') && token.endsWith('`')) {
      parts.push(<code key={`${match.index}-code`}>{token.slice(1, -1)}</code>);
    }

    lastIndex = pattern.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length > 0 ? parts : text;
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
          isGuru ? 'border-gray-700' : 'border-fuchsia-500'
        }`}
      >
        <Icon size={24} className={isGuru ? 'text-gray-200' : 'text-fuchsia-500'} />
      </div>
      <div
        className={`w-full max-w-xl p-4 border-2 ${
          isGuru ? 'border-gray-800 bg-gray-900' : 'border-fuchsia-800 bg-fuchsia-900/50'
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

function PersonaMessage({ personas }) {
  return (
    <div className="my-6">
      <h3 className="text-xl font-semibold text-gray-300 mb-4 flex items-center gap-2 uppercase font-mono">
        <Sparkles size={20} className="text-fuchsia-400" /> Draft Personas
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {personas.map((persona) => (
          <div key={persona.name} className="bg-gray-900/50 border-2 border-gray-800 p-4">
            <h4 className="font-bold text-fuchsia-400 text-lg uppercase font-mono">{persona.name}</h4>
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

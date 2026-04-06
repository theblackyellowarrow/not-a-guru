import { ShieldAlert, Users } from 'lucide-react';

export default function ToolbeltClean({ messages, flow, onToolUse, isLoading }) {
  const userMessageCount = messages.filter((message) => message.type === 'user').length;
  const lastMessageType = messages[messages.length - 1]?.type;
  const hasSolutionStatement = messages.some(
    (message) => typeof message.text === 'string' && message.text.toLowerCase().includes('solution statement')
  );

  const showPersonaTool = flow === 'start_project' && hasSolutionStatement && lastMessageType === 'guru';
  const showBlindspotTool = userMessageCount >= 2 && lastMessageType === 'guru' && flow !== 'venting_mode';

  if (!showPersonaTool && !showBlindspotTool) {
    return null;
  }

  return (
    <div className="flex justify-center gap-4 my-4 flex-wrap">
      {showPersonaTool && (
        <>
          <button
            disabled={isLoading}
            onClick={() => onToolUse('personas')}
            className="flex items-center gap-2 text-sm bg-fuchsia-900/50 text-fuchsia-300 px-4 py-2 border-2 border-fuchsia-700 hover:bg-fuchsia-900 transition-colors disabled:opacity-50 uppercase font-mono"
          >
            <Users size={16} /> Draft Personas
          </button>
          <button
            disabled={isLoading}
            onClick={() => onToolUse('blindspots')}
            className="flex items-center gap-2 text-sm bg-amber-900/50 text-amber-300 px-4 py-2 border-2 border-amber-700 hover:bg-amber-900 transition-colors disabled:opacity-50 uppercase font-mono"
          >
            <ShieldAlert size={16} /> Check for Bias
          </button>
        </>
      )}
      {flow !== 'start_project' && showBlindspotTool && (
        <button
          disabled={isLoading}
          onClick={() => onToolUse('blindspots')}
          className="flex items-center gap-2 text-sm bg-amber-900/50 text-amber-300 px-4 py-2 border-2 border-amber-700 hover:bg-amber-900 transition-colors disabled:opacity-50 uppercase font-mono"
        >
          <ShieldAlert size={16} /> Check for Bias
        </button>
      )}
    </div>
  );
}

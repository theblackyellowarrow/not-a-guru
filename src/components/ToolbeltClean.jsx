import { ShieldAlert, Users } from 'lucide-react';
import { MARKERS } from '../personaPrompt.js';

export default function ToolbeltClean({ messages, flow, onToolUse, isLoading }) {
  const userMessageCount = messages.filter((message) => message.type === 'user').length;
  const lastMessageType = messages[messages.length - 1]?.type;
  const hasSolutionMarker = messages.some(
    (message) =>
      typeof message.text === 'string' && message.text.includes(MARKERS.SOLUTION_STATEMENT_READY)
  );

  const showPersonaTool = flow === 'start_project' && hasSolutionMarker && lastMessageType === 'guru';
  const showBlindspotTool = userMessageCount >= 2 && lastMessageType === 'guru';

  if (!showPersonaTool && !showBlindspotTool) {
    return null;
  }

  return (
    <div className="flex justify-center gap-3 my-4 flex-wrap">
      {showPersonaTool && (
        <button
          disabled={isLoading}
          onClick={() => onToolUse('personas')}
          className="flex items-center gap-2 text-sm border border-[#FF00A8] text-[#FF00A8] px-4 py-2 hover:bg-[#FF00A8] hover:text-black transition-colors disabled:opacity-50 uppercase font-mono tracking-wider clip-corner"
        >
          <Users size={16} /> Draft Personas
        </button>
      )}
      {showBlindspotTool && (
        <button
          disabled={isLoading}
          onClick={() => onToolUse('blindspots')}
          className="flex items-center gap-2 text-sm border border-[#A45A00] text-[#A45A00] px-4 py-2 hover:bg-[#A45A00]/20 transition-colors disabled:opacity-50 uppercase font-mono tracking-wider"
        >
          <ShieldAlert size={16} /> Check for Bias
        </button>
      )}
    </div>
  );
}

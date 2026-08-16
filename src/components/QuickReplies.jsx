const QUICK_REPLIES = {
  start_project: [
    'Here is the rough idea',
    'Challenge my assumptions',
    'Why should anyone care?',
    'Help me write the problem statement',
    'Help me write the solution statement',
  ],
  process_review: [
    'What is the weakest link in my process?',
    'What evidence should I upload?',
    'What assumptions am I hiding?',
    'Be harsher',
  ],
  final_review: [
    'Roast the weakest point',
    'What breaks in the real world?',
    'What contradictions do you see?',
    'Be harsher',
  ],
};

export default function QuickReplies({ flow, onPick, disabled }) {
  const replies = QUICK_REPLIES[flow];
  if (!replies) return null;

  return (
    <div className="mb-3 flex flex-wrap justify-center gap-2">
      {replies.map((reply) => (
        <button
          key={reply}
          onClick={() => onPick(reply)}
          disabled={disabled}
          className="border border-gray-700 px-3 py-1 text-xs uppercase font-mono tracking-wider text-gray-400 transition-colors hover:border-cyan-400 hover:text-cyan-200 disabled:opacity-40"
        >
          {reply}
        </button>
      ))}
    </div>
  );
}

const QUICK_REPLIES = {
  start_project: ['Here is the rough idea', 'Challenge my assumptions', 'Why should anyone care?'],
  process_review: ['What is the weakest link?', 'What evidence is missing?', 'Be harsher'],
  final_review: ['Roast the weakest point', 'What breaks in the real world?', 'Be harsher'],
  venting_mode: ['One more vent', 'Back to the work'],
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

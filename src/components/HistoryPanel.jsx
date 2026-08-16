import { Book, PlusCircle, X } from 'lucide-react';

export default function HistoryPanel({
  threads,
  currentThreadId,
  onSelectThread,
  onNewChat,
  isOpen,
  setIsOpen,
}) {
  return (
    <>
      <div
        className={`fixed inset-0 bg-black/70 z-10 lg:hidden ${isOpen ? 'block' : 'hidden'}`}
        onClick={() => setIsOpen(false)}
      />
      <div
        className={`flex flex-col bg-[#090909] border-r border-[#6B6965] w-72 shrink-0 absolute lg:static inset-y-0 left-0 z-20 transform transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
      >
        <div className="p-4 border-b border-[#6B6965] flex justify-between items-center">
          <h2 className="font-semibold text-lg uppercase font-mono tracking-wider text-white">History</h2>
          <button onClick={() => setIsOpen(false)} className="p-1 text-[#C8C5BF] hover:text-white lg:hidden transition-colors">
            <X size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {threads.map((thread) => (
            <button
              key={thread.id}
              onClick={() => onSelectThread(thread.id)}
              className={`w-full text-left text-sm p-2 truncate font-mono transition-colors ${
                thread.id === currentThreadId
                  ? 'bg-[#00F1DE]/10 text-[#00F1DE] border-l-2 border-[#00F1DE]'
                  : 'text-[#C8C5BF] hover:bg-[#0f0f0f] hover:text-white'
              }`}
            >
              {thread.title}
            </button>
          ))}
        </div>
        <div className="p-2 border-t border-[#6B6965]">
          <button
            onClick={onNewChat}
            className="w-full flex items-center justify-center gap-2 text-sm p-2 text-[#00F1DE] hover:bg-[#00F1DE]/10 transition-colors uppercase font-mono tracking-wider border border-transparent hover:border-[#00F1DE]"
          >
            <PlusCircle size={16} /> New Chat
          </button>
        </div>
      </div>
    </>
  );
}

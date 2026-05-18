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
        className={`fixed inset-0 bg-black/60 z-10 lg:hidden ${isOpen ? 'block' : 'hidden'}`}
        onClick={() => setIsOpen(false)}
      />
      <div
        className={`flex flex-col bg-main border-r-2 border-main w-72 shrink-0 absolute lg:static inset-y-0 left-0 z-20 transform transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
      >
        <div className="p-4 border-b-2 border-main flex justify-between items-center">
          <h2 className="font-bold text-xl uppercase font-mono text-primary">History</h2>
          <button onClick={() => setIsOpen(false)} className="p-1 text-muted hover:text-primary lg:hidden">
            <X size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {threads.map((thread) => (
            <button
              key={thread.id}
              onClick={() => onSelectThread(thread.id)}
              className={`w-full text-left text-base p-2 truncate text-primary ${
                thread.id === currentThreadId ? 'bg-accent-subtle text-accent' : 'hover:bg-card'
              }`}
            >
              {thread.title}
            </button>
          ))}
        </div>
        <div className="p-2 border-t-2 border-main">
          <button
            onClick={onNewChat}
            className="w-full flex items-center justify-center gap-2 text-base p-2 text-accent hover:bg-accent-subtle transition-colors uppercase font-mono"
          >
            <PlusCircle size={16} /> New Chat
          </button>
        </div>
      </div>
    </>
  );
}

import { useEffect, useState } from 'react';
import { Award, Download, FileBadge } from 'lucide-react';
import {
  collectStageScoresFromThreads,
  downloadCertificate,
  listAllFlows,
  rankForAverage,
} from '../chatRuntime';

const THREAD_MAP_KEY = 'guru_user_threads';

function loadThreadsForUser(name) {
  try {
    const saved = localStorage.getItem(THREAD_MAP_KEY);
    const map = saved ? JSON.parse(saved) : {};
    const list = map && name ? map[name] : null;
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export default function CertificateCard({ thread, username }) {
  const [userThreads, setUserThreads] = useState([]);

  useEffect(() => {
    setUserThreads(loadThreadsForUser(username));
  }, [username, thread]);

  if (!thread || !thread.flow) return null;

  const flows = listAllFlows();
  const allStagesScoredAcrossFlows = flows.every((flow) =>
    userThreads.some((t) => {
      if (t.flow !== flow) return false;
      return t.messages.some(
        (m) => m.type === 'score_card' && typeof m.stageIndex === 'number'
      );
    })
  );

  if (!allStagesScoredAcrossFlows) return null;

  const scores = collectStageScoresFromThreads(userThreads, { username });
  if (scores.length === 0) return null;

  const average = scores.reduce((sum, s) => sum + s.score, 0) / scores.length;
  const rank = rankForAverage(average);

  const handleDownload = () => {
    downloadCertificate({ username, scores, rank, average });
  };

  return (
    <div className="my-6 border-2 border-[#00F1DE] bg-[#003D39]/40 p-5">
      <div className="flex items-center gap-2 text-[#00F1DE] uppercase font-mono text-[10px] tracking-[0.15em]">
        <FileBadge size={16} /> Design Ninja certificate ready
      </div>
      <p className="mt-2 text-sm text-[#EFEDE8]">
        All scored stages across every flow are complete. Download your dotai Design Ninja certificate,
        addressed to <span className="text-white font-semibold">{username || 'you'}</span>.
      </p>
      <div className="mt-3 flex items-center gap-3">
        <div className="inline-flex items-center gap-2 border border-[#FF00A8] px-3 py-1">
          <Award size={14} className="text-[#FF00A8]" />
          <span className="font-mono uppercase text-[11px] tracking-[0.18em] text-[#FF00A8]">{rank}</span>
        </div>
        <span className="text-xs font-mono text-[#C8C5BF]">
          Average {average.toFixed(1)} / 100 across {scores.length} stage(s)
        </span>
      </div>
      <button
        onClick={handleDownload}
        className="mt-4 group flex items-center gap-2 border border-white bg-[#F7F5F0] text-black px-4 py-2 text-sm uppercase font-mono transition-all hover:border-[#00F1DE] hover:shadow-[3px_3px_0_0_#00F1DE] clip-corner"
      >
        <Download size={16} /> Download Design Ninja certificate
      </button>
    </div>
  );
}

import { Download, FileBadge } from 'lucide-react';
import { downloadCertificate, getFlowStages } from '../chatRuntime';

export default function CertificateCard({ thread, username }) {
  if (!thread || !thread.flow) return null;

  const stages = getFlowStages(thread.flow);
  const scores = thread.messages
    .filter((message) => message.type === 'score_card' && typeof message.stageIndex === 'number')
    .sort((a, b) => a.stageIndex - b.stageIndex);

  const allStagesScored = stages.length > 0 && scores.length >= stages.length - 1;
  if (!allStagesScored) return null;

  const handleDownload = () => {
    const title = thread.title || 'Not a Guru Session';
    const scoreRows = scores.map((message) => ({
      stage: stages[message.stageIndex] || `Stage ${message.stageIndex + 1}`,
      score: message.score,
      rationale: message.rationale,
    }));

    downloadCertificate({ title, username, scores: scoreRows });
  };

  return (
    <div className="my-6 border-2 border-[#00F1DE] bg-[#003D39]/40 p-5">
      <div className="flex items-center gap-2 text-[#00F1DE] uppercase font-mono text-[10px] tracking-[0.15em]">
        <FileBadge size={16} /> Stage marksheet ready
      </div>
      <p className="mt-2 text-sm text-[#EFEDE8]">
        All scored stages are complete. Download your dotai marksheet as a certificate of this session.
      </p>
      <button
        onClick={handleDownload}
        className="mt-4 group flex items-center gap-2 border border-white bg-[#F7F5F0] text-black px-4 py-2 text-sm uppercase font-mono transition-all hover:border-[#00F1DE] hover:shadow-[3px_3px_0_0_#00F1DE] clip-corner"
      >
        <Download size={16} /> Download marksheet
      </button>
    </div>
  );
}

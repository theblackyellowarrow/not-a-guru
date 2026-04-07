export const PROCESS_REVIEW_FILES = [
  { key: 'problem_statement', label: 'Problem Statement', compulsory: true },
  { key: 'solution_statement', label: 'Solution Statement', compulsory: true },
  { key: 'stakeholder_map', label: 'Stakeholder Mapping' },
  { key: 'research_findings', label: 'Research Findings' },
  { key: 'primary_research', label: 'Primary Research Data' },
  { key: 'personas', label: 'Personas' },
  { key: 'empathy_map', label: 'Empathy Map' },
];

export const FINAL_REVIEW_FILES = [
  { key: 'problem_statement', label: 'Problem Statement', compulsory: true },
  { key: 'solution_statement', label: 'Solution Statement', compulsory: true },
  { key: 'persona', label: 'Persona', compulsory: true },
  { key: 'ideations', label: 'Ideations (Image)', isImage: true, compulsory: true },
  { key: 'final_output', label: 'Final Output (Image)', isImage: true, compulsory: true },
];

export function getRequiredFiles(flow) {
  return flow === 'final_review' ? FINAL_REVIEW_FILES : PROCESS_REVIEW_FILES;
}

export function getReviewPrompt(flow, stagedFiles) {
  const intro = `Right, you've submitted files for a ${flow.replace('_', ' ')}. I'll be looking at these documents:`;
  const fileList = Object.entries(stagedFiles)
    .map(([, file]) => `- ${file.label}: ${file.name}`)
    .join('\n');

  if (flow === 'final_review') {
    return `${intro}\n${fileList}\n\nI've attached the material. Trace the alignment between the framing, the persona, the ideation, and the final output before you critique the finish.`;
  }

  return `${intro}\n${fileList}\n\nI've attached the material. Start by tracing the why. How did the research directly shape the problem statement?`;
}

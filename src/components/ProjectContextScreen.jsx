import { Briefcase, Building, GraduationCap, School } from 'lucide-react';

const contexts = [
  { key: 'class_project', icon: School, label: 'Class Project' },
  { key: 'graduation_project', icon: GraduationCap, label: 'Graduation Project' },
  { key: 'freelance_project', icon: Briefcase, label: 'Freelance Project' },
  { key: 'company_work', icon: Building, label: 'Company Work' },
];

export default function ProjectContextScreen({ onSelectContext, onBack }) {
  return (
    <div className="bg-black text-gray-200 font-sans flex flex-col h-screen antialiased items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        <h1 className="text-3xl font-bold text-fuchsia-500 mb-2 uppercase font-mono">What&apos;s the context?</h1>
        <p className="text-gray-400 mb-8 text-lg">The stakes shift with context. Let&apos;s get specific.</p>
        <div className="space-y-4">
          {contexts.map(({ key, icon: Icon, label }) => (
            <button
              key={key}
              onClick={() => onSelectContext(key)}
              className="w-full flex items-center gap-4 p-4 bg-gray-900 border-2 border-gray-800 text-left hover:bg-fuchsia-900/50 hover:border-fuchsia-500 transition-all duration-200"
            >
              <span className="text-fuchsia-500">
                <Icon size={24} />
              </span>
              <span className="text-xl font-semibold uppercase font-mono">{label}</span>
            </button>
          ))}
        </div>
        <button onClick={onBack} className="mt-8 text-gray-400 hover:text-white uppercase font-mono">
          &larr; Back
        </button>
      </div>
    </div>
  );
}

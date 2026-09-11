import React, { useState, useEffect } from 'react';
import { X, BookHeart } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { fullName } from '../../lib/lineage';

interface Props {
  memberId: string;
  onClose: () => void;
}

interface SectionField {
  key:
    | 'professionalSummary' | 'earlyLifeBackground' | 'education' | 'careerJourney'
    | 'professionalAchievements' | 'communityContributions' | 'personalPhilosophy'
    | 'legacy' | 'personalLife';
  label: string;
  hint: string;
  rows: number;
}

const SECTIONS: SectionField[] = [
  { key: 'professionalSummary', label: '2. Professional Summary', rows: 3,
    hint: 'A short introduction explaining who they are, what they do, and what they are known for.' },
  { key: 'earlyLifeBackground', label: '3. Early Life & Background', rows: 4,
    hint: 'Family or community background, childhood influences, early interests. (Date/place of birth are set on their profile.)' },
  { key: 'education', label: '4. Education', rows: 3,
    hint: 'Primary/secondary education, college/university, degrees, certifications, special training.' },
  { key: 'careerJourney', label: '5. Career Journey', rows: 4,
    hint: 'Usually chronological: first job, major positions, organizations worked for, promotions or career changes, current position.' },
  { key: 'professionalAchievements', label: '6. Professional Achievements', rows: 4,
    hint: 'Major accomplishments, projects, awards, publications, innovations, important contributions.' },
  { key: 'communityContributions', label: '8. Community & Social Contributions', rows: 3,
    hint: 'Community service, mentorship, charitable work, organizations supported, contributions to society.' },
  { key: 'personalPhilosophy', label: '9. Personal Philosophy / Values', rows: 3,
    hint: 'Principles, beliefs about their profession, leadership philosophy, life lessons.' },
  { key: 'legacy', label: '10. Legacy', rows: 4,
    hint: 'What they want to be remembered for, knowledge to pass to younger generations, advice to future generations, their impact. Relatives can add their own memories below this in the Legacy tab.' },
  { key: 'personalLife', label: '11. Personal Life', rows: 4,
    hint: 'Family, hobbies, interests, personal achievements — only what they are comfortable making public.' },
];

export const BiographyEditorModal: React.FC<Props> = ({ memberId, onClose }) => {
  const { data, saveBiography } = useApp();
  const member = data.members.find(m => m.id === memberId);
  const existing = data.biographies.find(b => b.memberId === memberId);

  const [fields, setFields] = useState<Record<SectionField['key'], string>>({
    professionalSummary: existing?.professionalSummary ?? '',
    earlyLifeBackground: existing?.earlyLifeBackground ?? '',
    education: existing?.education ?? '',
    careerJourney: existing?.careerJourney ?? '',
    professionalAchievements: existing?.professionalAchievements ?? '',
    communityContributions: existing?.communityContributions ?? '',
    personalPhilosophy: existing?.personalPhilosophy ?? '',
    legacy: existing?.legacy ?? '',
    personalLife: existing?.personalLife ?? '',
  });
  const [expertiseInput, setExpertiseInput] = useState((existing?.areasOfExpertise ?? []).join(', '));

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const labelCls = "block text-sm font-medium text-heritage-green-900 dark:text-heritage-dark-text mb-1";
  const hintCls = "text-xs text-heritage-green-500 dark:text-heritage-dark-muted mb-1.5";
  const textareaCls = "w-full rounded-lg border border-heritage-cream-400 bg-white dark:bg-heritage-dark-hover dark:border-heritage-dark-border dark:text-heritage-dark-text px-3 py-2 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-heritage-gold-400 resize-y";

  const update = (key: SectionField['key'], value: string) => setFields(prev => ({ ...prev, [key]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const areasOfExpertise = expertiseInput.split(',').map(s => s.trim()).filter(Boolean);
    saveBiography(memberId, {
      professionalSummary: fields.professionalSummary.trim() || undefined,
      earlyLifeBackground: fields.earlyLifeBackground.trim() || undefined,
      education: fields.education.trim() || undefined,
      careerJourney: fields.careerJourney.trim() || undefined,
      professionalAchievements: fields.professionalAchievements.trim() || undefined,
      areasOfExpertise: areasOfExpertise.length ? areasOfExpertise : undefined,
      communityContributions: fields.communityContributions.trim() || undefined,
      personalPhilosophy: fields.personalPhilosophy.trim() || undefined,
      legacy: fields.legacy.trim() || undefined,
      personalLife: fields.personalLife.trim() || undefined,
    });
    onClose();
  };

  if (!member) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <form
        onSubmit={handleSubmit}
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto scrollbar-thin bg-white dark:bg-heritage-dark-card rounded-2xl shadow-soft-lg"
      >
        <div className="sticky top-0 bg-white dark:bg-heritage-dark-card flex items-center justify-between px-6 py-4 border-b border-heritage-cream-300 dark:border-heritage-dark-border z-10">
          <div className="flex items-center gap-2">
            <BookHeart size={18} className="text-heritage-gold-500" />
            <h2 className="font-serif text-lg text-heritage-green-900 dark:text-heritage-dark-text">
              {fullName(member)}'s Biography
            </h2>
          </div>
          <button type="button" onClick={onClose} className="text-heritage-green-600 dark:text-heritage-dark-muted hover:text-heritage-green-900">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <p className="text-sm text-heritage-green-600 dark:text-heritage-dark-muted -mt-1">
            You don't need every section filled in. Name, photo, professional title, organization, location and contact links
            live on their profile — click "Edit" on their profile page to update those.
          </p>

          {SECTIONS.map(section => (
            <div key={section.key}>
              <label className={labelCls}>{section.label}</label>
              <p className={hintCls}>{section.hint}</p>
              <textarea
                className={textareaCls}
                rows={section.rows}
                value={fields[section.key]}
                onChange={e => update(section.key, e.target.value)}
                placeholder="Write in your own words…"
              />
            </div>
          ))}

          <div>
            <label className={labelCls}>7. Areas of Expertise</label>
            <p className={hintCls}>e.g. Leadership, Technology, Law, Business, Education, Healthcare — separate with commas.</p>
            <input
              className={textareaCls}
              value={expertiseInput}
              onChange={e => setExpertiseInput(e.target.value)}
              placeholder="Leadership, Technology, Public Speaking"
            />
          </div>
        </div>

        <div className="sticky bottom-0 flex justify-end gap-2 px-6 py-4 border-t border-heritage-cream-300 dark:border-heritage-dark-border bg-white dark:bg-heritage-dark-card">
          <button type="button" onClick={onClose} className="px-3.5 py-2 text-sm rounded-lg border border-heritage-cream-400 text-heritage-green-700 dark:text-heritage-dark-muted">Cancel</button>
          <button type="submit" className="px-3.5 py-2 text-sm rounded-lg bg-heritage-green-800 hover:bg-heritage-green-700 text-white font-medium">
            Save Biography
          </button>
        </div>
      </form>
    </div>
  );
};

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
    | 'atAGlance' | 'earlyLifeFamily' | 'youngAdulthood' | 'marriageFamilyLife'
    | 'workAchievementsPassions' | 'storiesMemories' | 'laterYears' | 'legacy';
  label: string;
  hint: string;
  rows: number;
}

const SECTIONS: SectionField[] = [
  { key: 'atAGlance', label: '1. At a Glance', rows: 3,
    hint: 'A short introduction — full name/nicknames, birth & death dates, birthplace, and a sentence or two on who they were.' },
  { key: 'earlyLifeFamily', label: '2. Early Life & Family', rows: 4,
    hint: 'Parents & siblings, where they grew up, childhood circumstances, family traditions, schooling, early influences.' },
  { key: 'youngAdulthood', label: '3. Young Adulthood', rows: 4,
    hint: 'Education, first job or career, service, moving away, important friendships, the events happening around them.' },
  { key: 'marriageFamilyLife', label: '4. Marriage & Family Life', rows: 4,
    hint: 'How they met their spouse, marriage, children, where the family lived, family customs, their personality as a parent or grandparent.' },
  { key: 'workAchievementsPassions', label: '5. Work, Achievements & Passions', rows: 4,
    hint: 'Occupation and career, businesses started, community involvement, hobbies, faith or cultural traditions, talents, causes they cared about.' },
  { key: 'storiesMemories', label: '6. Stories & Memories', rows: 4,
    hint: 'Something funny they used to do, a memorable journey, a phrase they always said, a tradition they started.' },
  { key: 'laterYears', label: '7. Later Years', rows: 4,
    hint: 'Where they lived, retirement, grandchildren, important family occasions, continuing interests, major later events.' },
  { key: 'legacy', label: '8. Legacy', rows: 4,
    hint: 'What they passed on, values they were known for, traditions that continue, who they influenced. Relatives can add their own memories below this in the Legacy tab.' },
];

export const BiographyEditorModal: React.FC<Props> = ({ memberId, onClose }) => {
  const { data, saveBiography } = useApp();
  const member = data.members.find(m => m.id === memberId);
  const existing = data.biographies.find(b => b.memberId === memberId);

  const [fields, setFields] = useState<Record<SectionField['key'], string>>({
    atAGlance: existing?.atAGlance ?? '',
    earlyLifeFamily: existing?.earlyLifeFamily ?? '',
    youngAdulthood: existing?.youngAdulthood ?? '',
    marriageFamilyLife: existing?.marriageFamilyLife ?? '',
    workAchievementsPassions: existing?.workAchievementsPassions ?? '',
    storiesMemories: existing?.storiesMemories ?? '',
    laterYears: existing?.laterYears ?? '',
    legacy: existing?.legacy ?? '',
  });
  const [storiesTitle, setStoriesTitle] = useState(existing?.storiesMemoriesTitle ?? 'Stories We Remember');

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
    saveBiography(memberId, {
      atAGlance: fields.atAGlance.trim() || undefined,
      earlyLifeFamily: fields.earlyLifeFamily.trim() || undefined,
      youngAdulthood: fields.youngAdulthood.trim() || undefined,
      marriageFamilyLife: fields.marriageFamilyLife.trim() || undefined,
      workAchievementsPassions: fields.workAchievementsPassions.trim() || undefined,
      storiesMemoriesTitle: storiesTitle.trim() || 'Stories We Remember',
      storiesMemories: fields.storiesMemories.trim() || undefined,
      laterYears: fields.laterYears.trim() || undefined,
      legacy: fields.legacy.trim() || undefined,
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
            You don't need every section filled in, and you don't need to know whether every small detail is historically significant — personal details are what make this come alive.
          </p>

          {SECTIONS.map(section => (
            <div key={section.key}>
              <label className={labelCls}>{section.label}</label>
              <p className={hintCls}>{section.hint}</p>
              {section.key === 'storiesMemories' && (
                <input
                  className={`${textareaCls} mb-2`}
                  placeholder="Section title (e.g. \u201cStories We Remember\u201d or \u201cFamily Memories\u201d)"
                  value={storiesTitle}
                  onChange={e => setStoriesTitle(e.target.value)}
                />
              )}
              <textarea
                className={textareaCls}
                rows={section.rows}
                value={fields[section.key]}
                onChange={e => update(section.key, e.target.value)}
                placeholder="Write in your own words…"
              />
            </div>
          ))}
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

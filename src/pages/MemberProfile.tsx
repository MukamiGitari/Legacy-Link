import React, { useState } from 'react';
import { ArrowLeft, Edit3, MapPin, Briefcase, Calendar, BookHeart } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getLineage, fullName, lifespan } from '../lib/lineage';
import { canAddContent } from '../lib/permissions';
import { BiographyEditorModal } from '../components/members/BiographyEditorModal';
import { LegacyContributions } from '../components/members/LegacyContributions';

type Tab = 'about' | 'family' | 'photos' | 'memories' | 'events' | 'timeline';
const TABS: { key: Tab; label: string }[] = [
  { key: 'about', label: 'Biography' },
  { key: 'family', label: 'Family' },
  { key: 'photos', label: 'Tagged Photos' },
  { key: 'memories', label: 'Memories' },
  { key: 'events', label: 'Events' },
  { key: 'timeline', label: 'Timeline' },
];

interface Props {
  memberId: string;
  onBack: () => void;
  onSelectMember: (id: string) => void;
  onEdit: (id: string) => void;
}

export const MemberProfile: React.FC<Props> = ({ memberId, onBack, onSelectMember, onEdit }) => {
  const { data, currentProfile } = useApp();
  const [tab, setTab] = useState<Tab>('about');
  const [showBioEditor, setShowBioEditor] = useState(false);
  const member = data.members.find(m => m.id === memberId);
  const biography = data.biographies.find(b => b.memberId === memberId);
  const canEditBio = canAddContent(currentProfile?.role);
  if (!member) return <p className="text-sm text-heritage-green-500">Member not found.</p>;

  const lineage = getLineage(member.id, data.members, data.relationships);
  const taggedPhotos = data.photos.filter(p => p.taggedMemberIds.includes(member.id));
  const relatedMemories = data.memories.filter(mem => mem.authorMemberId === member.id || mem.relatedMemberIds.includes(member.id));
  const relatedEvents = data.events.filter(ev => ev.rsvps.some(r => r.memberId === member.id));

  const timelineEvents = [
    member.dateOfBirth && { date: member.dateOfBirth, label: `Born${member.birthPlace ? ` in ${member.birthPlace}` : ''}` },
    ...relatedMemories.map(mem => ({ date: mem.createdAt, label: `Memory shared: "${mem.title}"` })),
    member.dateOfPassing && { date: member.dateOfPassing, label: `Passed away${member.restingPlace ? `, resting at ${member.restingPlace}` : ''}` },
  ].filter((e): e is { date: string; label: string } => Boolean(e)).sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="space-y-6">
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-heritage-green-700 dark:text-heritage-dark-muted hover:text-heritage-green-900">
        <ArrowLeft size={16} /> Back
      </button>

      <div className="rounded-2xl border border-heritage-cream-400 dark:border-heritage-dark-border bg-white dark:bg-heritage-dark-card overflow-hidden">
        <div className="h-24 bg-gradient-to-r from-heritage-green-700 to-heritage-green-900" />
        <div className="px-6 pb-6 -mt-12">
          <div className="flex items-end justify-between flex-wrap gap-3">
            <img src={member.avatarUrl} className="w-24 h-24 rounded-full ring-4 ring-white dark:ring-heritage-dark-card bg-heritage-gold-100 shadow-soft" alt="" />
            <button
              onClick={() => onEdit(member.id)}
              className="flex items-center gap-1.5 text-sm border border-heritage-green-700 text-heritage-green-800 dark:text-heritage-dark-text px-3 py-1.5 rounded-lg hover:bg-heritage-cream-100 dark:hover:bg-heritage-dark-hover"
            >
              <Edit3 size={14} /> Edit
            </button>
          </div>
          <h2 className="font-serif text-2xl mt-3 text-heritage-green-900 dark:text-heritage-dark-text">{fullName(member)}</h2>
          {member.maidenName && <p className="text-sm text-heritage-green-500 dark:text-heritage-dark-muted">née {member.maidenName}</p>}
          <div className="flex flex-wrap gap-4 mt-3 text-sm text-heritage-green-700 dark:text-heritage-dark-muted">
            <span className="flex items-center gap-1.5"><Calendar size={14} className="text-heritage-gold-500" /> {lifespan(member)}</span>
            {member.birthPlace && <span className="flex items-center gap-1.5"><MapPin size={14} className="text-heritage-gold-500" /> {member.birthPlace}</span>}
            {member.occupation && <span className="flex items-center gap-1.5"><Briefcase size={14} className="text-heritage-gold-500" /> {member.occupation}</span>}
          </div>
        </div>

        <div className="flex overflow-x-auto scrollbar-thin border-t border-heritage-cream-300 dark:border-heritage-dark-border px-2">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors
                ${tab === t.key ? 'border-heritage-gold-500 text-heritage-green-900 dark:text-heritage-dark-text' : 'border-transparent text-heritage-green-500 dark:text-heritage-dark-muted hover:text-heritage-green-800'}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {tab === 'about' && (
            <div className="max-w-2xl space-y-7">
              <div className="flex items-start justify-between gap-3">
                <p className="text-xs text-heritage-green-500 dark:text-heritage-dark-muted">
                  {biography ? `Last updated ${new Date(biography.updatedAt).toLocaleDateString()}` : 'No biography has been written yet.'}
                </p>
                {canEditBio && (
                  <button
                    onClick={() => setShowBioEditor(true)}
                    className="flex items-center gap-1.5 text-xs shrink-0 border border-heritage-green-700 text-heritage-green-800 dark:text-heritage-dark-text px-2.5 py-1.5 rounded-lg hover:bg-heritage-cream-100 dark:hover:bg-heritage-dark-hover"
                  >
                    <BookHeart size={13} /> {biography ? 'Edit Biography' : 'Write Biography'}
                  </button>
                )}
              </div>

              {!biography && !member.bio && (
                <p className="text-sm text-heritage-green-400 dark:text-heritage-dark-muted">
                  {canEditBio
                    ? 'Nothing written yet — click "Write Biography" to start their story, section by section.'
                    : 'Nothing has been written for this person yet.'}
                </p>
              )}

              {!biography && member.bio && (
                <p className="text-sm leading-relaxed text-heritage-green-800 dark:text-heritage-dark-text">{member.bio}</p>
              )}

              {biography && (
                <>
                  {biography.atAGlance && (
                    <section>
                      <h3 className="font-serif text-lg text-heritage-green-900 dark:text-heritage-dark-text mb-2">At a Glance</h3>
                      <p className="text-sm leading-relaxed text-heritage-green-800 dark:text-heritage-dark-text whitespace-pre-line">{biography.atAGlance}</p>
                    </section>
                  )}
                  {biography.earlyLifeFamily && (
                    <section>
                      <h3 className="font-serif text-lg text-heritage-green-900 dark:text-heritage-dark-text mb-2">Early Life & Family</h3>
                      <p className="text-sm leading-relaxed text-heritage-green-800 dark:text-heritage-dark-text whitespace-pre-line">{biography.earlyLifeFamily}</p>
                    </section>
                  )}
                  {biography.youngAdulthood && (
                    <section>
                      <h3 className="font-serif text-lg text-heritage-green-900 dark:text-heritage-dark-text mb-2">Young Adulthood</h3>
                      <p className="text-sm leading-relaxed text-heritage-green-800 dark:text-heritage-dark-text whitespace-pre-line">{biography.youngAdulthood}</p>
                    </section>
                  )}
                  {biography.marriageFamilyLife && (
                    <section>
                      <h3 className="font-serif text-lg text-heritage-green-900 dark:text-heritage-dark-text mb-2">Marriage & Family Life</h3>
                      <p className="text-sm leading-relaxed text-heritage-green-800 dark:text-heritage-dark-text whitespace-pre-line">{biography.marriageFamilyLife}</p>
                    </section>
                  )}
                  {biography.workAchievementsPassions && (
                    <section>
                      <h3 className="font-serif text-lg text-heritage-green-900 dark:text-heritage-dark-text mb-2">Work, Achievements & Passions</h3>
                      <p className="text-sm leading-relaxed text-heritage-green-800 dark:text-heritage-dark-text whitespace-pre-line">{biography.workAchievementsPassions}</p>
                    </section>
                  )}
                  {biography.storiesMemories && (
                    <section>
                      <h3 className="font-serif text-lg text-heritage-green-900 dark:text-heritage-dark-text mb-2">
                        {biography.storiesMemoriesTitle || 'Stories We Remember'}
                      </h3>
                      <p className="text-sm leading-relaxed text-heritage-green-800 dark:text-heritage-dark-text whitespace-pre-line">{biography.storiesMemories}</p>
                    </section>
                  )}
                  {biography.laterYears && (
                    <section>
                      <h3 className="font-serif text-lg text-heritage-green-900 dark:text-heritage-dark-text mb-2">Later Years</h3>
                      <p className="text-sm leading-relaxed text-heritage-green-800 dark:text-heritage-dark-text whitespace-pre-line">{biography.laterYears}</p>
                    </section>
                  )}
                </>
              )}

              <section>
                <h3 className="font-serif text-lg text-heritage-green-900 dark:text-heritage-dark-text mb-2">Legacy</h3>
                {biography?.legacy && (
                  <p className="text-sm leading-relaxed text-heritage-green-800 dark:text-heritage-dark-text whitespace-pre-line mb-4">{biography.legacy}</p>
                )}
                <LegacyContributions memberId={member.id} />
              </section>
            </div>
          )}

          {showBioEditor && (
            <BiographyEditorModal memberId={member.id} onClose={() => setShowBioEditor(false)} />
          )}

          {tab === 'family' && (
            <div className="grid sm:grid-cols-2 gap-6">
              {([
                ['Parents', lineage.parents], ['Spouse', lineage.spouse],
                ['Children', lineage.children], ['Siblings', lineage.siblings],
              ] as const).map(([label, people]) => (
                <div key={label}>
                  <p className="text-xs uppercase tracking-wide text-heritage-green-500 mb-2">{label}</p>
                  {people.length === 0 && <p className="text-sm text-heritage-green-400">None recorded</p>}
                  <div className="space-y-1.5">
                    {people.map(p => (
                      <button key={p.id} onClick={() => onSelectMember(p.id)} className="w-full flex items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-heritage-cream-100 dark:hover:bg-heritage-dark-hover text-left">
                        <img src={p.avatarUrl} className="w-8 h-8 rounded-full bg-heritage-cream-200" alt="" />
                        <span className="text-sm text-heritage-green-900 dark:text-heritage-dark-text">{fullName(p)}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === 'photos' && (
            taggedPhotos.length === 0 ? <p className="text-sm text-heritage-green-400">No tagged photos yet.</p> : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {taggedPhotos.map(p => (
                  <div key={p.id} className="rounded-lg overflow-hidden border border-heritage-cream-300 dark:border-heritage-dark-border">
                    <img src={p.url} className="w-full h-32 object-cover" alt={p.caption ?? ''} />
                    {p.caption && <p className="text-xs p-2 text-heritage-green-700 dark:text-heritage-dark-muted">{p.caption}</p>}
                  </div>
                ))}
              </div>
            )
          )}

          {tab === 'memories' && (
            relatedMemories.length === 0 ? <p className="text-sm text-heritage-green-400">No memories linked yet.</p> : (
              <div className="space-y-4">
                {relatedMemories.map(mem => (
                  <div key={mem.id} className="border-l-2 border-heritage-gold-300 pl-3">
                    <p className="text-sm font-medium text-heritage-green-900 dark:text-heritage-dark-text">{mem.title}</p>
                    <p className="text-sm text-heritage-green-600 dark:text-heritage-dark-muted mt-0.5">{mem.body}</p>
                  </div>
                ))}
              </div>
            )
          )}

          {tab === 'events' && (
            relatedEvents.length === 0 ? <p className="text-sm text-heritage-green-400">No event RSVPs yet.</p> : (
              <div className="space-y-2">
                {relatedEvents.map(ev => (
                  <div key={ev.id} className="flex items-center justify-between rounded-lg border border-heritage-cream-300 dark:border-heritage-dark-border px-3 py-2">
                    <div>
                      <p className="text-sm font-medium text-heritage-green-900 dark:text-heritage-dark-text">{ev.title}</p>
                      <p className="text-xs text-heritage-green-500 dark:text-heritage-dark-muted">{new Date(ev.startsAt).toLocaleDateString()}</p>
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-heritage-green-100 text-heritage-green-700 capitalize">
                      {ev.rsvps.find(r => r.memberId === member.id)?.status}
                    </span>
                  </div>
                ))}
              </div>
            )
          )}

          {tab === 'timeline' && (
            timelineEvents.length === 0 ? <p className="text-sm text-heritage-green-400">No timeline entries yet.</p> : (
              <div className="space-y-4">
                {timelineEvents.map((e, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <span className="w-2.5 h-2.5 rounded-full bg-heritage-gold-500" />
                      {i < timelineEvents.length - 1 && <span className="w-px flex-1 bg-heritage-cream-300 dark:bg-heritage-dark-border" />}
                    </div>
                    <div className="pb-4">
                      <p className="text-xs text-heritage-green-500">{new Date(e.date).toLocaleDateString()}</p>
                      <p className="text-sm text-heritage-green-800 dark:text-heritage-dark-text">{e.label}</p>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};

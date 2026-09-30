import React, { useState } from 'react';
import { ArrowLeft, Edit3, MapPin, Briefcase, Calendar, BookHeart, Building2, Link as LinkIcon, PawPrint } from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  getLineage, fullName, lifespan,
  getParents, getFullSiblings, getHalfSiblings, WIFE_COLORS, getWifeLabel,
  isMarriedIn, getDerivedInLawRelationships
} from '../lib/lineage';
import { canAddContent } from '../lib/permissions';
import { BiographyEditorModal } from '../components/members/BiographyEditorModal';
import { LegacyContributions } from '../components/members/LegacyContributions';
import type { Member } from '../types';

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
        <div className="h-24 bg-linear-to-r from-heritage-green-700 to-heritage-green-900" />
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
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <h2 className="font-serif text-2xl text-heritage-green-900 dark:text-heritage-dark-text">{fullName(member)}</h2>
            {isMarriedIn(member.id, data.members, data.relationships) && (
              <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200 border border-amber-300 dark:border-amber-800 flex items-center gap-1">
                💍 Married In
              </span>
            )}
          </div>
          {member.maidenName && <p className="text-sm text-heritage-green-500 dark:text-heritage-dark-muted">née {member.maidenName}</p>}
          {member.namedAfter && (
            <p className="text-sm text-heritage-green-600 dark:text-heritage-dark-muted flex items-center gap-1.5 mt-0.5">
              <span title="Name origin">🪶</span>
              <span>Named after <span className="font-medium text-heritage-green-800 dark:text-heritage-dark-text">{member.namedAfter}</span></span>
            </p>
          )}
          {member.professionalTitle && (
            <p className="text-sm text-heritage-green-700 dark:text-heritage-dark-muted mt-0.5">
              {member.professionalTitle}{member.currentOrganization ? ` at ${member.currentOrganization}` : ''}
            </p>
          )}
          <div className="flex flex-wrap gap-4 mt-3 text-sm text-heritage-green-700 dark:text-heritage-dark-muted">
            <span className="flex items-center gap-1.5"><Calendar size={14} className="text-heritage-gold-500" /> {lifespan(member)}</span>
            {member.birthPlace && <span className="flex items-center gap-1.5"><MapPin size={14} className="text-heritage-gold-500" /> {member.birthPlace}</span>}
            {member.occupation && <span className="flex items-center gap-1.5"><Briefcase size={14} className="text-heritage-gold-500" /> {member.occupation}</span>}
            {member.location && <span className="flex items-center gap-1.5"><Building2 size={14} className="text-heritage-gold-500" /> {member.location}</span>}
            {member.hasPet && (
              <span className="flex items-center gap-1.5"><PawPrint size={14} className="text-heritage-gold-500" /> {member.petName || 'Has a pet'}</span>
            )}
          </div>
          {member.contactLinks && (
            <div className="flex flex-wrap gap-3 mt-2 text-sm">
              {member.contactLinks.split('\n').map(s => s.trim()).filter(Boolean).map((link, i) => (
                <a
                  key={i}
                  href={/^https?:\/\//.test(link) ? link : `https://${link}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-heritage-green-700 dark:text-heritage-dark-muted hover:text-heritage-gold-600 underline underline-offset-2"
                >
                  <LinkIcon size={12} /> {link}
                </a>
              ))}
            </div>
          )}
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
                  {biography.professionalSummary && (
                    <section>
                      <h3 className="font-serif text-lg text-heritage-green-900 dark:text-heritage-dark-text mb-2">Professional Summary</h3>
                      <p className="text-sm leading-relaxed text-heritage-green-800 dark:text-heritage-dark-text whitespace-pre-line">{biography.professionalSummary}</p>
                    </section>
                  )}
                  {biography.earlyLifeBackground && (
                    <section>
                      <h3 className="font-serif text-lg text-heritage-green-900 dark:text-heritage-dark-text mb-2">Early Life & Background</h3>
                      <p className="text-sm leading-relaxed text-heritage-green-800 dark:text-heritage-dark-text whitespace-pre-line">{biography.earlyLifeBackground}</p>
                    </section>
                  )}
                  {biography.education && (
                    <section>
                      <h3 className="font-serif text-lg text-heritage-green-900 dark:text-heritage-dark-text mb-2">Education</h3>
                      <p className="text-sm leading-relaxed text-heritage-green-800 dark:text-heritage-dark-text whitespace-pre-line">{biography.education}</p>
                    </section>
                  )}
                  {biography.careerJourney && (
                    <section>
                      <h3 className="font-serif text-lg text-heritage-green-900 dark:text-heritage-dark-text mb-2">Career Journey</h3>
                      <p className="text-sm leading-relaxed text-heritage-green-800 dark:text-heritage-dark-text whitespace-pre-line">{biography.careerJourney}</p>
                    </section>
                  )}
                  {biography.professionalAchievements && (
                    <section>
                      <h3 className="font-serif text-lg text-heritage-green-900 dark:text-heritage-dark-text mb-2">Professional Achievements</h3>
                      <p className="text-sm leading-relaxed text-heritage-green-800 dark:text-heritage-dark-text whitespace-pre-line">{biography.professionalAchievements}</p>
                    </section>
                  )}
                  {biography.areasOfExpertise && biography.areasOfExpertise.length > 0 && (
                    <section>
                      <h3 className="font-serif text-lg text-heritage-green-900 dark:text-heritage-dark-text mb-2">Areas of Expertise</h3>
                      <div className="flex flex-wrap gap-2">
                        {biography.areasOfExpertise.map((area, i) => (
                          <span key={i} className="text-xs px-2.5 py-1 rounded-full bg-heritage-gold-100 text-heritage-green-800 dark:bg-heritage-dark-hover dark:text-heritage-dark-text">
                            {area}
                          </span>
                        ))}
                      </div>
                    </section>
                  )}
                  {biography.communityContributions && (
                    <section>
                      <h3 className="font-serif text-lg text-heritage-green-900 dark:text-heritage-dark-text mb-2">Community & Social Contributions</h3>
                      <p className="text-sm leading-relaxed text-heritage-green-800 dark:text-heritage-dark-text whitespace-pre-line">{biography.communityContributions}</p>
                    </section>
                  )}
                  {biography.personalPhilosophy && (
                    <section>
                      <h3 className="font-serif text-lg text-heritage-green-900 dark:text-heritage-dark-text mb-2">Personal Philosophy / Values</h3>
                      <p className="text-sm leading-relaxed text-heritage-green-800 dark:text-heritage-dark-text whitespace-pre-line">{biography.personalPhilosophy}</p>
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

              {biography?.personalLife && (
                <section>
                  <h3 className="font-serif text-lg text-heritage-green-900 dark:text-heritage-dark-text mb-2">Personal Life</h3>
                  <p className="text-sm leading-relaxed text-heritage-green-800 dark:text-heritage-dark-text whitespace-pre-line">{biography.personalLife}</p>
                </section>
              )}
            </div>
          )}

          {showBioEditor && (
            <BiographyEditorModal memberId={member.id} onClose={() => setShowBioEditor(false)} />
          )}

          {tab === 'family' && (() => {
            const fullSibs = getFullSiblings(member.id, data.relationships)
              .map(id => data.members.find(m => m.id === id))
              .filter((m): m is Member => Boolean(m));
            const halfSibs = getHalfSiblings(member.id, data.relationships)
              .map(id => data.members.find(m => m.id === id))
              .filter((m): m is Member => Boolean(m));

            return (
              <div className="space-y-8">
                <div className="grid sm:grid-cols-2 gap-6">
                  {/* Parents */}
                  <div>
                    <p className="text-xs uppercase tracking-wide text-heritage-green-500 mb-2">Parents</p>
                    {lineage.parents.length === 0 && <p className="text-sm text-heritage-green-400">None recorded</p>}
                    <div className="space-y-1.5">
                      {lineage.parents.map(p => (
                        <button key={p.id} onClick={() => onSelectMember(p.id)} className="w-full flex items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-heritage-cream-100 dark:hover:bg-heritage-dark-hover text-left">
                          <img src={p.avatarUrl} className="w-8 h-8 rounded-full bg-heritage-cream-200" alt="" />
                          <span className="text-sm text-heritage-green-900 dark:text-heritage-dark-text">{fullName(p)}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Spouses / Wives */}
                  <div>
                    <p className="text-xs uppercase tracking-wide text-heritage-green-500 mb-2">
                      {lineage.spouse.length > 1 ? `Spouses / Wives (${lineage.spouse.length})` : 'Spouse'}
                    </p>
                    {lineage.spouse.length === 0 && <p className="text-sm text-heritage-green-400">None recorded</p>}
                    <div className="space-y-2">
                      {lineage.spouse.map((s, idx) => {
                        const spouseRel = data.relationships.find(
                          r => r.relationshipType === 'spouse' &&
                            ((r.fromMemberId === member.id && r.toMemberId === s.id) || (r.fromMemberId === s.id && r.toMemberId === member.id))
                        );
                        const color = WIFE_COLORS[idx % WIFE_COLORS.length];
                        const label = getWifeLabel(idx, s, spouseRel, lineage.spouse.length);
                        const mDate = spouseRel?.startedAt ? new Date(spouseRel.startedAt).getFullYear() : null;

                        return (
                          <button
                            key={s.id}
                            onClick={() => onSelectMember(s.id)}
                            className="w-full flex items-center gap-2.5 rounded-lg px-2.5 py-2 hover:bg-heritage-cream-100 dark:hover:bg-heritage-dark-hover text-left border border-heritage-cream-300 dark:border-heritage-dark-border"
                          >
                            <img
                              src={s.avatarUrl}
                              className="w-8 h-8 rounded-full shrink-0 border-2"
                              style={{ borderColor: color.ring }}
                              alt=""
                            />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-sm font-medium text-heritage-green-900 dark:text-heritage-dark-text">{fullName(s)}</span>
                                <span
                                  className="text-[10px] font-semibold px-1.5 py-0.2 rounded-full border"
                                  style={{ backgroundColor: color.bg, color: color.text, borderColor: color.border }}
                                >
                                  {label}
                                </span>
                              </div>
                              <p className="text-xs text-heritage-green-500 dark:text-heritage-dark-muted">
                                {lifespan(s)}{mDate ? ` · m. ${mDate}` : ''}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Children */}
                  <div>
                    <p className="text-xs uppercase tracking-wide text-heritage-green-500 mb-2">Children</p>
                    {lineage.children.length === 0 && <p className="text-sm text-heritage-green-400">None recorded</p>}
                    <div className="space-y-1.5">
                      {lineage.children.map(p => {
                        const otherParentId = getParents(p.id, data.relationships).find(id => id !== member.id);
                        const otherParent = otherParentId ? data.members.find(m => m.id === otherParentId) : null;
                        const wifeIdx = otherParent ? lineage.spouse.findIndex(s => s.id === otherParent.id) : -1;
                        const wifeColor = wifeIdx >= 0 ? WIFE_COLORS[wifeIdx % WIFE_COLORS.length] : undefined;

                        return (
                          <button key={p.id} onClick={() => onSelectMember(p.id)} className="w-full flex items-center justify-between gap-2.5 rounded-lg px-2 py-1.5 hover:bg-heritage-cream-100 dark:hover:bg-heritage-dark-hover text-left">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <img src={p.avatarUrl} className="w-8 h-8 rounded-full bg-heritage-cream-200 shrink-0" alt="" />
                              <span className="text-sm text-heritage-green-900 dark:text-heritage-dark-text truncate">{fullName(p)}</span>
                            </div>
                            {otherParent && wifeColor && (
                              <span
                                className="text-[10px] font-medium px-1.5 py-0.2 rounded-full border shrink-0"
                                style={{ backgroundColor: wifeColor.bg, color: wifeColor.text, borderColor: wifeColor.border }}
                              >
                                Mother: {otherParent.firstName}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Siblings */}
                  <div>
                    <p className="text-xs uppercase tracking-wide text-heritage-green-500 mb-2">
                      {halfSibs.length > 0 ? 'Full Siblings' : 'Siblings'}
                    </p>
                    {fullSibs.length === 0 && <p className="text-sm text-heritage-green-400">None recorded</p>}
                    <div className="space-y-1.5">
                      {fullSibs.map(p => (
                        <button key={p.id} onClick={() => onSelectMember(p.id)} className="w-full flex items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-heritage-cream-100 dark:hover:bg-heritage-dark-hover text-left">
                          <img src={p.avatarUrl} className="w-8 h-8 rounded-full bg-heritage-cream-200" alt="" />
                          <span className="text-sm text-heritage-green-900 dark:text-heritage-dark-text">{fullName(p)}</span>
                        </button>
                      ))}
                    </div>

                    {halfSibs.length > 0 && (
                      <div className="mt-4">
                        <p className="text-xs uppercase tracking-wide text-heritage-green-500 mb-1">Half-Siblings ({halfSibs.length})</p>
                        <p className="text-[11px] text-heritage-green-600 dark:text-heritage-dark-muted mb-2 italic">Shares one parent with {member.firstName}</p>
                        <div className="space-y-1.5">
                          {halfSibs.map(p => {
                            const pParents = getParents(p.id, data.relationships);
                            const myParents = getParents(member.id, data.relationships);
                            const otherParent = data.members.find(m => !myParents.includes(m.id) && pParents.includes(m.id));

                            return (
                              <button key={p.id} onClick={() => onSelectMember(p.id)} className="w-full flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 hover:bg-heritage-cream-100 dark:hover:bg-heritage-dark-hover text-left">
                                <div className="flex items-center gap-2 min-w-0">
                                  <img src={p.avatarUrl} className="w-8 h-8 rounded-full bg-heritage-cream-200 shrink-0" alt="" />
                                  <span className="text-sm text-heritage-green-900 dark:text-heritage-dark-text truncate">{fullName(p)}</span>
                                </div>
                                {otherParent && (
                                  <span className="text-[10px] text-heritage-green-500 dark:text-heritage-dark-muted shrink-0">
                                    Parent: {otherParent.firstName}
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* In-Laws Section (Parents-in-law & Siblings-in-law per spouse) */}
                {lineage.spouse.length > 0 && (
                  <div className="border-t border-heritage-cream-300 dark:border-heritage-dark-border pt-6">
                    <h3 className="font-serif text-base text-heritage-green-900 dark:text-heritage-dark-text mb-4">
                      In-Law Connections
                    </h3>
                    <div className="grid sm:grid-cols-2 gap-6">
                      {lineage.spouse.map((s, idx) => {
                        const inLawParents = getParents(s.id, data.relationships)
                          .map(id => data.members.find(m => m.id === id))
                          .filter((m): m is Member => Boolean(m));
                        const inLawSiblings = getFullSiblings(s.id, data.relationships)
                          .map(id => data.members.find(m => m.id === id))
                          .filter((m): m is Member => Boolean(m));
                        const color = WIFE_COLORS[idx % WIFE_COLORS.length];

                        if (inLawParents.length === 0 && inLawSiblings.length === 0) return null;

                        return (
                          <div
                            key={s.id}
                            className="p-4 rounded-xl border bg-white dark:bg-heritage-dark-card space-y-3"
                            style={{ borderColor: color.border }}
                          >
                            <div className="flex items-center gap-2">
                              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color.ring }} />
                              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: color.text }}>
                                {s.firstName}'s Family (In-Laws)
                              </p>
                            </div>

                            {inLawParents.length > 0 && (
                              <div>
                                <p className="text-[11px] text-heritage-green-600 dark:text-heritage-dark-muted font-medium mb-1">
                                  Parents-in-law ({s.firstName}'s parents)
                                </p>
                                <div className="space-y-1">
                                  {inLawParents.map(p => (
                                    <button key={p.id} onClick={() => onSelectMember(p.id)} className="w-full flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 hover:bg-heritage-cream-100 dark:hover:bg-heritage-dark-hover text-left">
                                      <div className="flex items-center gap-2 min-w-0">
                                        <img src={p.avatarUrl} className="w-7 h-7 rounded-full bg-heritage-cream-200 shrink-0" alt="" />
                                        <span className="text-sm text-heritage-green-900 dark:text-heritage-dark-text truncate">{fullName(p)}</span>
                                      </div>
                                      <span className="text-[10px] font-medium px-1.5 py-0.2 rounded-full border bg-amber-50 text-amber-900 border-amber-300 dark:bg-amber-950 dark:text-amber-200 dark:border-amber-800 shrink-0">
                                        {p.gender === 'male' ? 'Father-in-law' : p.gender === 'female' ? 'Mother-in-law' : 'Parent-in-law'}
                                      </span>
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}

                            {inLawSiblings.length > 0 && (
                              <div>
                                <p className="text-[11px] text-heritage-green-600 dark:text-heritage-dark-muted font-medium mb-1">
                                  Siblings-in-law ({s.firstName}'s siblings)
                                </p>
                                <div className="space-y-1">
                                  {inLawSiblings.map(p => (
                                    <button key={p.id} onClick={() => onSelectMember(p.id)} className="w-full flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 hover:bg-heritage-cream-100 dark:hover:bg-heritage-dark-hover text-left">
                                      <div className="flex items-center gap-2 min-w-0">
                                        <img src={p.avatarUrl} className="w-7 h-7 rounded-full bg-heritage-cream-200 shrink-0" alt="" />
                                        <span className="text-sm text-heritage-green-900 dark:text-heritage-dark-text truncate">{fullName(p)}</span>
                                      </div>
                                      <span className="text-[10px] font-medium px-1.5 py-0.2 rounded-full border bg-amber-50 text-amber-900 border-amber-300 dark:bg-amber-950 dark:text-amber-200 dark:border-amber-800 shrink-0">
                                        {p.gender === 'male' ? 'Brother-in-law' : p.gender === 'female' ? 'Sister-in-law' : 'Sibling-in-law'}
                                      </span>
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

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

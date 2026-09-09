import React, { useState } from 'react';
import { Users, TreePine, Wand2, History, Copy, Check, ShieldAlert, type LucideIcon } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { TreeTemplateSwitcher } from '../components/trees/TreeTemplateSwitcher';
import type { Role, TreeTemplate } from '../types';

type AdminTab = 'users' | 'templates' | 'onboarding' | 'audit';

const ROLE_LABEL: Record<Role, string> = {
  super_admin: 'Super Admin',
  family_admin: 'Family Admin',
  family_member: 'Family Member',
  guest: 'Guest',
};

const ONBOARDING_STEPS = [
  { title: 'Welcome', body: 'Introduce the new family administrator to Legacy Link and what they\'ll be setting up.' },
  { title: 'Family Details', body: 'Set the family name, motto, and origin story that appears on the dashboard.' },
  { title: 'Root Ancestors', body: 'Add the earliest known ancestors to anchor the family tree.' },
  { title: 'Add Generations', body: 'Build out children, spouses, and grandchildren generation by generation.' },
  { title: 'Choose a Tree Template', body: 'Pick one of the six visual styles — it can be changed anytime.' },
  { title: 'Upload Photos', body: 'Create the first albums and upload founding photographs.' },
  { title: 'Invite the Family', body: 'Generate invitation codes so relatives can join and add their own branches.' },
  { title: 'Go Live', body: 'Review everything and publish the archive for the whole family.' },
];

export const Admin: React.FC = () => {
  const { data, setActiveTreeTemplate, updateProfileRole, generateInvitationCode, resetToSeed } = useApp();
  const [tab, setTab] = useState<AdminTab>('users');
  const [pendingTemplate, setPendingTemplate] = useState<TreeTemplate | null>(null);
  const [wizardStep, setWizardStep] = useState(0);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteRole, setInviteRole] = useState<Role>('family_member');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const TABS: { key: AdminTab; label: string; icon: LucideIcon }[] = [
    { key: 'users', label: 'User Management', icon: Users },
    { key: 'templates', label: 'Tree Templates', icon: TreePine },
    { key: 'onboarding', label: 'Onboarding Wizard', icon: Wand2 },
    { key: 'audit', label: 'Activity Log', icon: History },
  ];

  const confirmTemplateSwitch = () => {
    if (pendingTemplate) setActiveTreeTemplate(pendingTemplate);
    setPendingTemplate(null);
  };

  const submitInvite = (e: React.FormEvent) => {
    e.preventDefault();
    generateInvitationCode(inviteRole as Exclude<Role, 'super_admin'>);
    setCopiedCode(null);
    setInviteRole('family_member'); setShowInviteForm(false);
  };

  const latestCode = data.invitationCodes[data.invitationCodes.length - 1];

  return (
    <div className="space-y-6">
      <div className="flex overflow-x-auto scrollbar-thin gap-1 bg-heritage-cream-200 dark:bg-heritage-dark-hover rounded-xl p-1">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors
              ${tab === key ? 'bg-white dark:bg-heritage-dark-card text-heritage-green-900 dark:text-heritage-dark-text shadow-soft' : 'text-heritage-green-600 dark:text-heritage-dark-muted'}`}
          >
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>

      {tab === 'users' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-heritage-green-600 dark:text-heritage-dark-muted">Manage who can view and edit the family archive.</p>
            <button onClick={() => setShowInviteForm(s => !s)} className="text-sm bg-heritage-green-800 hover:bg-heritage-green-700 text-white font-medium px-3.5 py-2 rounded-lg">
              Generate Invitation
            </button>
          </div>

          {showInviteForm && (
            <form onSubmit={submitInvite} className="rounded-xl border border-heritage-cream-400 dark:border-heritage-dark-border bg-white dark:bg-heritage-dark-card p-5 space-y-3">
              <p className="text-xs text-heritage-green-500 dark:text-heritage-dark-muted">
                Generate a code and share it with the relative you're inviting — they'll enter it when creating their account, which sets their role automatically.
              </p>
              <div className="grid sm:grid-cols-2 gap-3 items-end">
                <div>
                  <label className="block text-xs font-medium text-heritage-green-700 dark:text-heritage-dark-muted mb-1">Role for this invite</label>
                  <select value={inviteRole} onChange={e => setInviteRole(e.target.value as Role)} className="w-full rounded-lg border border-heritage-cream-400 dark:border-heritage-dark-border dark:bg-heritage-dark-hover dark:text-heritage-dark-text px-3 py-2 text-sm">
                    <option value="family_admin">Family Admin</option>
                    <option value="family_member">Family Member</option>
                    <option value="guest">Guest</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setShowInviteForm(false)} className="px-3.5 py-2 text-sm rounded-lg border border-heritage-cream-400 text-heritage-green-700 dark:text-heritage-dark-muted">Cancel</button>
                <button type="submit" className="px-3.5 py-2 text-sm rounded-lg bg-heritage-green-800 text-white font-medium">Generate code</button>
              </div>
            </form>
          )}

          {latestCode && (
            <div className="flex items-center gap-3 rounded-lg border border-heritage-gold-300 bg-heritage-gold-50 px-4 py-3">
              <p className="text-sm text-heritage-gold-800">Invitation code: <span className="font-mono font-semibold">{latestCode.code}</span></p>
              <button
                onClick={() => { navigator.clipboard?.writeText(latestCode.code); setCopiedCode(latestCode.code); }}
                className="ml-auto flex items-center gap-1 text-xs text-heritage-gold-700 hover:text-heritage-gold-900"
              >
                {copiedCode === latestCode.code ? <Check size={13} /> : <Copy size={13} />}
                {copiedCode === latestCode.code ? 'Copied' : 'Copy'}
              </button>
            </div>
          )}

          <div className="rounded-xl border border-heritage-cream-400 dark:border-heritage-dark-border bg-white dark:bg-heritage-dark-card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-heritage-green-500 dark:text-heritage-dark-muted border-b border-heritage-cream-300 dark:border-heritage-dark-border">
                  <th className="px-4 py-2.5 font-medium">Name</th>
                  <th className="px-4 py-2.5 font-medium hidden sm:table-cell">Email</th>
                  <th className="px-4 py-2.5 font-medium">Role</th>
                </tr>
              </thead>
              <tbody>
                {data.profiles.map(p => (
                  <tr key={p.id} className="border-b last:border-0 border-heritage-cream-200 dark:border-heritage-dark-border">
                    <td className="px-4 py-2.5 font-medium text-heritage-green-900 dark:text-heritage-dark-text">{p.displayName}</td>
                    <td className="px-4 py-2.5 text-heritage-green-600 dark:text-heritage-dark-muted hidden sm:table-cell">{p.email ?? '—'}</td>
                    <td className="px-4 py-2.5">
                      <select
                        value={p.role}
                        onChange={e => updateProfileRole(p.id, e.target.value as Role)}
                        className="text-xs rounded-lg border border-heritage-cream-400 dark:border-heritage-dark-border dark:bg-heritage-dark-hover dark:text-heritage-dark-text px-2 py-1"
                      >
                        {(Object.keys(ROLE_LABEL) as Role[]).map(r => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'templates' && (
        <div className="space-y-4">
          <p className="text-sm text-heritage-green-600 dark:text-heritage-dark-muted">
            Choose the default tree style every family member sees first. Current: <span className="font-medium capitalize">{data.family.activeTreeTemplate}</span>
          </p>
          <TreeTemplateSwitcher active={data.family.activeTreeTemplate} onChange={setPendingTemplate} />

          {pendingTemplate && pendingTemplate !== data.family.activeTreeTemplate && (
            <div className="rounded-xl border border-heritage-gold-300 bg-heritage-gold-50 p-4 flex items-start gap-3">
              <ShieldAlert size={18} className="text-heritage-gold-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-heritage-gold-800">
                  Switch the family's default tree to <span className="font-semibold capitalize">{pendingTemplate}</span>? All members will see this style when they open the Family Tree page.
                </p>
                <div className="flex gap-2 mt-3">
                  <button onClick={confirmTemplateSwitch} className="text-xs px-3 py-1.5 rounded-lg bg-heritage-green-800 text-white font-medium">Confirm switch</button>
                  <button onClick={() => setPendingTemplate(null)} className="text-xs px-3 py-1.5 rounded-lg border border-heritage-gold-400 text-heritage-gold-800">Cancel</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'onboarding' && (
        <div className="rounded-xl border border-heritage-cream-400 dark:border-heritage-dark-border bg-white dark:bg-heritage-dark-card p-6">
          <p className="text-sm text-heritage-green-600 dark:text-heritage-dark-muted mb-5">
            Walk a new family administrator through setting up their archive from scratch.
          </p>
          <div className="flex items-center gap-1.5 mb-6 flex-wrap">
            {ONBOARDING_STEPS.map((s, i) => (
              <button
                key={s.title}
                onClick={() => setWizardStep(i)}
                className={`w-7 h-7 rounded-full text-xs font-semibold flex items-center justify-center
                  ${i === wizardStep ? 'bg-heritage-green-800 text-white' : i < wizardStep ? 'bg-heritage-green-100 text-heritage-green-700' : 'bg-heritage-cream-200 text-heritage-green-500 dark:bg-heritage-dark-hover'}`}
              >
                {i + 1}
              </button>
            ))}
          </div>
          <div className="max-w-md">
            <p className="text-xs uppercase tracking-wide text-heritage-gold-600">Step {wizardStep + 1} of {ONBOARDING_STEPS.length}</p>
            <h3 className="font-serif text-xl text-heritage-green-900 dark:text-heritage-dark-text mt-1">{ONBOARDING_STEPS[wizardStep].title}</h3>
            <p className="text-sm text-heritage-green-700 dark:text-heritage-dark-muted mt-2 leading-relaxed">{ONBOARDING_STEPS[wizardStep].body}</p>
            <div className="flex gap-2 mt-5">
              <button
                disabled={wizardStep === 0}
                onClick={() => setWizardStep(s => Math.max(0, s - 1))}
                className="px-3.5 py-2 text-sm rounded-lg border border-heritage-cream-400 text-heritage-green-700 dark:text-heritage-dark-muted disabled:opacity-40"
              >
                Back
              </button>
              <button
                disabled={wizardStep === ONBOARDING_STEPS.length - 1}
                onClick={() => setWizardStep(s => Math.min(ONBOARDING_STEPS.length - 1, s + 1))}
                className="px-3.5 py-2 text-sm rounded-lg bg-heritage-green-800 text-white font-medium disabled:opacity-40"
              >
                Next step
              </button>
            </div>
          </div>
        </div>
      )}

      {tab === 'audit' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-heritage-green-600 dark:text-heritage-dark-muted">Real-time record of changes made to this archive.</p>
            <button onClick={() => { if (confirm('Reset all data back to the original seeded family? This discards any local changes.')) resetToSeed(); }} className="text-xs text-red-600 hover:text-red-800">
              Reset to seed data
            </button>
          </div>
          <div className="rounded-xl border border-heritage-cream-400 dark:border-heritage-dark-border bg-white dark:bg-heritage-dark-card divide-y divide-heritage-cream-200 dark:divide-heritage-dark-border">
            {data.auditLog.map(entry => (
              <div key={entry.id} className="px-4 py-3 flex items-center gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-heritage-gold-500 shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm text-heritage-green-900 dark:text-heritage-dark-text">
                    <span className="font-medium">{entry.actorName}</span> {entry.action.toLowerCase().startsWith(entry.actorName.toLowerCase()) ? '' : ''}
                    {' '}{entry.action}
                  </p>
                  <p className="text-xs text-heritage-green-500 dark:text-heritage-dark-muted">{new Date(entry.createdAt).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import type {
  FamilyDataset, Member, Relationship, Album, Photo, Memory,
  FamilyEvent, Announcement, ChronicleEra, TreeTemplate, Profile, Role, RelationshipType,
  Biography, LegacyContribution, LanguageEntry, LanguageEntryType, AppNotification,
} from '../types';
import { buildSeedDataset } from '../data/seed';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { registerCredential, verifyCredential, resetCredentialPassword } from '../lib/localAuth';
import * as db from '../lib/db';

const STORAGE_KEY = 'heritage-hub-dataset-v1';
const SESSION_KEY = 'heritage-hub-session-v1';
const AUTH_KEY = 'legacy-link-auth-v1';

function loadFromStorage(): FamilyDataset {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as FamilyDataset;
      // Backfill fields introduced after some datasets were already saved to
      // localStorage, so older saved sessions don't crash on the new arrays.
      return {
        ...parsed,
        biographies: parsed.biographies ?? [],
        legacyContributions: parsed.legacyContributions ?? [],
        languageEntries: parsed.languageEntries ?? [],
        restorationCodes: parsed.restorationCodes ?? [],
        notifications: parsed.notifications ?? [],
      };
    }
  } catch {
    // fall through to seed
  }
  return buildSeedDataset();
}

function saveToStorage(data: FamilyDataset) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // storage full or unavailable — silently ignore, in-memory state still works
  }
}

/** Real UUIDs everywhere so ids are valid whether they end up in localStorage or Postgres. */
const newId = (): string =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `id-${Math.random().toString(36).slice(2, 10)}-${Date.now().toString(36)}`;

export interface AuthResult {
  ok: boolean;
  error?: string;
}

export interface Toast {
  id: string;
  message: string;
  tone: 'error' | 'success';
}

interface AppContextValue {
  data: FamilyDataset;
  isOnlineMode: boolean;
  isLoading: boolean;
  currentProfile: Profile;
  setCurrentProfileId: (id: string) => void;

  // toasts
  toasts: Toast[];
  pushToast: (message: string, tone?: Toast['tone']) => void;
  dismissToast: (id: string) => void;

  // auth
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<AuthResult>;
  signup: (displayName: string, email: string, password: string, inviteCode?: string) => Promise<AuthResult>;
  logout: () => void;
  continueAsDemo: () => void;

  // members
  addMember: (m: Omit<Member, 'id' | 'familyId'>) => Member;
  updateMember: (id: string, patch: Partial<Member>) => void;
  removeMember: (id: string) => void;

  // relationships
  addRelationship: (fromId: string, toId: string, type: RelationshipType, startedAt?: string) => void;
  removeRelationshipsForMember: (memberId: string) => void;

  // template
  setActiveTreeTemplate: (t: TreeTemplate) => void;

  // media
  addAlbum: (a: Omit<Album, 'id' | 'familyId'>) => Album;
  addPhoto: (p: Omit<Photo, 'id' | 'familyId'>) => Photo;

  // memories / events / announcements
  addMemory: (m: Omit<Memory, 'id' | 'familyId' | 'createdAt'>) => void;
  addEvent: (e: Omit<FamilyEvent, 'id' | 'familyId' | 'rsvps'>) => void;
  setRsvp: (eventId: string, memberId: string, status: FamilyEvent['rsvps'][number]['status']) => void;
  addAnnouncement: (a: Omit<Announcement, 'id' | 'familyId' | 'createdAt'>) => void;

  // chronicle
  addChronicleEra: (c: Omit<ChronicleEra, 'id' | 'familyId' | 'sortOrder'>) => void;

  // biography & legacy
  saveBiography: (memberId: string, patch: Omit<Partial<Biography>, 'id' | 'familyId' | 'memberId' | 'updatedAt' | 'updatedByProfileId'>) => void;
  addLegacyContribution: (memberId: string, body: string, taggedMemberIds: string[]) => void;
  removeLegacyContribution: (id: string) => void;

  // language dictionary
  addLanguageEntry: (entry: { entryType: LanguageEntryType; term: string; meaning: string; answer?: string; saidByMemberId?: string }) => void;
  removeLanguageEntry: (id: string) => void;

  // notifications
  notificationsForCurrentProfile: AppNotification[];
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;

  // admin
  addProfile: (displayName: string, email: string, role: Role, memberId?: string) => Profile;
  updateProfileRole: (id: string, role: Role) => void;
  updateProfileMemberId: (id: string, memberId: string | null) => void;
  updateFamilyDetails: (patch: { name?: string; motto?: string; originStory?: string }) => void;
  generateInvitationCode: (role: Exclude<Role, 'super_admin'>, memberId?: string) => string;
  generateRestorationCode: (profileId: string) => string;
  redeemRestorationCode: (email: string, code: string, newPassword: string) => Promise<AuthResult>;
  updateProfileAvatar: (id: string, avatarUrl: string) => void;
  logActivity: (action: string, entityType: string) => void;

  resetToSeed: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [data, setData] = useState<FamilyDataset>(() => (isSupabaseConfigured ? buildSeedDataset() : loadFromStorage()));
  const [currentProfileId, setCurrentProfileId] = useState<string>(() => {
    try {
      return localStorage.getItem(SESSION_KEY) || data.profiles[0]?.id || '';
    } catch {
      return data.profiles[0]?.id || '';
    }
  });

  // In online mode the dataset comes from Supabase, not localStorage, and demo/local
  // sessions shouldn't be persisted to disk (they're throwaway seed data).
  const [isDemoOrLocal, setIsDemoOrLocal] = useState(!isSupabaseConfigured);
  useEffect(() => {
    if (isDemoOrLocal) saveToStorage(data);
  }, [data, isDemoOrLocal]);
  useEffect(() => {
    try { localStorage.setItem(SESSION_KEY, currentProfileId); } catch { /* noop */ }
  }, [currentProfileId]);

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    if (isSupabaseConfigured) return false; // resolved by the session-check effect below
    try { return localStorage.getItem(AUTH_KEY) === '1'; } catch { return false; }
  });
  useEffect(() => {
    if (isDemoOrLocal) {
      try { localStorage.setItem(AUTH_KEY, isAuthenticated ? '1' : '0'); } catch { /* noop */ }
    }
  }, [isAuthenticated, isDemoOrLocal]);

  // On load, if Supabase is configured, see if there's already a signed-in session
  // and hydrate real data for that family instead of the local seed.
  const [isLoading, setIsLoading] = useState(isSupabaseConfigured);
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) { setIsLoading(false); return; }
    (async () => {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const user = sessionData.session?.user;
        if (!user) return;
        const profile = await db.fetchProfileByUserId(user.id);
        if (!profile) { await supabase.auth.signOut(); return; }
        const dataset = await db.fetchFamilyDataset(profile.familyId);
        setData(dataset);
        setCurrentProfileId(profile.id);
        setIsDemoOrLocal(false);
        setIsAuthenticated(true);
      } catch (err) {
        console.error('[legacy-link] failed to restore session:', err);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const currentProfile = useMemo(
    () => data.profiles.find(p => p.id === currentProfileId) ?? data.profiles[0],
    [data.profiles, currentProfileId]
  );

  const isOnlineMode = isSupabaseConfigured && !isDemoOrLocal;

  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const pushToast = useCallback((message: string, tone: Toast['tone'] = 'error') => {
    const id = newId();
    setToasts(prev => [...prev, { id, message, tone }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 6000);
  }, []);

  /** Fire a Supabase write in the background. Local state has already been updated
   *  optimistically by the caller, so a failure here doesn't roll anything back —
   *  but it does surface a toast so the person knows the change may not have synced. */
  const persist = useCallback((label: string, fn: () => Promise<unknown>) => {
    fn().catch(err => {
      console.error(`[legacy-link] failed to sync "${label}" to Supabase:`, err);
      pushToast(`Couldn't save "${label}" to the server. It's showing locally, but try again or refresh to confirm it synced.`);
    });
  }, [pushToast]);

  const logActivity = useCallback((action: string, entityType: string) => {
    setData(prev => ({
      ...prev,
      auditLog: [
        { id: newId(), familyId: prev.family.id, actorName: currentProfile?.displayName ?? 'Unknown', action, entityType, createdAt: new Date().toISOString() },
        ...prev.auditLog,
      ].slice(0, 200),
    }));
    if (isOnlineMode && currentProfile) {
      persist('audit log', () => db.insertAuditLog({ familyId: data.family.id, actorId: currentProfile.id, action, entityType }));
    }
  }, [currentProfile, isOnlineMode, data.family.id]);

  const addMember: AppContextValue['addMember'] = (m) => {
    const member: Member = { ...m, id: newId(), familyId: data.family.id };
    setData(prev => ({ ...prev, members: [...prev.members, member] }));
    if (isOnlineMode) persist('add member', () => db.insertMember(member));
    logActivity(`Added member "${member.firstName} ${member.lastName}"`, 'member');
    return member;
  };

  const updateMember: AppContextValue['updateMember'] = (id, patch) => {
    setData(prev => ({
      ...prev,
      members: prev.members.map(m => (m.id === id ? { ...m, ...patch } : m)),
    }));
    if (isOnlineMode) persist('update member', () => db.updateMemberRow(id, patch));
    logActivity(`Updated member record`, 'member');
  };

  const removeMember: AppContextValue['removeMember'] = (id) => {
    setData(prev => ({
      ...prev,
      members: prev.members.filter(m => m.id !== id),
      relationships: prev.relationships.filter(r => r.fromMemberId !== id && r.toMemberId !== id),
    }));
    if (isOnlineMode) persist('remove member', async () => {
      await db.deleteRelationshipsForMemberRow(id);
      await db.deleteMemberRow(id);
    });
    logActivity(`Removed a member`, 'member');
  };

  const addRelationship: AppContextValue['addRelationship'] = (fromId, toId, type, startedAt) => {
    const relationship: Relationship = { id: newId(), familyId: data.family.id, fromMemberId: fromId, toMemberId: toId, relationshipType: type, startedAt };
    setData(prev => ({ ...prev, relationships: [...prev.relationships, relationship] }));
    if (isOnlineMode) persist('add relationship', () => db.insertRelationship(relationship));
  };

  const removeRelationshipsForMember: AppContextValue['removeRelationshipsForMember'] = (memberId) => {
    setData(prev => ({
      ...prev,
      relationships: prev.relationships.filter(r => r.fromMemberId !== memberId && r.toMemberId !== memberId),
    }));
    if (isOnlineMode) persist('remove relationships', () => db.deleteRelationshipsForMemberRow(memberId));
  };

  const setActiveTreeTemplate: AppContextValue['setActiveTreeTemplate'] = (t) => {
    setData(prev => ({ ...prev, family: { ...prev.family, activeTreeTemplate: t } }));
    if (isOnlineMode) persist('tree template', () => db.updateFamilyTemplate(data.family.id, t));
    logActivity(`Switched tree template to "${t}"`, 'family');
  };

  const addAlbum: AppContextValue['addAlbum'] = (a) => {
    const album: Album = { ...a, id: newId(), familyId: data.family.id };
    setData(prev => ({ ...prev, albums: [...prev.albums, album] }));
    if (isOnlineMode) persist('add album', () => db.insertAlbum(album));
    logActivity(`Created album "${album.title}"`, 'album');
    return album;
  };

  /** Creates an in-app notification for every tagged member who has a login profile
   *  linked to them (skipping the person who did the tagging, if they tagged themselves). */
  const notifyTaggedMembers = useCallback((
    taggedMemberIds: string[],
    kind: AppNotification['kind'],
    messageFor: (memberName: string) => string
  ) => {
    if (taggedMemberIds.length === 0) return;
    setData(prev => {
      const newNotifications: AppNotification[] = [];
      for (const memberId of taggedMemberIds) {
        const recipientProfile = prev.profiles.find(p => p.memberId === memberId);
        if (!recipientProfile || recipientProfile.id === currentProfile?.id) continue;
        const member = prev.members.find(m => m.id === memberId);
        newNotifications.push({
          id: newId(),
          familyId: prev.family.id,
          profileId: recipientProfile.id,
          kind,
          message: messageFor(member ? `${member.firstName} ${member.lastName}` : 'you'),
          relatedMemberId: memberId,
          createdAt: new Date().toISOString(),
        });
      }
      if (newNotifications.length === 0) return prev;
      return { ...prev, notifications: [...newNotifications, ...prev.notifications] };
    });
  }, [currentProfile]);

  const addPhoto: AppContextValue['addPhoto'] = (p) => {
    const photo: Photo = { ...p, id: newId(), familyId: data.family.id };
    setData(prev => ({ ...prev, photos: [...prev.photos, photo] }));
    if (isOnlineMode) persist('add photo', () => db.insertPhoto(photo));
    logActivity(`Uploaded a photo`, 'photo');
    notifyTaggedMembers(
      photo.taggedMemberIds,
      'photo_tag',
      () => `${currentProfile?.displayName ?? 'Someone'} tagged you in a photo.`
    );
    return photo;
  };

  const addMemory: AppContextValue['addMemory'] = (m) => {
    const memory: Memory = { ...m, id: newId(), familyId: data.family.id, createdAt: new Date().toISOString() };
    setData(prev => ({ ...prev, memories: [memory, ...prev.memories] }));
    if (isOnlineMode) persist('add memory', () => db.insertMemory(memory));
    logActivity(`Shared a memory "${m.title}"`, 'memory');
  };

  const addEvent: AppContextValue['addEvent'] = (e) => {
    const event: FamilyEvent = { ...e, id: newId(), familyId: data.family.id, rsvps: [] };
    setData(prev => ({ ...prev, events: [...prev.events, event] }));
    if (isOnlineMode) persist('add event', () => db.insertEvent(event));
    logActivity(`Scheduled event "${e.title}"`, 'event');
  };

  const setRsvp: AppContextValue['setRsvp'] = (eventId, memberId, status) => {
    setData(prev => ({
      ...prev,
      events: prev.events.map(ev => {
        if (ev.id !== eventId) return ev;
        const existing = ev.rsvps.filter(r => r.memberId !== memberId);
        return { ...ev, rsvps: [...existing, { memberId, status }] };
      }),
    }));
    if (isOnlineMode) persist('rsvp', () => db.upsertRsvp(eventId, memberId, status));
  };

  const addAnnouncement: AppContextValue['addAnnouncement'] = (a) => {
    const announcement: Announcement = { ...a, id: newId(), familyId: data.family.id, createdAt: new Date().toISOString() };
    setData(prev => ({ ...prev, announcements: [announcement, ...prev.announcements] }));
    if (isOnlineMode) persist('add announcement', () => db.insertAnnouncement(announcement));
    logActivity(`Posted announcement "${a.title}"`, 'announcement');
  };

  const addChronicleEra: AppContextValue['addChronicleEra'] = (c) => {
    const nextSortOrder = data.chronicleEras.reduce((max, e) => Math.max(max, e.sortOrder), 0) + 1;
    const era: ChronicleEra = { ...c, id: newId(), familyId: data.family.id, sortOrder: nextSortOrder };
    setData(prev => ({ ...prev, chronicleEras: [...prev.chronicleEras, era] }));
    if (isOnlineMode) persist('add chronicle era', () => db.insertChronicleEra(era));
    logActivity(`Added chronicle era "${era.eraLabel}"`, 'chronicle_era');
  };

  const saveBiography: AppContextValue['saveBiography'] = (memberId, patch) => {
    const existing = data.biographies.find(b => b.memberId === memberId);
    const biography: Biography = {
      id: existing?.id ?? newId(),
      familyId: data.family.id,
      memberId,
      atAGlance: existing?.atAGlance,
      earlyLifeFamily: existing?.earlyLifeFamily,
      youngAdulthood: existing?.youngAdulthood,
      marriageFamilyLife: existing?.marriageFamilyLife,
      workAchievementsPassions: existing?.workAchievementsPassions,
      storiesMemoriesTitle: existing?.storiesMemoriesTitle,
      storiesMemories: existing?.storiesMemories,
      laterYears: existing?.laterYears,
      legacy: existing?.legacy,
      ...patch,
      updatedAt: new Date().toISOString(),
      updatedByProfileId: currentProfile?.id,
    };
    setData(prev => ({
      ...prev,
      biographies: existing
        ? prev.biographies.map(b => (b.memberId === memberId ? biography : b))
        : [...prev.biographies, biography],
    }));
    if (isOnlineMode) persist('biography', () => db.upsertBiographyRow(biography));
    logActivity(`Updated a family biography`, 'biography');
  };

  const addLegacyContribution: AppContextValue['addLegacyContribution'] = (memberId, body, taggedMemberIds) => {
    const contribution: LegacyContribution = {
      id: newId(),
      familyId: data.family.id,
      memberId,
      authorProfileId: currentProfile?.id,
      authorName: currentProfile?.displayName ?? 'A family member',
      body,
      taggedMemberIds,
      createdAt: new Date().toISOString(),
    };
    setData(prev => ({ ...prev, legacyContributions: [contribution, ...prev.legacyContributions] }));
    if (isOnlineMode) persist('legacy memory', () => db.insertLegacyContribution(contribution));
    logActivity(`Shared a legacy memory`, 'legacy_contribution');
    notifyTaggedMembers(
      taggedMemberIds,
      'legacy_tag',
      () => `${currentProfile?.displayName ?? 'Someone'} tagged you in a legacy memory.`
    );
  };

  const removeLegacyContribution: AppContextValue['removeLegacyContribution'] = (id) => {
    setData(prev => ({ ...prev, legacyContributions: prev.legacyContributions.filter(c => c.id !== id) }));
    if (isOnlineMode) persist('remove legacy memory', () => db.deleteLegacyContributionRow(id));
    logActivity(`Removed a legacy memory`, 'legacy_contribution');
  };

  const addLanguageEntry: AppContextValue['addLanguageEntry'] = ({ entryType, term, meaning, answer, saidByMemberId }) => {
    const entry: LanguageEntry = {
      id: newId(),
      familyId: data.family.id,
      entryType,
      term,
      meaning,
      answer,
      saidByMemberId,
      contributedByProfileId: currentProfile?.id,
      contributedByName: currentProfile?.displayName ?? 'A family member',
      createdAt: new Date().toISOString(),
    };
    setData(prev => ({ ...prev, languageEntries: [entry, ...prev.languageEntries] }));
    if (isOnlineMode) persist('language entry', () => db.insertLanguageEntry(entry));
    logActivity(`Added a ${entryType} to the family language dictionary`, 'language_entry');
  };

  const removeLanguageEntry: AppContextValue['removeLanguageEntry'] = (id) => {
    setData(prev => ({ ...prev, languageEntries: prev.languageEntries.filter(e => e.id !== id) }));
    if (isOnlineMode) persist('remove language entry', () => db.deleteLanguageEntryRow(id));
    logActivity(`Removed a language dictionary entry`, 'language_entry');
  };

  const notificationsForCurrentProfile = useMemo(
    () => data.notifications.filter(n => n.profileId === currentProfile?.id)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [data.notifications, currentProfile]
  );

  const markNotificationRead: AppContextValue['markNotificationRead'] = (id) => {
    setData(prev => ({
      ...prev,
      notifications: prev.notifications.map(n => (n.id === id && !n.readAt ? { ...n, readAt: new Date().toISOString() } : n)),
    }));
  };

  const markAllNotificationsRead: AppContextValue['markAllNotificationsRead'] = () => {
    const now = new Date().toISOString();
    setData(prev => ({
      ...prev,
      notifications: prev.notifications.map(n => (n.profileId === currentProfile?.id && !n.readAt ? { ...n, readAt: now } : n)),
    }));
  };

  const addProfile: AppContextValue['addProfile'] = (displayName, email, role, memberId) => {
    const profile: Profile = { id: newId(), familyId: data.family.id, displayName, email, role, memberId };
    setData(prev => ({ ...prev, profiles: [...prev.profiles, profile] }));
    logActivity(`Invited "${displayName}" as ${role.replace('_', ' ')}`, 'profile');
    return profile;
  };

  const updateProfileRole: AppContextValue['updateProfileRole'] = (id, role) => {
    setData(prev => ({ ...prev, profiles: prev.profiles.map(p => (p.id === id ? { ...p, role } : p)) }));
    if (isOnlineMode) persist('update role', () => db.updateProfileRoleRow(id, role));
    logActivity(`Changed a member's role to ${role.replace('_', ' ')}`, 'profile');
  };

  /** Set or change which tree person a login is tied to — same effect whether it
   *  happens at invite time or later, e.g. fixing a profile that was created without one. */
  const updateProfileMemberId: AppContextValue['updateProfileMemberId'] = (id, memberId) => {
    setData(prev => ({ ...prev, profiles: prev.profiles.map(p => (p.id === id ? { ...p, memberId: memberId ?? undefined } : p)) }));
    if (isOnlineMode) persist('link profile', () => db.updateProfileMemberIdRow(id, memberId));
    const member = memberId ? data.members.find(m => m.id === memberId) : undefined;
    logActivity(member ? `Linked a profile to "${member.firstName} ${member.lastName}"` : 'Unlinked a profile from its person', 'profile');
  };

  const updateFamilyDetails: AppContextValue['updateFamilyDetails'] = (patch) => {
    setData(prev => ({ ...prev, family: { ...prev.family, ...patch } }));
    if (isOnlineMode) persist('family details', () => db.updateFamilyDetailsRow(data.family.id, patch));
    logActivity('Updated the family profile', 'family');
  };

  const updateProfileAvatar: AppContextValue['updateProfileAvatar'] = (id, avatarUrl) => {
    setData(prev => ({ ...prev, profiles: prev.profiles.map(p => (p.id === id ? { ...p, avatarUrl } : p)) }));
    if (isOnlineMode) persist('update profile photo', () => db.updateProfileAvatarRow(id, avatarUrl));
  };

  const generateInvitationCode: AppContextValue['generateInvitationCode'] = (role, memberId) => {
    const code = Math.random().toString(36).slice(2, 8).toUpperCase();
    const invite = { id: newId(), familyId: data.family.id, code, role, memberId, createdAt: new Date().toISOString() };
    setData(prev => ({ ...prev, invitationCodes: [...prev.invitationCodes, invite] }));
    if (isOnlineMode) persist('invitation code', () => db.insertInvitationCode(invite));
    logActivity(`Generated an invitation code`, 'invitation');
    return code;
  };

  /** Admin action: mint a one-time restoration code for a profile that's locked out.
   *  The admin shares this code with the person out-of-band (call, message, in person);
   *  they redeem it on the login screen to set a brand-new password. */
  const generateRestorationCode: AppContextValue['generateRestorationCode'] = (profileId) => {
    const code = Math.random().toString(36).slice(2, 8).toUpperCase();
    const restoration = { id: newId(), familyId: data.family.id, profileId, code, createdAt: new Date().toISOString() };
    setData(prev => ({ ...prev, restorationCodes: [...prev.restorationCodes, restoration] }));
    if (isOnlineMode) persist('restoration code', () => db.insertRestorationCode(restoration));
    const target = data.profiles.find(p => p.id === profileId);
    logActivity(`Generated a password restoration code for ${target?.displayName ?? 'a member'}`, 'restoration_code');
    return code;
  };

  /** Person-facing action from the "Forgot password?" flow on the login screen:
   *  redeem an admin-issued restoration code for their email and set a new password. */
  const redeemRestorationCode: AppContextValue['redeemRestorationCode'] = async (email, code, newPassword) => {
    if (!email.trim() || !code.trim() || !newPassword) {
      return { ok: false, error: 'Enter your email, the restoration code, and a new password.' };
    }
    if (newPassword.length < 6) return { ok: false, error: 'New password must be at least 6 characters.' };

    // Online mode: the local dataset doesn't hold other members' restoration
    // codes (they're per-user and not bulk-fetched), and only the server can
    // actually change a Supabase Auth password. Delegate to the Edge Function,
    // which validates the code and updates the password with the service role.
    if (isOnlineMode) {
      return db.redeemRestorationCodeViaEdgeFunction(email.trim(), code.trim(), newPassword);
    }

    const profile = data.profiles.find(p => p.email?.toLowerCase() === email.trim().toLowerCase());
    if (!profile) return { ok: false, error: "That email doesn't match an account." };

    const match = data.restorationCodes.find(
      r => r.profileId === profile.id && r.code === code.trim().toUpperCase() && !r.redeemedAt
    );
    if (!match) return { ok: false, error: 'That restoration code is invalid, expired, or already used. Ask your family admin for a new one.' };

    const reset = resetCredentialPassword(email.trim(), newPassword);
    if (!reset) registerCredential(email.trim(), newPassword, profile.id);

    setData(prev => ({
      ...prev,
      restorationCodes: prev.restorationCodes.map(r => (r.id === match.id ? { ...r, redeemedAt: new Date().toISOString() } : r)),
      auditLog: [
        { id: newId(), familyId: prev.family.id, actorName: profile.displayName, action: 'Reset their password using a restoration code', entityType: 'restoration_code', createdAt: new Date().toISOString() },
        ...prev.auditLog,
      ].slice(0, 200),
    }));

    return { ok: true };
  };

  const resetToSeed = () => {
    const fresh = buildSeedDataset();
    setData(fresh);
    setCurrentProfileId(fresh.profiles[0].id);
  };

  const login: AppContextValue['login'] = async (email, password) => {
    if (!email.trim() || !password) return { ok: false, error: 'Enter your email and password.' };

    if (isSupabaseConfigured && supabase) {
      const { data: signInData, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { ok: false, error: error.message };
      const user = signInData.user;
      if (!user) return { ok: false, error: 'Sign-in did not return a session. Please try again.' };
      try {
        const profile = await db.fetchProfileByUserId(user.id);
        if (!profile) return { ok: false, error: 'No family profile is linked to this account yet.' };
        const dataset = await db.fetchFamilyDataset(profile.familyId);
        setData(dataset);
        setCurrentProfileId(profile.id);
        setIsDemoOrLocal(false);
        setIsAuthenticated(true);
        return { ok: true };
      } catch (err) {
        return { ok: false, error: err instanceof Error ? err.message : 'Failed to load your family data.' };
      }
    }

    const profileId = verifyCredential(email, password);
    if (!profileId || !data.profiles.some(p => p.id === profileId)) {
      return { ok: false, error: 'That email and password don\'t match an account.' };
    }
    setCurrentProfileId(profileId);
    setIsAuthenticated(true);
    return { ok: true };
  };

  const signup: AppContextValue['signup'] = async (displayName, email, password, inviteCode) => {
    if (!displayName.trim() || !email.trim() || !password) {
      return { ok: false, error: 'Fill in your name, email, and password.' };
    }
    if (password.length < 6) return { ok: false, error: 'Password must be at least 6 characters.' };

    if (isSupabaseConfigured && supabase) {
      try {
        let invite: Awaited<ReturnType<typeof db.fetchInvitationByCode>> = null;
        if (inviteCode?.trim()) {
          invite = await db.fetchInvitationByCode(inviteCode.trim());
          if (!invite) return { ok: false, error: 'That invitation code is invalid or already used.' };
        }

        const { data: signUpData, error } = await supabase.auth.signUp({ email, password });
        if (error) return { ok: false, error: error.message };
        const user = signUpData.user;
        if (!user || !signUpData.session) {
          return { ok: false, error: 'Check your email to confirm your account, then sign in.' };
        }

        let familyId: string;
        let role: Role;
        if (invite) {
          familyId = invite.familyId;
          role = invite.role;
          await db.createProfile({ id: user.id, familyId, memberId: invite.memberId, displayName, email, role });
          await db.redeemInvitationCode(invite.id, user.id);
        } else {
          familyId = newId();
          role = 'family_admin';
          await db.createFamily(familyId, `${displayName}'s Family`);
          await db.createProfile({ id: user.id, familyId, displayName, email, role });
        }

        const dataset = await db.fetchFamilyDataset(familyId);
        setData(dataset);
        setCurrentProfileId(user.id);
        setIsDemoOrLocal(false);
        setIsAuthenticated(true);
        return { ok: true };
      } catch (err) {
        return { ok: false, error: err instanceof Error ? err.message : 'Sign-up failed. Please try again.' };
      }
    }

    // Offline / local mode
    if (data.profiles.some(p => p.email?.toLowerCase() === email.toLowerCase())) {
      return { ok: false, error: 'An account with this email already exists — try signing in.' };
    }
    let role: Role = 'family_member';
    let matchedInvite: (typeof data.invitationCodes)[number] | undefined;
    if (inviteCode?.trim()) {
      matchedInvite = data.invitationCodes.find(
        c => c.code === inviteCode.trim().toUpperCase() && !c.redeemedByProfileId
      );
      if (!matchedInvite) return { ok: false, error: 'That invitation code is invalid or already used.' };
      role = matchedInvite.role;
    }

    const profile = addProfile(displayName, email, role, matchedInvite?.memberId);
    registerCredential(email, password, profile.id);

    if (matchedInvite) {
      setData(prev => ({
        ...prev,
        invitationCodes: prev.invitationCodes.map(c =>
          c.id === matchedInvite!.id ? { ...c, redeemedByProfileId: profile.id } : c
        ),
      }));
    }

    setCurrentProfileId(profile.id);
    setIsAuthenticated(true);
    return { ok: true };
  };

  const logout = () => {
    setIsAuthenticated(false);
    if (isSupabaseConfigured && supabase) void supabase.auth.signOut();
  };

  const continueAsDemo = () => {
    const fresh = buildSeedDataset();
    setData(fresh);
    setIsDemoOrLocal(true);
    if (fresh.profiles[0]) setCurrentProfileId(fresh.profiles[0].id);
    setIsAuthenticated(true);
  };

  const value: AppContextValue = {
    data,
    isOnlineMode,
    isLoading,
    currentProfile,
    setCurrentProfileId,
    toasts, pushToast, dismissToast,
    isAuthenticated, login, signup, logout, continueAsDemo,
    addMember, updateMember, removeMember,
    addRelationship, removeRelationshipsForMember,
    setActiveTreeTemplate,
    addAlbum, addPhoto,
    addMemory, addEvent, setRsvp, addAnnouncement, addChronicleEra,
    saveBiography, addLegacyContribution, removeLegacyContribution,
    addLanguageEntry, removeLanguageEntry,
    notificationsForCurrentProfile, markNotificationRead, markAllNotificationsRead,
    addProfile, updateProfileRole, updateProfileMemberId, updateFamilyDetails, generateInvitationCode,
    generateRestorationCode, redeemRestorationCode, logActivity,
    updateProfileAvatar,
    resetToSeed,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

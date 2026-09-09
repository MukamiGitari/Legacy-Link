import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import type {
  FamilyDataset, Member, Relationship, Album, Photo, Memory,
  FamilyEvent, Announcement, ChronicleEra, TreeTemplate, Profile, Role, RelationshipType,
} from '../types';
import { buildSeedDataset } from '../data/seed';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { registerCredential, verifyCredential } from '../lib/localAuth';
import * as db from '../lib/db';

const STORAGE_KEY = 'heritage-hub-dataset-v1';
const SESSION_KEY = 'heritage-hub-session-v1';
const AUTH_KEY = 'legacy-link-auth-v1';

function loadFromStorage(): FamilyDataset {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as FamilyDataset;
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

/** Fire a Supabase write in the background. Local state has already been updated
 *  optimistically by the caller, so a failure here is logged rather than thrown —
 *  surfacing a toast for every background sync error is left as a follow-up. */
function persist(label: string, fn: () => Promise<unknown>) {
  fn().catch(err => console.error(`[legacy-link] failed to sync "${label}" to Supabase:`, err));
}

export interface AuthResult {
  ok: boolean;
  error?: string;
}

interface AppContextValue {
  data: FamilyDataset;
  isOnlineMode: boolean;
  isLoading: boolean;
  currentProfile: Profile;
  setCurrentProfileId: (id: string) => void;

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

  // admin
  addProfile: (displayName: string, email: string, role: Role, memberId?: string) => Profile;
  updateProfileRole: (id: string, role: Role) => void;
  generateInvitationCode: (role: Exclude<Role, 'super_admin'>, memberId?: string) => string;
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

  const addPhoto: AppContextValue['addPhoto'] = (p) => {
    const photo: Photo = { ...p, id: newId(), familyId: data.family.id };
    setData(prev => ({ ...prev, photos: [...prev.photos, photo] }));
    if (isOnlineMode) persist('add photo', () => db.insertPhoto(photo));
    logActivity(`Uploaded a photo`, 'photo');
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

  const generateInvitationCode: AppContextValue['generateInvitationCode'] = (role, memberId) => {
    const code = Math.random().toString(36).slice(2, 8).toUpperCase();
    const invite = { id: newId(), familyId: data.family.id, code, role, memberId, createdAt: new Date().toISOString() };
    setData(prev => ({ ...prev, invitationCodes: [...prev.invitationCodes, invite] }));
    if (isOnlineMode) persist('invitation code', () => db.insertInvitationCode(invite));
    logActivity(`Generated an invitation code`, 'invitation');
    return code;
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
    isAuthenticated, login, signup, logout, continueAsDemo,
    addMember, updateMember, removeMember,
    addRelationship, removeRelationshipsForMember,
    setActiveTreeTemplate,
    addAlbum, addPhoto,
    addMemory, addEvent, setRsvp, addAnnouncement, addChronicleEra,
    addProfile, updateProfileRole, generateInvitationCode, logActivity,
    resetToSeed,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

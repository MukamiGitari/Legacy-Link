import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import type {
  FamilyDataset, Member, Relationship, Album, Photo, Memory,
  FamilyEvent, Announcement, ChronicleEra, TreeTemplate, Profile, Role, RelationshipType,
  Biography, LegacyContribution, LanguageEntry, LanguageEntryType, AppNotification,
  TriviaCategory, TriviaScore, Story, StoryEntry, GameKey, GameScore,
  CookbookAlbum, Recipe,
} from '../types';
import { buildSeedDataset } from '../data/seed';
import { registerCredential, verifyCredential, resetCredentialPassword } from '../lib/localAuth';
import { api, setAccessToken, refreshAccessToken } from '../lib/api';

const STORAGE_KEY = 'heritage-hub-dataset-v1';
const SESSION_KEY = 'heritage-hub-session-v1';
const AUTH_KEY = 'legacy-link-auth-v1';

function assembleDataset(raw: Partial<FamilyDataset>): FamilyDataset {
  return {
    family: raw.family || { id: '', name: 'Family', activeTreeTemplate: 'classic' },
    members: raw.members || [],
    relationships: raw.relationships || [],
    albums: raw.albums || [],
    photos: raw.photos || [],
    cookbookAlbums: raw.cookbookAlbums || [],
    recipes: raw.recipes || [],
    memories: raw.memories || [],
    events: raw.events || [],
    announcements: raw.announcements || [],
    chronicleEras: raw.chronicleEras || [],
    biographies: raw.biographies || [],
    legacyContributions: raw.legacyContributions || [],
    languageEntries: raw.languageEntries || [],
    triviaScores: raw.triviaScores || [],
    gameScores: raw.gameScores || [],
    stories: raw.stories || [],
    profiles: raw.profiles || [],
    invitationCodes: raw.invitationCodes || [],
    restorationCodes: raw.restorationCodes || [],
    notifications: raw.notifications || [],
    auditLog: raw.auditLog || [],
  };
}

function loadFromStorage(): FamilyDataset {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as FamilyDataset;
      return assembleDataset(parsed);
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
  signInWithGoogle: (inviteCode?: string) => Promise<AuthResult>;
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
  updateAlbum: (id: string, patch: Partial<Pick<Album, 'title' | 'category' | 'description' | 'coverPhotoUrl' | 'featuredMemberId'>>) => void;
  removeAlbum: (id: string) => void;
  addPhoto: (p: Omit<Photo, 'id' | 'familyId'>) => Photo;
  removePhoto: (id: string) => void;

  // cookbook (recipe albums + recipes)
  addCookbookAlbum: (a: Omit<CookbookAlbum, 'id' | 'familyId'>) => CookbookAlbum;
  updateCookbookAlbum: (id: string, patch: Partial<Pick<CookbookAlbum, 'title' | 'style' | 'description' | 'coverPhotoUrl' | 'featuredMemberId'>>) => void;
  removeCookbookAlbum: (id: string) => void;
  addRecipe: (r: Omit<Recipe, 'id' | 'familyId' | 'createdAt'>) => Recipe;
  updateRecipe: (id: string, patch: Partial<Omit<Recipe, 'id' | 'familyId' | 'albumId' | 'createdAt'>>) => void;
  removeRecipe: (id: string) => void;

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

  // heritage vault & language entries
  addLanguageEntry: (entry: Omit<LanguageEntry, 'id' | 'familyId' | 'createdAt' | 'contributedByProfileId' | 'contributedByName'>) => void;
  /** `audioUrl: ''` removes the entry's recording. */
  updateLanguageEntry: (id: string, patch: Partial<Omit<LanguageEntry, 'id' | 'familyId' | 'createdAt'>>) => void;
  removeLanguageEntry: (id: string) => void;

  // trivia & leaderboard
  recordTriviaScore: (category: TriviaCategory, score: number, totalQuestions: number) => void;
  recordGameScore: (gameKey: GameKey, points: number) => void;

  // collaborative story builder game
  startStory: (title: string, seedPrompt: string, turnOrderProfileIds: string[]) => Story;
  addStoryEntry: (storyId: string, text: string) => void;
  saveStoryAsMemory: (storyId: string) => void;
  abandonStory: (storyId: string) => void;

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
  updateProfileDisplayName: (id: string, displayName: string) => void;
  logActivity: (action: string, entityType: string) => void;

  resetToSeed: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [data, setData] = useState<FamilyDataset>(() => loadFromStorage());
  const [currentProfileId, setCurrentProfileId] = useState<string>(() => {
    try {
      return localStorage.getItem(SESSION_KEY) || data.profiles[0]?.id || '';
    } catch {
      return data.profiles[0]?.id || '';
    }
  });

  const [isDemoOrLocal, setIsDemoOrLocal] = useState(false);
  useEffect(() => {
    if (isDemoOrLocal) saveToStorage(data);
  }, [data, isDemoOrLocal]);
  useEffect(() => {
    try { localStorage.setItem(SESSION_KEY, currentProfileId); } catch { /* noop */ }
  }, [currentProfileId]);

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try { return localStorage.getItem(AUTH_KEY) === '1'; } catch { return false; }
  });
  useEffect(() => {
    if (isDemoOrLocal) {
      try { localStorage.setItem(AUTH_KEY, isAuthenticated ? '1' : '0'); } catch { /* noop */ }
    }
  }, [isAuthenticated, isDemoOrLocal]);

  const [isLoading, setIsLoading] = useState(true);

  // Initial session restoration effect (Cloudflare Worker backend)
  useEffect(() => {
    (async () => {
      try {
        const refreshed = await refreshAccessToken();
        if (refreshed) {
          const datasetRes = await api.get<Partial<FamilyDataset>>('/family/dataset');
          const meRes = await api.get<{ profile: Profile }>('/family/profiles/me').catch(() => null);
          const assembled = assembleDataset(datasetRes);
          setData(assembled);
          if (meRes?.profile?.id) {
            setCurrentProfileId(meRes.profile.id);
          } else if (assembled.profiles[0]?.id) {
            setCurrentProfileId(assembled.profiles[0].id);
          }
          setIsDemoOrLocal(false);
          setIsAuthenticated(true);
          return;
        }
      } catch (err) {
        console.error('[legacy-link] failed to restore worker session:', err);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const currentProfile = useMemo(
    () => data.profiles.find(p => p.id === currentProfileId) ?? data.profiles[0],
    [data.profiles, currentProfileId]
  );

  const isOnlineMode = !isDemoOrLocal;

  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const pushToast = useCallback((message: string, tone: Toast['tone'] = 'error') => {
    const id = newId();
    setToasts(prev => [...prev, { id, message, tone }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 6000);
  }, []);

  const persist = useCallback((label: string, fn: () => Promise<unknown>) => {
    fn().catch(err => {
      console.error(`[legacy-link] failed to sync "${label}":`, err);
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
      persist('audit log', () => api.post('/features/audit', { action, entityType }));
    }
  }, [currentProfile, isOnlineMode, persist]);

  // Members
  const addMember: AppContextValue['addMember'] = (m) => {
    const member: Member = { ...m, id: newId(), familyId: data.family.id };
    setData(prev => ({ ...prev, members: [...prev.members, member] }));
    if (isOnlineMode) {
      persist('add member', () => api.post('/family/members', member));
    }
    logActivity(`Added member "${member.firstName} ${member.lastName}"`, 'member');
    return member;
  };

  const updateMember: AppContextValue['updateMember'] = (id, patch) => {
    setData(prev => ({
      ...prev,
      members: prev.members.map(m => (m.id === id ? { ...m, ...patch } : m)),
    }));
    if (isOnlineMode) {
      persist('update member', () => api.put(`/family/members/${id}`, patch));
    }
    logActivity(`Updated member record`, 'member');
  };

  const removeMember: AppContextValue['removeMember'] = (id) => {
    setData(prev => ({
      ...prev,
      members: prev.members.filter(m => m.id !== id),
      relationships: prev.relationships.filter(r => r.fromMemberId !== id && r.toMemberId !== id),
    }));
    if (isOnlineMode) {
      persist('remove member', async () => {
        await api.del(`/family/relationships/member/${id}`);
        await api.del(`/family/members/${id}`);
      });
    }
    logActivity(`Removed a member`, 'member');
  };

  // Relationships
  const addRelationship: AppContextValue['addRelationship'] = (fromId, toId, type, startedAt) => {
    const relationship: Relationship = { id: newId(), familyId: data.family.id, fromMemberId: fromId, toMemberId: toId, relationshipType: type, startedAt };
    setData(prev => ({ ...prev, relationships: [...prev.relationships, relationship] }));
    if (isOnlineMode) {
      persist('add relationship', () => api.post('/family/relationships', relationship));
    }
  };

  const removeRelationshipsForMember: AppContextValue['removeRelationshipsForMember'] = (memberId) => {
    setData(prev => ({
      ...prev,
      relationships: prev.relationships.filter(r => r.fromMemberId !== memberId && r.toMemberId !== memberId),
    }));
    if (isOnlineMode) {
      persist('remove relationships', () => api.del(`/family/relationships/member/${memberId}`));
    }
  };

  // Tree Template
  const setActiveTreeTemplate: AppContextValue['setActiveTreeTemplate'] = (t) => {
    setData(prev => ({ ...prev, family: { ...prev.family, activeTreeTemplate: t } }));
    if (isOnlineMode) {
      persist('tree template', () => api.put('/family/template', { template: t }));
    }
    logActivity(`Switched tree template to "${t}"`, 'family');
  };

  // Albums & Photos
  const addAlbum: AppContextValue['addAlbum'] = (a) => {
    const album: Album = { ...a, id: newId(), familyId: data.family.id };
    setData(prev => ({ ...prev, albums: [...prev.albums, album] }));
    if (isOnlineMode) {
      persist('add album', () => api.post('/albums', {
        title: album.title,
        category: album.category,
        description: album.description,
        coverPhotoUrl: album.coverPhotoUrl,
        featuredMemberId: album.featuredMemberId,
      }));
    }
    logActivity(`Created album "${album.title}"`, 'album');
    return album;
  };

  const updateAlbum: AppContextValue['updateAlbum'] = (id, patch) => {
    setData(prev => ({ ...prev, albums: prev.albums.map(a => (a.id === id ? { ...a, ...patch } : a)) }));
    if (isOnlineMode) {
      persist('update album', () => api.put(`/albums/${id}`, patch));
    }
    if (patch.title) logActivity(`Renamed an album to "${patch.title}"`, 'album');
  };

  const removeAlbum: AppContextValue['removeAlbum'] = (id) => {
    setData(prev => ({
      ...prev,
      albums: prev.albums.filter(a => a.id !== id),
      photos: prev.photos.filter(p => p.albumId !== id),
    }));
    if (isOnlineMode) {
      persist('remove album', () => api.del(`/albums/${id}`));
    }
    logActivity(`Deleted an album`, 'album');
  };

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
    if (isOnlineMode) {
      persist('add photo', () => api.post('/albums/photos', {
        albumId: photo.albumId,
        url: photo.url,
        caption: photo.caption,
        takenAt: photo.takenAt,
        taggedMemberIds: photo.taggedMemberIds,
      }));
    }
    logActivity(`Uploaded a photo`, 'photo');
    notifyTaggedMembers(
      photo.taggedMemberIds,
      'photo_tag',
      () => `${currentProfile?.displayName ?? 'Someone'} tagged you in a photo.`
    );
    return photo;
  };

  const removePhoto: AppContextValue['removePhoto'] = (id) => {
    setData(prev => ({ ...prev, photos: prev.photos.filter(p => p.id !== id) }));
    if (isOnlineMode) {
      persist('remove photo', () => api.del(`/albums/photos/${id}`));
    }
    logActivity(`Deleted a photo`, 'photo');
  };

  // Cookbook Albums & Recipes
  const addCookbookAlbum: AppContextValue['addCookbookAlbum'] = (a) => {
    const album: CookbookAlbum = { ...a, id: newId(), familyId: data.family.id };
    setData(prev => ({ ...prev, cookbookAlbums: [...prev.cookbookAlbums, album] }));
    if (isOnlineMode) {
      persist('add cookbook album', () => api.post('/recipes/cookbook-albums', album));
    }
    logActivity(`Created cookbook "${album.title}"`, 'cookbookAlbum');
    return album;
  };

  const updateCookbookAlbum: AppContextValue['updateCookbookAlbum'] = (id, patch) => {
    setData(prev => ({ ...prev, cookbookAlbums: prev.cookbookAlbums.map(a => (a.id === id ? { ...a, ...patch } : a)) }));
    if (isOnlineMode) {
      persist('update cookbook album', () => api.put(`/recipes/cookbook-albums/${id}`, patch));
    }
    if (patch.title) logActivity(`Renamed a cookbook to "${patch.title}"`, 'cookbookAlbum');
  };

  const removeCookbookAlbum: AppContextValue['removeCookbookAlbum'] = (id) => {
    setData(prev => ({
      ...prev,
      cookbookAlbums: prev.cookbookAlbums.filter(a => a.id !== id),
      recipes: prev.recipes.filter(r => r.albumId !== id),
    }));
    if (isOnlineMode) {
      persist('remove cookbook album', () => api.del(`/recipes/cookbook-albums/${id}`));
    }
    logActivity(`Deleted a cookbook`, 'cookbookAlbum');
  };

  const addRecipe: AppContextValue['addRecipe'] = (r) => {
    const recipe: Recipe = { ...r, id: newId(), familyId: data.family.id, createdAt: new Date().toISOString() };
    setData(prev => ({ ...prev, recipes: [...prev.recipes, recipe] }));
    if (isOnlineMode) {
      persist('add recipe', () => api.post('/recipes', recipe));
    }
    logActivity(`Added recipe "${recipe.title}"`, 'recipe');
    return recipe;
  };

  const updateRecipe: AppContextValue['updateRecipe'] = (id, patch) => {
    setData(prev => ({ ...prev, recipes: prev.recipes.map(r => (r.id === id ? { ...r, ...patch } : r)) }));
    if (isOnlineMode) {
      persist('update recipe', () => api.put(`/recipes/${id}`, patch));
    }
    logActivity(`Updated a recipe`, 'recipe');
  };

  const removeRecipe: AppContextValue['removeRecipe'] = (id) => {
    setData(prev => ({ ...prev, recipes: prev.recipes.filter(r => r.id !== id) }));
    if (isOnlineMode) {
      persist('remove recipe', () => api.del(`/recipes/${id}`));
    }
    logActivity(`Deleted a recipe`, 'recipe');
  };

  // Phase 2 Feature Wiring
  const addMemory: AppContextValue['addMemory'] = (m) => {
    const memory: Memory = { ...m, id: newId(), familyId: data.family.id, createdAt: new Date().toISOString() };
    setData(prev => ({ ...prev, memories: [memory, ...prev.memories] }));
    if (isOnlineMode) {
      persist('add memory', () => api.post('/features/memories', {
        title: memory.title,
        body: memory.body,
        era: memory.era,
        authorMemberId: memory.authorMemberId,
        coverPhotoUrl: memory.coverPhotoUrl,
        audioUrl: memory.audioUrl,
        relatedMemberIds: memory.relatedMemberIds,
      }));
    }
    logActivity(`Shared a memory "${m.title}"`, 'memory');
  };

  const addEvent: AppContextValue['addEvent'] = (e) => {
    const event: FamilyEvent = { ...e, id: newId(), familyId: data.family.id, rsvps: [] };
    setData(prev => ({ ...prev, events: [...prev.events, event] }));
    if (isOnlineMode) {
      persist('add event', () => api.post('/features/events', {
        title: event.title,
        eventType: event.eventType,
        description: event.description,
        location: event.location,
        startsAt: event.startsAt,
        endsAt: event.endsAt,
      }));
    }
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
    if (isOnlineMode) {
      persist('rsvp', () => api.post(`/features/events/${eventId}/rsvp`, { memberId, status }));
    }
  };

  const addAnnouncement: AppContextValue['addAnnouncement'] = (a) => {
    const announcement: Announcement = { ...a, id: newId(), familyId: data.family.id, createdAt: new Date().toISOString() };
    setData(prev => ({ ...prev, announcements: [announcement, ...prev.announcements] }));
    if (isOnlineMode) {
      persist('add announcement', () => api.post('/features/announcements', {
        title: announcement.title,
        body: announcement.body,
        priority: announcement.priority,
        postedByMemberId: announcement.postedByMemberId,
      }));
    }
    logActivity(`Posted announcement "${a.title}"`, 'announcement');
  };

  const addChronicleEra: AppContextValue['addChronicleEra'] = (c) => {
    const nextSortOrder = data.chronicleEras.reduce((max, e) => Math.max(max, e.sortOrder), 0) + 1;
    const era: ChronicleEra = { ...c, id: newId(), familyId: data.family.id, sortOrder: nextSortOrder };
    setData(prev => ({ ...prev, chronicleEras: [...prev.chronicleEras, era] }));
    if (isOnlineMode) {
      persist('add chronicle era', () => api.post('/features/chronicle', {
        eraLabel: era.eraLabel,
        sortOrder: era.sortOrder,
        headline: era.headline,
        narrative: era.narrative,
        photoUrl: era.photoUrl,
      }));
    }
    logActivity(`Added chronicle era "${era.eraLabel}"`, 'chronicle_era');
  };

  const saveBiography: AppContextValue['saveBiography'] = (memberId, patch) => {
    const existing = data.biographies.find(b => b.memberId === memberId);
    const biography: Biography = {
      id: existing?.id ?? newId(),
      familyId: data.family.id,
      memberId,
      professionalSummary: existing?.professionalSummary,
      earlyLifeBackground: existing?.earlyLifeBackground,
      education: existing?.education,
      careerJourney: existing?.careerJourney,
      professionalAchievements: existing?.professionalAchievements,
      areasOfExpertise: existing?.areasOfExpertise,
      communityContributions: existing?.communityContributions,
      personalPhilosophy: existing?.personalPhilosophy,
      legacy: existing?.legacy,
      personalLife: existing?.personalLife,
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
    if (isOnlineMode) {
      persist('biography', () => api.post('/features/biographies', biography));
    }
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
    if (isOnlineMode) {
      persist('legacy memory', () => api.post('/features/legacy', {
        memberId,
        authorName: contribution.authorName,
        body,
        taggedMemberIds,
      }));
    }
    logActivity(`Shared a legacy memory`, 'legacy_contribution');
    notifyTaggedMembers(
      taggedMemberIds,
      'legacy_tag',
      () => `${currentProfile?.displayName ?? 'Someone'} tagged you in a legacy memory.`
    );
  };

  const removeLegacyContribution: AppContextValue['removeLegacyContribution'] = (id) => {
    setData(prev => ({ ...prev, legacyContributions: prev.legacyContributions.filter(c => c.id !== id) }));
    if (isOnlineMode) {
      persist('remove legacy memory', () => api.del(`/features/legacy/${id}`));
    }
    logActivity(`Removed a legacy memory`, 'legacy_contribution');
  };

  const addLanguageEntry: AppContextValue['addLanguageEntry'] = (entryData) => {
    const entry: LanguageEntry = {
      ...entryData,
      id: newId(),
      familyId: data.family.id,
      contributedByProfileId: currentProfile?.id,
      contributedByName: currentProfile?.displayName ?? 'A family member',
      createdAt: new Date().toISOString(),
    };
    setData(prev => ({ ...prev, languageEntries: [entry, ...prev.languageEntries] }));
    if (isOnlineMode) {
      persist('language entry', () => api.post('/features/language', {
        ...entryData,
        contributedByName: entry.contributedByName,
      }));
    }
    logActivity(`Added "${entry.term}" to the Heritage Vault`, 'language_entry');
  };

  const removeLanguageEntry: AppContextValue['removeLanguageEntry'] = (id) => {
    setData(prev => ({ ...prev, languageEntries: prev.languageEntries.filter(e => e.id !== id) }));
    if (isOnlineMode) {
      persist('remove language entry', () => api.del(`/features/language/${id}`));
    }
    logActivity(`Removed a language dictionary entry`, 'language_entry');
  };

  const updateLanguageEntry: AppContextValue['updateLanguageEntry'] = (id, patch) => {
    setData(prev => ({ ...prev, languageEntries: prev.languageEntries.map(e => (e.id === id ? { ...e, ...patch } : e)) }));
    if (isOnlineMode) {
      persist('update language entry', () => api.put(`/features/language/${id}`, patch));
    }
    logActivity(`Corrected a family language dictionary entry`, 'language_entry');
  };

  const recordTriviaScore: AppContextValue['recordTriviaScore'] = (category, score, totalQuestions) => {
    const entry: TriviaScore = {
      id: newId(),
      familyId: data.family.id,
      profileId: currentProfile?.id ?? '',
      playerName: currentProfile?.displayName ?? 'A family member',
      category,
      score,
      totalQuestions,
      createdAt: new Date().toISOString(),
    };
    setData(prev => ({ ...prev, triviaScores: [entry, ...prev.triviaScores] }));
    if (isOnlineMode) {
      persist('trivia score', () => api.post('/features/scores/trivia', {
        playerName: entry.playerName,
        category,
        score,
        totalQuestions,
      }));
    }
    logActivity(`Scored ${score}/${totalQuestions} in Family Trivia`, 'trivia_score');
    recordGameScoreEntry('trivia', score * 10);
  };

  const recordGameScoreEntry = (gameKey: GameKey, points: number) => {
    const entry: GameScore = {
      id: newId(),
      familyId: data.family.id,
      profileId: currentProfile?.id ?? '',
      playerName: currentProfile?.displayName ?? 'A family member',
      gameKey,
      points,
      createdAt: new Date().toISOString(),
    };
    setData(prev => ({ ...prev, gameScores: [entry, ...prev.gameScores] }));
    if (isOnlineMode) {
      persist('game score', () => api.post('/features/scores', {
        playerName: entry.playerName,
        gameKey,
        points,
      }));
    }
  };

  const recordGameScore: AppContextValue['recordGameScore'] = (gameKey, points) => {
    recordGameScoreEntry(gameKey, points);
    logActivity(`Scored ${points} pts in ${gameKey}`, 'game_score');
  };

  // Stories (session-state based)
  const startStory: AppContextValue['startStory'] = (title, seedPrompt, turnOrderProfileIds) => {
    const story: Story = {
      id: newId(),
      familyId: data.family.id,
      title,
      seedPrompt,
      status: 'active',
      turnOrder: turnOrderProfileIds,
      currentTurnIndex: 0,
      entries: [],
      createdAt: new Date().toISOString(),
    };
    setData(prev => ({ ...prev, stories: [story, ...prev.stories] }));
    logActivity(`Started a collaborative story "${title}"`, 'story');
    return story;
  };

  const addStoryEntry: AppContextValue['addStoryEntry'] = (storyId, text) => {
    setData(prev => ({
      ...prev,
      stories: prev.stories.map(s => {
        if (s.id !== storyId || s.status !== 'active') return s;
        const entry: StoryEntry = {
          id: newId(),
          storyId,
          memberProfileId: currentProfile?.id ?? '',
          authorName: currentProfile?.displayName ?? 'A family member',
          text,
          createdAt: new Date().toISOString(),
        };
        const nextIndex = s.currentTurnIndex + 1;
        const finished = nextIndex >= s.turnOrder.length;
        return {
          ...s,
          entries: [...s.entries, entry],
          currentTurnIndex: nextIndex,
          status: finished ? 'complete' : 'active',
          completedAt: finished ? new Date().toISOString() : undefined,
        };
      }),
    }));
    logActivity(`Added a line to a collaborative story`, 'story');
  };

  const saveStoryAsMemory: AppContextValue['saveStoryAsMemory'] = (storyId) => {
    const story = data.stories.find(s => s.id === storyId);
    if (!story || story.savedAsMemoryId) return;
    const body = story.entries.map(e => e.text).join(' ');
    const memory: Memory = {
      id: newId(),
      familyId: data.family.id,
      title: story.title,
      body,
      era: undefined,
      authorMemberId: undefined,
      coverPhotoUrl: undefined,
      relatedMemberIds: [],
      createdAt: new Date().toISOString(),
    };
    setData(prev => ({
      ...prev,
      memories: [memory, ...prev.memories],
      stories: prev.stories.map(s => (s.id === storyId ? { ...s, savedAsMemoryId: memory.id } : s)),
    }));
    if (isOnlineMode) {
      persist('save story as memory', () => api.post('/features/memories', {
        title: memory.title,
        body: memory.body,
        relatedMemberIds: memory.relatedMemberIds,
      }));
    }
    logActivity(`Saved the story "${story.title}" to Memories`, 'story');
  };

  const abandonStory: AppContextValue['abandonStory'] = (storyId) => {
    setData(prev => ({ ...prev, stories: prev.stories.filter(s => s.id !== storyId) }));
  };

  // Notifications
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

  // Profiles & Admin
  const addProfile: AppContextValue['addProfile'] = (displayName, email, role, memberId) => {
    const profile: Profile = { id: newId(), familyId: data.family.id, displayName, email, role, memberId };
    setData(prev => ({ ...prev, profiles: [...prev.profiles, profile] }));
    logActivity(`Invited "${displayName}" as ${role.replace('_', ' ')}`, 'profile');
    return profile;
  };

  const updateProfileRole: AppContextValue['updateProfileRole'] = (id, role) => {
    setData(prev => ({ ...prev, profiles: prev.profiles.map(p => (p.id === id ? { ...p, role } : p)) }));
    if (isOnlineMode) {
      persist('update role', () => api.put(`/family/profiles/${id}/role`, { role }));
    }
    logActivity(`Changed a member's role to ${role.replace('_', ' ')}`, 'profile');
  };

  const updateProfileMemberId: AppContextValue['updateProfileMemberId'] = (id, memberId) => {
    setData(prev => ({ ...prev, profiles: prev.profiles.map(p => (p.id === id ? { ...p, memberId: memberId ?? undefined } : p)) }));
    if (isOnlineMode) {
      persist('link profile', () => api.put(`/family/profiles/${id}/member`, { memberId }));
    }
    const member = memberId ? data.members.find(m => m.id === memberId) : undefined;
    logActivity(member ? `Linked a profile to "${member.firstName} ${member.lastName}"` : 'Unlinked a profile from its person', 'profile');
  };

  const updateFamilyDetails: AppContextValue['updateFamilyDetails'] = (patch) => {
    setData(prev => ({ ...prev, family: { ...prev.family, ...patch } }));
    if (isOnlineMode) {
      persist('family details', () => api.put('/family/details', patch));
    }
    logActivity('Updated the family profile', 'family');
  };

  const updateProfileAvatar: AppContextValue['updateProfileAvatar'] = (id, avatarUrl) => {
    setData(prev => ({
      ...prev,
      profiles: prev.profiles.map(p => (p.id === id ? { ...p, avatarUrl } : p)),
    }));
    if (isOnlineMode) {
      persist('update profile photo', () => api.put(`/family/profiles/${id}/avatar`, { avatarUrl }));
    }

    const profile = data.profiles.find(p => p.id === id);
    if (profile?.memberId) {
      setData(prev => ({
        ...prev,
        members: prev.members.map(m => (m.id === profile.memberId ? { ...m, avatarUrl } : m)),
      }));
      if (isOnlineMode) {
        persist('update member photo', () => api.put(`/family/members/${profile.memberId}`, { avatarUrl }));
      }
    }
  };

  const updateProfileDisplayName: AppContextValue['updateProfileDisplayName'] = (id, displayName) => {
    setData(prev => ({
      ...prev,
      profiles: prev.profiles.map(p => (p.id === id ? { ...p, displayName } : p)),
    }));
    if (isOnlineMode) {
      persist('update profile display name', () => api.put(`/family/profiles/${id}/display-name`, { displayName }));
    }
  };

  const generateInvitationCode: AppContextValue['generateInvitationCode'] = (role, memberId) => {
    const code = Math.random().toString(36).slice(2, 8).toUpperCase();
    const invite = { id: newId(), familyId: data.family.id, code, role, memberId, createdAt: new Date().toISOString() };
    setData(prev => ({ ...prev, invitationCodes: [...prev.invitationCodes, invite] }));
    if (isOnlineMode) {
      persist('invitation code', async () => {
        const res = await api.post<{ code: string }>('/family/invitations', { role, memberId, code });
        if (res?.code && res.code !== code) {
          setData(prev => ({
            ...prev,
            invitationCodes: prev.invitationCodes.map(c => c.id === invite.id ? { ...c, code: res.code } : c)
          }));
        }
      });
    }
    logActivity(`Generated an invitation code`, 'invitation');
    return code;
  };

  const generateRestorationCode: AppContextValue['generateRestorationCode'] = (profileId) => {
    const code = Math.random().toString(36).slice(2, 8).toUpperCase();
    const restoration = { id: newId(), familyId: data.family.id, profileId, code, createdAt: new Date().toISOString() };
    setData(prev => ({ ...prev, restorationCodes: [...prev.restorationCodes, restoration] }));
    if (isOnlineMode) {
      persist('restoration code', async () => {
        const res = await api.post<{ code: string }>('/features/restoration', { profileId, code });
        if (res?.code && res.code !== code) {
          setData(prev => ({
            ...prev,
            restorationCodes: prev.restorationCodes.map(r => r.id === restoration.id ? { ...r, code: res.code } : r)
          }));
        }
      });
    }
    const target = data.profiles.find(p => p.id === profileId);
    logActivity(`Generated a password restoration code for ${target?.displayName ?? 'a member'}`, 'restoration_code');
    return code;
  };

  const redeemRestorationCode: AppContextValue['redeemRestorationCode'] = async (email, code, newPassword) => {
    if (!email.trim() || !code.trim() || !newPassword) {
      return { ok: false, error: 'Enter your email, the restoration code, and a new password.' };
    }
    if (newPassword.length < 6) return { ok: false, error: 'New password must be at least 6 characters.' };

    if (isOnlineMode) {
      try {
        await api.post('/features/restoration/redeem', { email: email.trim(), code: code.trim(), newPassword });
        return { ok: true };
      } catch (err: any) {
        return { ok: false, error: err?.message || 'Failed to redeem restoration code.' };
      }
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

  // Auth Operations (Cloudflare Worker)
  const login: AppContextValue['login'] = async (email, password) => {
    if (!email.trim() || !password) return { ok: false, error: 'Enter your email and password.' };

    try {
      const res = await api.post<{ user: any; accessToken: string }>('/auth/login', { email, password });
      if (res?.accessToken) {
        setAccessToken(res.accessToken);
        const datasetRes = await api.get<Partial<FamilyDataset>>('/family/dataset');
        const assembled = assembleDataset(datasetRes);
        setData(assembled);
        setCurrentProfileId(res.user.id);
        setIsDemoOrLocal(false);
        setIsAuthenticated(true);
        return { ok: true };
      }
    } catch (err: any) {
      const profileId = verifyCredential(email, password);
      if (!profileId || !data.profiles.some(p => p.id === profileId)) {
        return { ok: false, error: err?.message || 'That email and password don\'t match an account.' };
      }
      setCurrentProfileId(profileId);
      setIsAuthenticated(true);
      return { ok: true };
    }
    return { ok: false, error: 'Failed to sign in.' };
  };

  const signup: AppContextValue['signup'] = async (displayName, email, password, inviteCode) => {
    if (!displayName.trim() || !email.trim() || !password) {
      return { ok: false, error: 'Fill in your name, email, and password.' };
    }
    if (password.length < 6) return { ok: false, error: 'Password must be at least 6 characters.' };

    try {
      const res = await api.post<{ user: any; profile: any; accessToken: string }>('/auth/register', {
        email,
        password,
        name: displayName,
        inviteCode,
      });
      if (res?.accessToken) {
        setAccessToken(res.accessToken);
        const datasetRes = await api.get<Partial<FamilyDataset>>('/family/dataset');
        const assembled = assembleDataset(datasetRes);
        setData(assembled);
        setCurrentProfileId(res.user.id);
        setIsDemoOrLocal(false);
        setIsAuthenticated(true);
        return { ok: true };
      }
    } catch (err: any) {
      // Offline / local mode fallback
    }

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

  const signInWithGoogle: AppContextValue['signInWithGoogle'] = async () => {
    return { ok: false, error: 'Google sign-in is disabled after Cloudflare Worker cutover.' };
  };

  const logout = () => {
    setIsAuthenticated(false);
    setAccessToken(null);
    api.post('/auth/logout').catch(() => {});
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
    isAuthenticated, login, signup, signInWithGoogle, logout, continueAsDemo,
    addMember, updateMember, removeMember,
    addRelationship, removeRelationshipsForMember,
    setActiveTreeTemplate,
    addAlbum, updateAlbum, removeAlbum, addPhoto, removePhoto,
    addCookbookAlbum, updateCookbookAlbum, removeCookbookAlbum, addRecipe, updateRecipe, removeRecipe,
    addMemory, addEvent, setRsvp, addAnnouncement, addChronicleEra,
    saveBiography, addLegacyContribution, removeLegacyContribution,
    addLanguageEntry, updateLanguageEntry, removeLanguageEntry,
    recordTriviaScore,
    recordGameScore,
    startStory, addStoryEntry, saveStoryAsMemory, abandonStory,
    notificationsForCurrentProfile, markNotificationRead, markAllNotificationsRead,
    addProfile, updateProfileRole, updateProfileMemberId, updateFamilyDetails, generateInvitationCode,
    generateRestorationCode, redeemRestorationCode, logActivity,
    updateProfileAvatar, updateProfileDisplayName,
    resetToSeed,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

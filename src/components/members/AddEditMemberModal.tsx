import React, { useState, useEffect } from 'react';
import { X, User, UploadCloud, Loader2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { Gender } from '../../types';
import { canDelete } from '../../lib/permissions';
import { getParents, getSpouses } from '../../lib/lineage';
import * as db from '../../lib/db';

const AVATAR_PRESETS = ['aria', 'kaari', 'kanyoro', 'kiogora', 'mworia', 'kaburu', 'kathurima', 'kobia']
  .map(seed => `https://api.dicebear.com/7.x/personas/svg?seed=${seed}`);

interface AddEditMemberModalProps {
  memberId: string | null; // null = create mode
  onClose: () => void;
}

export const AddEditMemberModal: React.FC<AddEditMemberModalProps> = ({ memberId, onClose }) => {
  const { data, addMember, updateMember, removeMember, addRelationship, removeRelationshipsForMember, currentProfile, isOnlineMode, pushToast } = useApp();
  const canRemove = canDelete(currentProfile?.role);
  const existing = memberId ? data.members.find(m => m.id === memberId) : null;

  const existingParents = existing ? getParents(existing.id, data.relationships) : [];
  const existingSpouses = existing ? getSpouses(existing.id, data.relationships) : [];

  const [firstName, setFirstName] = useState(existing?.firstName ?? '');
  const [lastName, setLastName] = useState(existing?.lastName ?? '');
  const [maidenName, setMaidenName] = useState(existing?.maidenName ?? '');
  const [gender, setGender] = useState<Gender>(existing?.gender ?? 'female');
  const [generation, setGeneration] = useState(existing?.generation ?? 3);
  const [isLiving, setIsLiving] = useState(existing?.isLiving ?? true);
  const [dob, setDob] = useState(existing?.dateOfBirth ?? '');
  const [dop, setDop] = useState(existing?.dateOfPassing ?? '');
  const [birthPlace, setBirthPlace] = useState(existing?.birthPlace ?? '');
  const [restingPlace, setRestingPlace] = useState(existing?.restingPlace ?? '');
  const [occupation, setOccupation] = useState(existing?.occupation ?? '');
  const [bio, setBio] = useState(existing?.bio ?? '');
  const [avatarUrl, setAvatarUrl] = useState(existing?.avatarUrl ?? AVATAR_PRESETS[0]);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [savingPhoto, setSavingPhoto] = useState(false);

  const [parent1Id, setParent1Id] = useState(existingParents[0] ?? '');
  const [parent2Id, setParent2Id] = useState(existingParents[1] ?? '');
  const [spouseId, setSpouseId] = useState(existingSpouses[0] ?? '');

  const handleParent1Change = (newParent1Id: string) => {
    setParent1Id(newParent1Id);
    // If the selected parent has a spouse, auto-fill Parent 2 if empty
    if (newParent1Id && !parent2Id) {
      const spouseOfParent = getSpouses(newParent1Id, data.relationships)[0];
      if (spouseOfParent && spouseOfParent !== newParent1Id) {
        setParent2Id(spouseOfParent);
      }
    }
  };

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const otherMembers = data.members.filter(m => m.id !== memberId);

  const handlePhotoSelect = (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = () => setAvatarUrl(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      firstName, lastName, maidenName: maidenName || undefined, gender, generation,
      isLiving, dateOfBirth: dob || undefined, dateOfPassing: !isLiving ? (dop || undefined) : undefined,
      birthPlace: birthPlace || undefined, restingPlace: restingPlace || undefined,
      occupation: occupation || undefined, bio: bio || undefined, avatarUrl,
    };

    let savedId: string;
    if (existing) {
      updateMember(existing.id, payload);
      if (parent1Id) addRelationship(parent1Id, existing.id, 'parent');
      if (parent2Id && parent2Id !== parent1Id) addRelationship(parent2Id, existing.id, 'parent');
      if (spouseId) {
        addRelationship(existing.id, spouseId, 'spouse');
        addRelationship(spouseId, existing.id, 'spouse');
      }
      savedId = existing.id;
    } else {
      const created = addMember(payload);
      if (parent1Id) addRelationship(parent1Id, created.id, 'parent');
      if (parent2Id && parent2Id !== parent1Id) addRelationship(parent2Id, created.id, 'parent');
      if (spouseId) {
        addRelationship(created.id, spouseId, 'spouse');
        addRelationship(spouseId, created.id, 'spouse');
      }
      savedId = created.id;
    }

    // If a real photo was uploaded (rather than a preset), push the actual
    // file to Supabase Storage and swap the temporary data URL for its
    // permanent hosted URL. Local/demo mode has no storage backend, so the
    // data URL preview from handlePhotoSelect is kept as the final photo.
    if (avatarFile && isOnlineMode) {
      setSavingPhoto(true);
      try {
        const hostedUrl = await db.uploadAvatarFile(data.family.id, savedId, avatarFile);
        updateMember(savedId, { avatarUrl: hostedUrl });
      } catch (err) {
        pushToast(`Saved, but the photo upload failed: ${err instanceof Error ? err.message : 'unknown error'}`);
      } finally {
        setSavingPhoto(false);
      }
    }

    onClose();
  };

  const handleDelete = () => {
    if (!existing) return;
    if (confirm(`Remove ${existing.firstName} ${existing.lastName} from the family tree? This cannot be undone.`)) {
      removeRelationshipsForMember(existing.id);
      removeMember(existing.id);
      onClose();
    }
  };

  const inputCls = "w-full rounded-lg border border-heritage-cream-400 bg-white dark:bg-heritage-dark-hover dark:border-heritage-dark-border dark:text-heritage-dark-text px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-heritage-gold-400";
  const labelCls = "block text-xs font-medium text-heritage-green-700 dark:text-heritage-dark-muted mb-1";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <form
        onSubmit={handleSubmit}
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto scrollbar-thin bg-white dark:bg-heritage-dark-card rounded-2xl shadow-soft-lg"
      >
        <div className="sticky top-0 bg-white dark:bg-heritage-dark-card flex items-center justify-between px-6 py-4 border-b border-heritage-cream-300 dark:border-heritage-dark-border z-10">
          <h2 className="font-serif text-lg text-heritage-green-900 dark:text-heritage-dark-text">
            {existing ? `Edit ${existing.firstName} ${existing.lastName}` : 'Add Family Member'}
          </h2>
          <button type="button" onClick={onClose} className="text-heritage-green-600 dark:text-heritage-dark-muted hover:text-heritage-green-900"><X size={20} /></button>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <p className={labelCls}>Photo</p>
            <div className="flex items-center gap-4">
              <img src={avatarUrl} className="w-16 h-16 rounded-full object-cover bg-heritage-cream-200 shrink-0" alt="" />
              <label className="flex items-center gap-1.5 text-sm border border-heritage-cream-400 dark:border-heritage-dark-border text-heritage-green-800 dark:text-heritage-dark-text px-3 py-2 rounded-lg cursor-pointer hover:bg-heritage-cream-100 dark:hover:bg-heritage-dark-hover">
                <UploadCloud size={15} />
                Upload a photo
                <input type="file" accept="image/*" className="hidden" onChange={e => handlePhotoSelect(e.target.files)} />
              </label>
            </div>
            <p className="mt-2 text-xs text-heritage-green-500 dark:text-heritage-dark-muted">Or pick a placeholder avatar instead:</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {AVATAR_PRESETS.map(url => (
                <button
                  type="button"
                  key={url}
                  onClick={() => { setAvatarUrl(url); setAvatarFile(null); }}
                  className={`rounded-full ${avatarUrl === url ? 'ring-2 ring-heritage-gold-500' : ''}`}
                >
                  <img src={url} className="w-10 h-10 rounded-full bg-heritage-cream-200" alt="" />
                </button>
              ))}
              <div className="w-10 h-10 rounded-full bg-heritage-cream-200 flex items-center justify-center text-heritage-green-400">
                <User size={18} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>First name *</label>
              <input required className={inputCls} value={firstName} onChange={e => setFirstName(e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Last name *</label>
              <input required className={inputCls} value={lastName} onChange={e => setLastName(e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Maiden name</label>
              <input className={inputCls} value={maidenName} onChange={e => setMaidenName(e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Gender</label>
              <select className={inputCls} value={gender} onChange={e => setGender(e.target.value as Gender)}>
                <option value="female">Female</option>
                <option value="male">Male</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Generation</label>
              <input type="number" min={1} max={8} className={inputCls} value={generation} onChange={e => setGeneration(Number(e.target.value))} />
            </div>
            <div>
              <label className={labelCls}>Status</label>
              <select className={inputCls} value={isLiving ? 'living' : 'deceased'} onChange={e => setIsLiving(e.target.value === 'living')}>
                <option value="living">Living</option>
                <option value="deceased">Deceased</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Date of birth</label>
              <input type="date" className={inputCls} value={dob} onChange={e => setDob(e.target.value)} />
            </div>
            {!isLiving && (
              <div>
                <label className={labelCls}>Date of passing</label>
                <input type="date" className={inputCls} value={dop} onChange={e => setDop(e.target.value)} />
              </div>
            )}
            <div>
              <label className={labelCls}>Birth place</label>
              <input className={inputCls} value={birthPlace} onChange={e => setBirthPlace(e.target.value)} />
            </div>
            {!isLiving && (
              <div>
                <label className={labelCls}>Resting place</label>
                <input className={inputCls} value={restingPlace} onChange={e => setRestingPlace(e.target.value)} />
              </div>
            )}
            <div className="col-span-2">
              <label className={labelCls}>Occupation</label>
              <input className={inputCls} value={occupation} onChange={e => setOccupation(e.target.value)} />
            </div>
            <div className="col-span-2">
              <label className={labelCls}>Biography</label>
              <textarea rows={3} className={inputCls} value={bio} onChange={e => setBio(e.target.value)} placeholder="A few lines about their story..." />
            </div>
          </div>

          <div className="border-t border-heritage-cream-300 dark:border-heritage-dark-border pt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className={labelCls}>Parent 1 (e.g. Father)</label>
              <select className={inputCls} value={parent1Id} onChange={e => handleParent1Change(e.target.value)}>
                <option value="">— None —</option>
                {otherMembers.map(m => <option key={m.id} value={m.id}>{m.firstName} {m.lastName}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Parent 2 (e.g. Mother)</label>
              <select className={inputCls} value={parent2Id} onChange={e => setParent2Id(e.target.value)}>
                <option value="">— None —</option>
                {otherMembers.filter(m => m.id !== parent1Id).map(m => <option key={m.id} value={m.id}>{m.firstName} {m.lastName}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Spouse / Partner</label>
              <select className={inputCls} value={spouseId} onChange={e => setSpouseId(e.target.value)}>
                <option value="">— None —</option>
                {otherMembers.map(m => <option key={m.id} value={m.id}>{m.firstName} {m.lastName}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-white dark:bg-heritage-dark-card flex items-center justify-between gap-3 px-6 py-4 border-t border-heritage-cream-300 dark:border-heritage-dark-border">
          {existing && canRemove ? (
            <button type="button" onClick={handleDelete} className="text-sm text-red-600 hover:text-red-800 font-medium">
              Remove member
            </button>
          ) : <span />}
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm rounded-lg border border-heritage-cream-400 text-heritage-green-700 dark:text-heritage-dark-muted hover:bg-heritage-cream-100 dark:hover:bg-heritage-dark-hover">
              Cancel
            </button>
            <button type="submit" disabled={savingPhoto} className="flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg bg-heritage-green-800 hover:bg-heritage-green-700 disabled:opacity-60 text-white font-medium">
              {savingPhoto && <Loader2 size={14} className="animate-spin" />}
              {savingPhoto ? 'Saving photo…' : existing ? 'Save changes' : 'Add member'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

import React, { useState } from 'react';
import { Loader2, Eye, EyeOff, Mail, Lock, User, KeyRound, ArrowRight, Key, X, Sparkles, PlusCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';

type Mode = 'signin' | 'join' | 'register';
type Column = 'left-a' | 'left-b' | 'right-a' | 'right-b';

interface WallPhoto {
  id: string;
  column: Column;
  caption: string;
  /** 'baked' = the image already has an illustrated frame painted into it — render it as-is.
   *  'wood'  = a full-bleed scene — wrap it in one consistent gold-trimmed wood CSS frame.
   *  'placeholder' = an empty slot for a family that hasn't added a photo yet. */
  kind: 'baked' | 'wood' | 'placeholder';
  rotation: string;
  aspect: string;
  imgUrl?: string;
}

// A balanced, symmetrical two-column masonry on each side of the login card — every tile shares
// one gold-trimmed wood frame language, a consistent drop shadow, and a faint emerald/gold colour
// wash so the whole wall reads as one cohesive, museum-lit gallery rather than a scattered collage.
const WALL_PHOTOS: WallPhoto[] = [
  // Left side, column A (outer)
  { id: 'la-1', column: 'left-a', caption: 'The Whole Family', kind: 'baked', rotation: '-rotate-1', aspect: 'aspect-[4/3]', imgUrl: '/photos/framed_ornate_reunion.jpg' },
  { id: 'la-2', column: 'left-a', caption: 'Held Up by Family', kind: 'wood', rotation: 'rotate-1', aspect: 'aspect-square', imgUrl: '/photos/scene_hands_circle.jpg' },
  { id: 'la-3', column: 'left-a', caption: 'Sunday at the Farm', kind: 'wood', rotation: '-rotate-1', aspect: 'aspect-[4/3]', imgUrl: '/photos/scene_farm_family.jpg' },
  { id: 'la-4', column: 'left-a', caption: 'Grandma\u2019s Kitchen', kind: 'wood', rotation: 'rotate-1', aspect: 'aspect-[4/3]', imgUrl: '/photos/scene_kitchen.jpg' },

  // Left side, column B (inner, next to the card)
  { id: 'lb-1', column: 'left-b', caption: 'Dinner Table Selfie', kind: 'wood', rotation: 'rotate-1', aspect: 'aspect-[3/4]', imgUrl: '/photos/scene_dinner_selfie.jpg' },
  { id: 'lb-2', column: 'left-b', caption: 'Close Family Circle', kind: 'baked', rotation: '-rotate-1', aspect: 'aspect-[4/3]', imgUrl: '/photos/framed_wood_reunion_small.jpg' },
  { id: 'lb-3', column: 'left-b', caption: 'Tending the Garden', kind: 'wood', rotation: 'rotate-1', aspect: 'aspect-[4/3]', imgUrl: '/photos/scene_grandmas_garden.jpg' },
  { id: 'lb-4', column: 'left-b', caption: 'Newest Arrival', kind: 'wood', rotation: '-rotate-1', aspect: 'aspect-square', imgUrl: '/photos/scene_newborn.jpg' },

  // Right side, column A (inner, next to the card)
  { id: 'ra-1', column: 'right-a', caption: 'Reunion Portrait', kind: 'baked', rotation: 'rotate-1', aspect: 'aspect-[4/3]', imgUrl: '/photos/framed_wood_reunion_large.jpg' },
  { id: 'ra-2', column: 'right-a', caption: 'Harvest with Grandpa', kind: 'wood', rotation: '-rotate-1', aspect: 'aspect-[3/4]', imgUrl: '/photos/scene_grandfather_tomatoes.jpg' },
  { id: 'ra-3', column: 'right-a', caption: 'Little Hands Helping', kind: 'wood', rotation: 'rotate-1', aspect: 'aspect-[4/3]', imgUrl: '/photos/scene_kids_garden.jpg' },
  { id: 'ra-4', column: 'right-a', caption: 'Create Your Memories', kind: 'placeholder', rotation: '-rotate-1', aspect: 'aspect-square' },

  // Right side, column B (outer)
  { id: 'rb-1', column: 'right-b', caption: 'Family Photo Wall', kind: 'wood', rotation: '-rotate-1', aspect: 'aspect-[4/3]', imgUrl: '/photos/scene_living_room.jpg' },
  { id: 'rb-2', column: 'right-b', caption: 'The Elders', kind: 'baked', rotation: 'rotate-1', aspect: 'aspect-[4/3]', imgUrl: '/photos/framed_wood_elders.jpg' },
  { id: 'rb-3', column: 'right-b', caption: 'Garden Days', kind: 'wood', rotation: '-rotate-1', aspect: 'aspect-[4/3]', imgUrl: '/photos/scene_mother_daughter_garden.jpg' },
  { id: 'rb-4', column: 'right-b', caption: 'Family Reunion', kind: 'wood', rotation: 'rotate-1', aspect: 'aspect-[16/10]', imgUrl: '/photos/scene_farm_gathering.jpg' },
];

// Gold Head Logo SVG matching user's reference image emblem
const LegacyRingEmblem: React.FC<{ size?: number }> = ({ size = 48 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="mx-auto drop-shadow-md"
  >
    <circle cx="38" cy="50" r="28" stroke="url(#goldGrad)" strokeWidth="6" fill="none" />
    <circle cx="62" cy="50" r="28" stroke="url(#goldGrad)" strokeWidth="6" fill="none" />
    <path d="M 38 34 C 42 42 42 58 38 66" stroke="url(#goldGrad)" strokeWidth="4" fill="none" />
    <path d="M 62 34 C 58 42 58 58 62 66" stroke="url(#goldGrad)" strokeWidth="4" fill="none" />
    <defs>
      <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#f7e5b5" />
        <stop offset="50%" stopColor="#d4af37" />
        <stop offset="100%" stopColor="#aa822c" />
      </linearGradient>
    </defs>
  </svg>
);

const GoogleIcon: React.FC<{ size?: number }> = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className="shrink-0">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
    />
  </svg>
);

export const Login: React.FC = () => {
  const { login, signup, signInWithGoogle, continueAsDemo, isOnlineMode, redeemRestorationCode } = useApp();
  const [mode, setMode] = useState<Mode>('signin');
  const [displayName, setDisplayName] = useState('');
  const [familyName, setFamilyName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [activePhotoId, setActivePhotoId] = useState<string | null>(null);

  // "Forgot password?" flow: redeem an admin-issued restoration code and set a new password.
  const [showRestore, setShowRestore] = useState(false);
  const [restoreEmail, setRestoreEmail] = useState('');
  const [restoreCode, setRestoreCode] = useState('');
  const [restoreNewPassword, setRestoreNewPassword] = useState('');
  const [restoreError, setRestoreError] = useState<string | null>(null);
  const [restoreSuccess, setRestoreSuccess] = useState(false);
  const [restoreLoading, setRestoreLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setError(null);
    setGoogleLoading(true);
    const result = await signInWithGoogle(mode === 'join' ? inviteCode : undefined);
    if (!result.ok) {
      setGoogleLoading(false);
      setError(result.error ?? 'Google sign-in failed. Please check your connection.');
    }
  };

  const handleRestoreSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRestoreError(null);
    setRestoreLoading(true);
    const result = await redeemRestorationCode(restoreEmail.trim(), restoreCode.trim(), restoreNewPassword);
    setRestoreLoading(false);
    if (!result.ok) {
      setRestoreError(result.error ?? 'Could not reset your password.');
      return;
    }
    setRestoreSuccess(true);
  };

  const closeRestore = () => {
    setShowRestore(false);
    setRestoreEmail(''); setRestoreCode(''); setRestoreNewPassword('');
    setRestoreError(null); setRestoreSuccess(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    let result;
    if (mode === 'signin') {
      result = await login(email, password);
    } else if (mode === 'join') {
      result = await signup(displayName, email, password, inviteCode || undefined);
    } else {
      const fullDisplayName = familyName ? `${displayName} (${familyName})` : displayName;
      result = await signup(fullDisplayName, email, password);
    }

    setLoading(false);
    if (!result.ok) {
      setError(result.error ?? 'Authentication failed. Please check your inputs.');
    }
  };

  const switchMode = (m: Mode) => {
    setMode(m);
    setError(null);
  };

  const togglePhoto = (id: string) => {
    setActivePhotoId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="h-screen w-full relative flex items-center justify-center bg-[#13281d] select-none font-sans overflow-hidden">
      {/* Deep Green Canvas Fabric Background Texture */}
      <div
        className="absolute inset-0 bg-[#13281d] z-0"
        style={{
          backgroundImage: `
            radial-gradient(circle at 50% 50%, rgba(35, 75, 55, 0.5) 0%, rgba(10, 23, 16, 0.95) 100%),
            linear-gradient(to right, rgba(0,0,0,0.25), rgba(0,0,0,0.4))
          `,
        }}
      />
      
      {/* Fine Fabric Texture Overlay */}
      <div
        className="absolute inset-0 opacity-[0.07] pointer-events-none z-0"
        style={{
          backgroundImage: 'radial-gradient(#c5a059 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      {/* ========================================================================= */}
      {/* BALANCED GALLERY WALL — two symmetrical masonry columns flanking the card */}
      {/* ========================================================================= */}
      <div className="absolute inset-0 pointer-events-none z-10 hidden md:block overflow-hidden">
        {(['left', 'right'] as const).map((side) => (
          <div
            key={side}
            className={`absolute inset-y-4 lg:inset-y-6 ${
              side === 'left' ? 'left-3 lg:left-5' : 'right-3 lg:right-5'
            } w-[34%] lg:w-[33%] flex gap-2.5 lg:gap-3`}
          >
            {([`${side}-a`, `${side}-b`] as Column[]).map((col) => (
              <div key={col} className="flex-1 flex flex-col justify-between gap-2.5 lg:gap-3">
                {WALL_PHOTOS.filter((p) => p.column === col).map((photo) => {
                  const isActive = activePhotoId === photo.id;
                  const clickable = photo.kind !== 'placeholder';
                  return (
                    <div
                      key={photo.id}
                      onClick={() => clickable && togglePhoto(photo.id)}
                      role={clickable ? 'button' : undefined}
                      tabIndex={clickable ? 0 : undefined}
                      aria-label={clickable ? `View photo: ${photo.caption}` : undefined}
                      className={`pointer-events-auto ${clickable ? 'cursor-pointer' : ''} w-full ${photo.aspect} transition-all duration-300 ease-out ${
                        isActive
                          ? 'z-50 scale-125 rotate-0 shadow-[0_30px_60px_-10px_rgba(0,0,0,0.9)] ring-4 ring-[#dfc270] rounded-lg'
                          : `${photo.rotation} z-10 shadow-[0_14px_28px_-8px_rgba(0,0,0,0.7)] ${
                              clickable ? 'hover:-translate-y-1.5 hover:scale-[1.06] hover:z-40 hover:rotate-0 hover:shadow-[0_22px_40px_-10px_rgba(0,0,0,0.85)]' : ''
                            }`
                      }`}
                    >
                      {/* Baked-in frame: image already contains its own illustrated frame */}
                      {photo.kind === 'baked' && (
                        <div className="w-full h-full rounded-md overflow-hidden bg-stone-900 relative">
                          <img src={photo.imgUrl} alt={photo.caption} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-gradient-to-br from-emerald-950/25 via-transparent to-amber-400/10 mix-blend-overlay pointer-events-none" />
                        </div>
                      )}

                      {/* Single consistent gold-trimmed wood frame for full-bleed scene photos */}
                      {photo.kind === 'wood' && (
                        <div className="w-full h-full p-[6px] rounded-sm bg-gradient-to-br from-[#c8a35a] via-[#8c6b32] to-[#4a3617] border border-[#f7e5b5]/40 relative">
                          <div className="w-full h-full overflow-hidden border border-black/40 bg-stone-900 relative">
                            <img src={photo.imgUrl} alt={photo.caption} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-gradient-to-br from-emerald-950/25 via-transparent to-amber-400/10 mix-blend-overlay pointer-events-none" />
                          </div>
                        </div>
                      )}

                      {/* Empty slot inviting the family to add their own photo */}
                      {photo.kind === 'placeholder' && (
                        <div className="w-full h-full p-[6px] rounded-sm bg-gradient-to-br from-[#c8a35a] via-[#8c6b32] to-[#4a3617] border border-[#f7e5b5]/40 border-dashed relative">
                          <div className="w-full h-full flex flex-col items-center justify-center text-center gap-1 bg-[#f7f1e3] px-2">
                            <PlusCircle size={16} className="text-[#8c6b32]" />
                            <p className="font-serif italic text-[9px] leading-tight text-stone-700">
                              Every empty frame is a story waiting to be told
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Tapped Active Badge Tooltip */}
                      {isActive && (
                        <div className="absolute -top-9 left-1/2 -translate-x-1/2 bg-[#102319]/95 text-amber-100 border border-[#dfc270] px-2.5 py-1 rounded-md text-[10px] font-serif whitespace-nowrap shadow-2xl flex items-center gap-1.5 z-50">
                          <span className="font-bold text-amber-200">{photo.caption}</span>
                          <X size={12} className="text-amber-300 ml-1 hover:text-white" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* ========================================================================= */}
      {/* CENTERPIECE: EMBEDDED TALL BRASS PICTURE FRAME LOGIN CARD */}
      {/* ========================================================================= */}
      <main className="relative z-30 w-full max-w-[370px] sm:max-w-[390px] p-3 sm:p-4 my-auto">
        {/* Outer Heavy Metallic Brass/Bronze Frame */}
        <div
          className="p-3 sm:p-3.5 rounded-2xl bg-gradient-to-b from-[#d4af37] via-[#8c6b32] to-[#4a3617] border-2 border-[#f7e5b5] shadow-2xl relative"
          style={{
            boxShadow: `
              0 30px 60px -12px rgba(0, 0, 0, 0.95),
              0 0 40px rgba(212, 175, 55, 0.25),
              inset 0 0 12px rgba(0,0,0,0.8)
            `,
          }}
        >
          {/* Inner Metallic Bevel Ring */}
          <div className="p-1 rounded-xl bg-gradient-to-b from-[#3a2c14] via-[#5c4620] to-[#241a0b] border border-[#a8863c]">
            {/* Inner Glass Plate — translucent so the emerald wall glow shows through */}
            <div
              className="backdrop-blur-md text-[#f4efe6] rounded-lg p-5 sm:p-6 border border-[#6e5527] relative shadow-inner"
              style={{
                backgroundColor: 'rgba(20, 17, 10, 0.72)',
                backgroundImage: `
                  radial-gradient(circle at 50% 20%, rgba(212, 175, 55, 0.18) 0%, rgba(10, 8, 5, 0.85) 100%)
                `,
              }}
            >
              {/* Top Gold Interlocking Emblem Logo */}
              <div className="text-center mb-3">
                <LegacyRingEmblem size={52} />
                <h1 className="font-serif text-2xl font-bold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-[#f7e5b5] via-[#d4af37] to-[#c5a059] mt-1 uppercase">
                  LEGACY LINK
                </h1>
                <p className="font-serif italic text-xs text-[#dfc270]/90 tracking-wide mt-0.5">
                  Welcome Back to Your Heritage
                </p>
              </div>

              {/* Mode Switcher Tabs (Log In, Join Family, Register) */}
              <div className="flex bg-[#120f09] p-1 rounded-lg mb-4 border border-[#584422] text-xs font-semibold text-[#c5a059]">
                <button
                  type="button"
                  onClick={() => switchMode('signin')}
                  className={`flex-1 py-1.5 rounded-md transition-all ${
                    mode === 'signin'
                      ? 'bg-gradient-to-r from-[#b8862e] via-[#e0b04a] to-[#b8862e] text-[#1f1608] shadow-md'
                      : 'hover:text-[#f7e5b5]'
                  }`}
                >
                  Log In
                </button>
                <button
                  type="button"
                  onClick={() => switchMode('join')}
                  className={`flex-1 py-1.5 rounded-md transition-all ${
                    mode === 'join'
                      ? 'bg-gradient-to-r from-[#b8862e] via-[#e0b04a] to-[#b8862e] text-[#1f1608] shadow-md'
                      : 'hover:text-[#f7e5b5]'
                  }`}
                >
                  Join Family
                </button>
                <button
                  type="button"
                  onClick={() => switchMode('register')}
                  className={`flex-1 py-1.5 rounded-md transition-all ${
                    mode === 'register'
                      ? 'bg-gradient-to-r from-[#b8862e] via-[#e0b04a] to-[#b8862e] text-[#1f1608] shadow-md'
                      : 'hover:text-[#f7e5b5]'
                  }`}
                >
                  Register
                </button>
              </div>

              {/* Error Message Display */}
              {error && (
                <div className="mb-3 text-xs text-red-200 bg-red-950/80 border border-red-700/60 rounded-lg p-2 text-center">
                  {error}
                </div>
              )}

              {/* Authentication Form preserving ALL Login Services */}
              <form onSubmit={handleSubmit} className="space-y-3">
                {(mode === 'join' || mode === 'register') && (
                  <div>
                    <div className="relative">
                      <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#c5a059]" />
                      <input
                        type="text"
                        required
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="Full Name"
                        autoComplete="name"
                        className="w-full pl-9 pr-3 py-2 bg-[#17130c] border border-[#5e4926] focus:border-[#d4af37] focus:bg-[#211b11] rounded-lg text-xs sm:text-sm text-[#f7e5b5] placeholder:text-[#8c7447] outline-none transition-all"
                      />
                    </div>
                  </div>
                )}

                {mode === 'register' && (
                  <div>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs">🌳</span>
                      <input
                        type="text"
                        required
                        value={familyName}
                        onChange={(e) => setFamilyName(e.target.value)}
                        placeholder="Family Tree Name"
                        className="w-full pl-9 pr-3 py-2 bg-[#17130c] border border-[#5e4926] focus:border-[#d4af37] focus:bg-[#211b11] rounded-lg text-xs sm:text-sm text-[#f7e5b5] placeholder:text-[#8c7447] outline-none transition-all"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <div className="relative">
                    <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#c5a059]" />
                    <input
                      type="text"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Username / Email Address"
                      autoComplete="username"
                      className="w-full pl-9 pr-3 py-2 bg-[#17130c] border border-[#5e4926] focus:border-[#d4af37] focus:bg-[#211b11] rounded-lg text-xs sm:text-sm text-[#f7e5b5] placeholder:text-[#8c7447] outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <div className="relative">
                    <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#c5a059]" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Password"
                      autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                      className="w-full pl-9 pr-9 py-2 bg-[#17130c] border border-[#5e4926] focus:border-[#d4af37] focus:bg-[#211b11] rounded-lg text-xs sm:text-sm text-[#f7e5b5] placeholder:text-[#8c7447] outline-none transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8c7447] hover:text-[#f7e5b5] transition-colors p-1"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                {mode === 'join' && (
                  <div>
                    <div className="relative">
                      <KeyRound size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#c5a059]" />
                      <input
                        type="text"
                        required
                        value={inviteCode}
                        onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                        placeholder="Invite Code (e.g. 7F3K9Q)"
                        className="w-full pl-9 pr-3 py-2 bg-[#17130c] border border-[#5e4926] focus:border-[#d4af37] focus:bg-[#211b11] rounded-lg text-xs sm:text-sm text-[#f7e5b5] placeholder:text-[#8c7447] outline-none transition-all tracking-wider"
                      />
                    </div>
                  </div>
                )}

                {mode === 'signin' && (
                  <div className="text-right -mt-1">
                    <button
                      type="button"
                      onClick={() => setShowRestore(true)}
                      className="text-[11px] text-[#c5a059] hover:text-[#f7e5b5] hover:underline"
                    >
                      Forgot Password?
                    </button>
                  </div>
                )}

                {/* Primary Action Warm Gold Sign In Button */}
                <button
                  type="submit"
                  disabled={loading || googleLoading}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#b8862e] via-[#e0b04a] to-[#b8862e] hover:brightness-110 text-[#1f1608] font-serif font-bold text-xs sm:text-sm py-2.5 rounded-lg shadow-lg border border-[#f7e5b5]/60 transition-all duration-200 disabled:opacity-60 cursor-pointer mt-2"
                >
                  {loading ? (
                    <Loader2 size={16} className="animate-spin text-[#1f1608]" />
                  ) : (
                    <>
                      <span>
                        {mode === 'signin' && 'Sign In'}
                        {mode === 'join' && 'Join Family'}
                        {mode === 'register' && 'Register Family'}
                      </span>
                      <ArrowRight size={15} />
                    </>
                  )}
                </button>
              </form>

              {/* Google Sign-in Action */}
              <div className="mt-2.5">
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={loading || googleLoading}
                  className="w-full flex items-center justify-center gap-2.5 bg-[#17130c] hover:bg-[#231c12] text-[#f7e5b5] font-sans font-medium text-xs sm:text-sm py-2 rounded-lg border border-[#5e4926] hover:border-[#d4af37] shadow-md transition-all duration-200 disabled:opacity-60 cursor-pointer"
                >
                  {googleLoading ? (
                    <Loader2 size={15} className="animate-spin text-[#d4af37]" />
                  ) : (
                    <>
                      <GoogleIcon size={15} />
                      <span>
                        {mode === 'signin' && 'Sign in with Google'}
                        {mode === 'join' && 'Join with Google'}
                        {mode === 'register' && 'Register with Google'}
                      </span>
                    </>
                  )}
                </button>
              </div>

              <div className="relative my-3">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[#4a391c]" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-[#1a160e] px-2 font-sans text-[10px] uppercase text-[#8c7447]">
                    OR
                  </span>
                </div>
              </div>

              {/* Guest Live Demo Action */}
              <div className="text-center">
                <button
                  type="button"
                  onClick={continueAsDemo}
                  className="text-xs text-[#dfc270] hover:text-[#f7e5b5] hover:underline font-medium transition-colors"
                >
                  Explore Live Demo as Guest →
                </button>
              </div>

              {/* Tagline inside central frame matching uploaded picture */}
              <div className="mt-4 pt-3 border-t border-[#3e3019] text-center">
                <p className="text-[10px] font-serif italic text-[#c5a059]/80 tracking-wider">
                  Securely Connecting Generations
                </p>
              </div>
            </div>
          </div>
        </div>

        {!isOnlineMode && (
          <p className="text-center text-[10px] text-stone-400 mt-2">
            Standalone local mode — data saved on device.
          </p>
        )}
      </main>

      {/* "Forgot password?" — redeem an admin-issued restoration code */}
      {showRestore && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-sm bg-[#1a160e] border border-[#4a391c] rounded-2xl shadow-2xl p-5 relative">
            <button
              type="button"
              onClick={closeRestore}
              className="absolute right-3 top-3 text-[#8c7447] hover:text-[#f7e5b5]"
            >
              <X size={16} />
            </button>

            {restoreSuccess ? (
              <div className="text-center py-4">
                <KeyRound size={28} className="mx-auto text-[#d4af37] mb-3" />
                <p className="text-sm text-[#f7e5b5] font-medium">Password updated</p>
                <p className="text-xs text-[#c5a059] mt-2 leading-relaxed">
                  You can now sign in with your email and your new password.
                </p>
                <button
                  type="button"
                  onClick={closeRestore}
                  className="mt-4 w-full bg-gradient-to-r from-[#b8862e] via-[#e0b04a] to-[#b8862e] hover:brightness-110 text-[#1f1608] font-serif font-bold text-xs sm:text-sm py-2.5 rounded-lg shadow-lg border border-[#f7e5b5]/60"
                >
                  Back to sign in
                </button>
              </div>
            ) : (
              <form onSubmit={handleRestoreSubmit} className="space-y-3">
                <div className="text-center mb-1">
                  <KeyRound size={22} className="mx-auto text-[#d4af37] mb-2" />
                  <p className="font-serif text-base text-[#f7e5b5]">Have a restoration code?</p>
                  <p className="text-[11px] text-[#8c7447] mt-1 leading-relaxed">
                    Ask your family admin for a one-time restoration code, then set a new password below.
                  </p>
                </div>

                {restoreError && (
                  <p className="text-[11px] text-red-400 bg-red-950/40 border border-red-900 rounded-lg px-3 py-2">{restoreError}</p>
                )}

                <div className="relative">
                  <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#c5a059]" />
                  <input
                    type="email" required value={restoreEmail} onChange={(e) => setRestoreEmail(e.target.value)}
                    placeholder="Your account email" autoComplete="email"
                    className="w-full pl-9 pr-3 py-2 bg-[#17130c] border border-[#5e4926] focus:border-[#d4af37] focus:bg-[#211b11] rounded-lg text-xs sm:text-sm text-[#f7e5b5] placeholder:text-[#8c7447] outline-none transition-all"
                  />
                </div>

                <div className="relative">
                  <KeyRound size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#c5a059]" />
                  <input
                    type="text" required value={restoreCode} onChange={(e) => setRestoreCode(e.target.value.toUpperCase())}
                    placeholder="Restoration Code (e.g. 7F3K9Q)"
                    className="w-full pl-9 pr-3 py-2 bg-[#17130c] border border-[#5e4926] focus:border-[#d4af37] focus:bg-[#211b11] rounded-lg text-xs sm:text-sm text-[#f7e5b5] placeholder:text-[#8c7447] outline-none transition-all tracking-wider"
                  />
                </div>

                <div className="relative">
                  <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#c5a059]" />
                  <input
                    type="password" required value={restoreNewPassword} onChange={(e) => setRestoreNewPassword(e.target.value)}
                    placeholder="New password" autoComplete="new-password"
                    className="w-full pl-9 pr-3 py-2 bg-[#17130c] border border-[#5e4926] focus:border-[#d4af37] focus:bg-[#211b11] rounded-lg text-xs sm:text-sm text-[#f7e5b5] placeholder:text-[#8c7447] outline-none transition-all"
                  />
                </div>

                <button
                  type="submit"
                  disabled={restoreLoading}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#b8862e] via-[#e0b04a] to-[#b8862e] hover:brightness-110 text-[#1f1608] font-serif font-bold text-xs sm:text-sm py-2.5 rounded-lg shadow-lg border border-[#f7e5b5]/60 transition-all duration-200 disabled:opacity-60 mt-1"
                >
                  {restoreLoading ? <Loader2 size={16} className="animate-spin" /> : <span>Set new password</span>}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

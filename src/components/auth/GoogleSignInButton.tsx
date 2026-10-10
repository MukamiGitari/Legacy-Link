import React, { useEffect, useRef, useState } from 'react';
import { api } from '../../lib/api';

interface GoogleIdApi {
  initialize: (config: { client_id: string; callback: (r: { credential: string }) => void; ux_mode?: 'popup' }) => void;
  renderButton: (el: HTMLElement, options: Record<string, unknown>) => void;
}
declare global {
  interface Window { google?: { accounts: { id: GoogleIdApi } } }
}

const GSI_SRC = 'https://accounts.google.com/gsi/client';
let gsiLoading: Promise<void> | null = null;

function loadGsi(): Promise<void> {
  if (window.google?.accounts?.id) return Promise.resolve();
  if (gsiLoading) return gsiLoading;
  gsiLoading = new Promise<void>((resolve, reject) => {
    const s = document.createElement('script');
    s.src = GSI_SRC;
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    s.onerror = () => { gsiLoading = null; reject(new Error('Could not load Google sign-in')); };
    document.head.appendChild(s);
  });
  return gsiLoading;
}

// The client ID is public and served by the API, so it only has to be set in one place (the worker).
let clientIdPromise: Promise<string | null> | null = null;
function fetchClientId(): Promise<string | null> {
  if (!clientIdPromise) {
    clientIdPromise = api.get<{ googleClientId: string | null }>('/auth/config')
      .then(r => r.googleClientId || null)
      .catch(() => { clientIdPromise = null; return null; });
  }
  return clientIdPromise;
}

interface Props {
  mode: 'signin' | 'join' | 'register';
  /** Called with Google's ID token once the person has picked an account. */
  onCredential: (credential: string) => void;
  disabled?: boolean;
}

/** Google's own "Sign in with Google" button, rendered by Google Identity Services. */
export const GoogleSignInButton: React.FC<Props> = ({ mode, onCredential, disabled }) => {
  const holderRef = useRef<HTMLDivElement>(null);
  const callbackRef = useRef(onCredential);
  callbackRef.current = onCredential;
  const [state, setState] = useState<'loading' | 'ready' | 'off' | 'error'>('loading');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const clientId = await fetchClientId();
      if (cancelled) return;
      if (!clientId) { setState('off'); return; }
      try {
        await loadGsi();
        if (cancelled || !holderRef.current || !window.google) return;
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (r) => callbackRef.current(r.credential),
        });
        holderRef.current.innerHTML = '';
        const width = Math.min(360, Math.max(200, holderRef.current.clientWidth || 300));
        window.google.accounts.id.renderButton(holderRef.current, {
          type: 'standard',
          theme: 'filled_black',
          size: 'large',
          shape: 'pill',
          width,
          text: mode === 'signin' ? 'signin_with' : mode === 'register' ? 'signup_with' : 'continue_with',
        });
        setState('ready');
      } catch {
        if (!cancelled) setState('error');
      }
    })();
    return () => { cancelled = true; };
  }, [mode]);

  if (state === 'off') {
    return (
      <p className="text-center text-[11px] text-[#c9b88a]/70 py-1">
        Google sign-in isn't switched on for this family yet.
      </p>
    );
  }
  if (state === 'error') {
    return (
      <p className="text-center text-[11px] text-red-300 py-1">
        Couldn't load Google sign-in. Check your connection or any content blocker, then refresh.
      </p>
    );
  }
  return (
    <div className={`flex justify-center min-h-[44px] ${disabled ? 'opacity-60 pointer-events-none' : ''}`}>
      <div ref={holderRef} className="w-full flex justify-center" />
    </div>
  );
};

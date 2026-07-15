import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables are required. ' +
    'Create a .env file with these values from your Supabase project settings.'
  )
}

// Wraps the browser's fetch so EVERY request Supabase makes — auth,
// database queries, file storage, from any page in the app — is forced
// to give up after 10 seconds instead of hanging forever. Without this,
// a single stale connection (e.g. after the phone locks or the tab sits
// idle for a while) can leave the app stuck on a loading spinner forever,
// with no way to recover except a manual page refresh.
const fetchWithTimeout = (input, init = {}, timeoutMs = 10000) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(input, { ...init, signal: controller.signal }).finally(() =>
    clearTimeout(id)
  );
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
  global: {
    fetch: (input, init) => fetchWithTimeout(input, init, 10000),
  },
});

// When the phone locks, the app is switched away from, or the tab sits
// idle, Supabase's background token-refresh timer pauses and can leave
// the connection stale. startAutoRefresh()/stopAutoRefresh() are
// Supabase's own methods for properly resuming that cycle the moment
// the app becomes visible again, instead of leaving it dead until a
// manual page refresh.
if (typeof document !== "undefined") {
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      supabase.auth.startAutoRefresh();
    } else {
      supabase.auth.stopAutoRefresh();
    }
  });
}

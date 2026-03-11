"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useMemo,
  useState
} from "react";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile
} from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { auth, db, hasFirebaseConfig } from "../../../lib/firebase-client";

const FirebaseAuthContext = createContext(null);
const SESSION_STORAGE_KEY = "geo-auth-active-session-id";
const SESSION_TTL_HOURS = 2;
const SESSION_HEARTBEAT_MS = 60 * 1000;

function ensureFirebaseReady() {
  if (!hasFirebaseConfig || !auth || !db) {
    throw new Error("Firebase nao configurado. Defina NEXT_PUBLIC_FIREBASE_* no .env.local.");
  }
}

function buildSessionId() {
  const prefix = "sess";
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}_${crypto.randomUUID().replace(/-/g, "")}`;
  }
  const random = Math.floor(Math.random() * 1_000_000_000)
    .toString(36)
    .padStart(8, "0");
  return `${prefix}_${Date.now().toString(36)}${random}`;
}

function getNowIso() {
  return new Date().toISOString();
}

function getExpiresAtIso() {
  const expiration = new Date(Date.now() + SESSION_TTL_HOURS * 60 * 60 * 1000);
  return expiration.toISOString();
}

function isSessionExpired(expiresAt) {
  if (!expiresAt) {
    return true;
  }
  const timestamp = Date.parse(String(expiresAt));
  if (!Number.isFinite(timestamp)) {
    return true;
  }
  return timestamp <= Date.now();
}

function getIdentity(user, profile) {
  const username =
    profile?.username ||
    profile?.display_name ||
    user?.displayName ||
    (user?.email ? user.email.split("@")[0] : null) ||
    user?.uid ||
    null;

  return {
    username,
    email: user?.email || profile?.email || null,
    role: profile?.role || "user"
  };
}

function getPreferences() {
  const language = typeof navigator !== "undefined" ? navigator.language || "pt-BR" : "pt-BR";
  let theme = "light";

  if (typeof window !== "undefined") {
    try {
      theme = window.localStorage.getItem("theme") || "light";
    } catch (_error) {
      theme = "light";
    }
  }

  return {
    language,
    theme
  };
}

function getMfaVerified(user) {
  const enrolled = user?.multiFactor?.enrolledFactors;
  return Array.isArray(enrolled) && enrolled.length > 0;
}

async function getAuthContext() {
  const fallbackUserAgent = typeof navigator !== "undefined" ? navigator.userAgent : null;
  const base = {
    ipAddress: null,
    userAgent: fallbackUserAgent,
    mfaVerified: false
  };

  if (typeof window === "undefined") {
    return base;
  }

  try {
    const response = await fetch("/api/auth/session-context", { cache: "no-store" });
    if (!response.ok) {
      return base;
    }
    const payload = await response.json();
    return {
      ipAddress: payload?.ipAddress || base.ipAddress,
      userAgent: payload?.userAgent || base.userAgent,
      mfaVerified: false
    };
  } catch (_error) {
    return base;
  }
}

async function upsertUserDocument(user, extra = {}) {
  if (!db || !user?.uid) {
    return;
  }

  const ref = doc(db, "users", user.uid);
  const current = await getDoc(ref);
  const now = serverTimestamp();

  const basePayload = {
    uid: user.uid,
    email: user.email || null,
    display_name: user.displayName || null,
    updated_at: now,
    last_login_at: now,
    ...extra
  };

  if (!current.exists()) {
    await setDoc(ref, {
      ...basePayload,
      created_at: now
    });
    return;
  }

  await setDoc(ref, basePayload, { merge: true });
}

export function FirebaseAuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const bootstrappedSessionRef = useRef(false);

  const loadProfile = useCallback(async (uid) => {
    if (!db || !uid) {
      return null;
    }
    const snapshot = await getDoc(doc(db, "users", uid));
    return snapshot.exists() ? snapshot.data() : null;
  }, []);

  const closeSession = useCallback(async (sessionId, metadata = {}) => {
    if (!db || !sessionId) {
      return;
    }

    const now = getNowIso();
    await updateDoc(doc(db, "sessions", String(sessionId)), {
      active: false,
      "timestamps.lastActiveAt": now,
      "timestamps.closed_at": now,
      updated_at: now,
      ...metadata
    });
  }, []);

  const touchSession = useCallback(async (sessionId) => {
    if (!db || !sessionId) {
      return;
    }

    const now = getNowIso();
    await updateDoc(doc(db, "sessions", String(sessionId)), {
      "timestamps.lastActiveAt": now,
      "timestamps.expiresAt": getExpiresAtIso(),
      updated_at: now
    });
  }, []);

  const createSession = useCallback(async (user, resolvedProfile) => {
    if (!db || !user?.uid) {
      return null;
    }

    const now = getNowIso();
    const sessionId = buildSessionId();
    const authContext = await getAuthContext();
    const identity = getIdentity(user, resolvedProfile);

    const payload = {
      sessionId,
      active: true,
      userId: user.uid,
      identity,
      auth: {
        ipAddress: authContext.ipAddress || null,
        userAgent: authContext.userAgent || null,
        mfaVerified: getMfaVerified(user)
      },
      timestamps: {
        createdAt: now,
        lastActiveAt: now,
        expiresAt: getExpiresAtIso(),
        closed_at: ""
      },
      preferences: getPreferences(),
      created_at: now,
      updated_at: now
    };

    await setDoc(doc(db, "sessions", sessionId), payload);

    if (typeof window !== "undefined") {
      window.localStorage.setItem(SESSION_STORAGE_KEY, sessionId);
    }

    return payload;
  }, []);

  const ensureSession = useCallback(async (user, resolvedProfile) => {
    if (!db || !user?.uid) {
      return null;
    }

    const storedId =
      typeof window !== "undefined" ? window.localStorage.getItem(SESSION_STORAGE_KEY) : null;

    if (storedId) {
      try {
        const snapshot = await getDoc(doc(db, "sessions", storedId));
        if (snapshot.exists()) {
          const existing = snapshot.data();
          const isSameUser = String(existing?.userId) === String(user.uid);
          const isActive = Boolean(existing?.active);
          if (isSameUser && isActive && !isSessionExpired(existing?.timestamps?.expiresAt)) {
            await touchSession(storedId);
            const nextSession = {
              ...existing,
              active: true,
              timestamps: {
                ...(existing?.timestamps || {}),
                lastActiveAt: getNowIso(),
                expiresAt: getExpiresAtIso()
              }
            };
            setSession(nextSession);
            return nextSession;
          }
        }
      } catch (_error) {
        // fall through to create new session
      }

      if (typeof window !== "undefined") {
        window.localStorage.removeItem(SESSION_STORAGE_KEY);
      }
    }

    const created = await createSession(user, resolvedProfile);
    setSession(created);
    return created;
  }, [createSession, touchSession]);

  useEffect(() => {
    if (!hasFirebaseConfig || !auth) {
      setLoading(false);
      return () => undefined;
    }

    const unsubscribe = onAuthStateChanged(auth, async (nextUser) => {
      setCurrentUser(nextUser || null);
      setError(null);
      bootstrappedSessionRef.current = false;

      if (!nextUser) {
        setProfile(null);
        setSession(null);
        if (typeof window !== "undefined") {
          window.localStorage.removeItem(SESSION_STORAGE_KEY);
        }
        setLoading(false);
        return;
      }

      try {
        const nextProfile = await loadProfile(nextUser.uid);
        setProfile(nextProfile);
        await ensureSession(nextUser, nextProfile);
        bootstrappedSessionRef.current = true;
      } catch (profileError) {
        setError(profileError);
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, [ensureSession, loadProfile]);

  const signUp = useCallback(async ({ email, password, displayName = null, userData = {} }) => {
    ensureFirebaseReady();
    setError(null);

    const credential = await createUserWithEmailAndPassword(auth, email, password);
    const user = credential.user;

    if (displayName) {
      await updateProfile(user, { displayName });
    }

    await upsertUserDocument(
      {
        ...user,
        displayName: displayName || user.displayName || null
      },
      userData
    );

    const nextProfile = await loadProfile(user.uid);
    setProfile(nextProfile);
    setCurrentUser(user);
    return user;
  }, [loadProfile]);

  const signIn = useCallback(async ({ email, password }) => {
    ensureFirebaseReady();
    setError(null);

    const credential = await signInWithEmailAndPassword(auth, email, password);
    const user = credential.user;
    await upsertUserDocument(user);

    const nextProfile = await loadProfile(user.uid);
    setProfile(nextProfile);
    setCurrentUser(user);
    return user;
  }, [loadProfile]);

  const signOutUser = useCallback(async () => {
    ensureFirebaseReady();
    setError(null);

    const sessionId =
      session?.sessionId ||
      (typeof window !== "undefined" ? window.localStorage.getItem(SESSION_STORAGE_KEY) : null);

    if (sessionId) {
      try {
        await closeSession(sessionId);
      } catch (closeError) {
        console.error("Failed to close session", closeError);
      }
    }

    await signOut(auth);
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(SESSION_STORAGE_KEY);
    }
    setProfile(null);
    setCurrentUser(null);
    setSession(null);
  }, [closeSession, session?.sessionId]);

  useEffect(() => {
    if (!currentUser || !session?.sessionId || !session?.active || !bootstrappedSessionRef.current) {
      return () => undefined;
    }

    const timer = setInterval(async () => {
      try {
        await touchSession(session.sessionId);
      } catch (touchError) {
        setError(touchError);
      }
    }, SESSION_HEARTBEAT_MS);

    return () => {
      clearInterval(timer);
    };
  }, [currentUser, session?.active, session?.sessionId, touchSession]);

  const value = useMemo(
    () => ({
      currentUser,
      profile,
      session,
      loading,
      error,
      isConfigured: hasFirebaseConfig,
      signUp,
      signIn,
      signOut: signOutUser
    }),
    [currentUser, profile, session, loading, error, signUp, signIn, signOutUser]
  );

  return <FirebaseAuthContext.Provider value={value}>{children}</FirebaseAuthContext.Provider>;
}

export function useFirebaseAuth() {
  const context = useContext(FirebaseAuthContext);
  if (!context) {
    throw new Error("useFirebaseAuth must be used inside FirebaseAuthProvider");
  }
  return context;
}

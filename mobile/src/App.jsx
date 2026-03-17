import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut
} from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import InstallAppButton from "./components/install-app-button";
import { useNetworkStatus } from "./hooks/use-network-status";
import { auth, db, hasFirebaseConfig } from "./lib/firebase";
import {
  getLocalResearcherProfile,
  listCachedOpenResearchEvents,
  listLocalSubscriptions,
  markLocalSubscription,
  queuePendingMutation,
  saveLocalResearcherProfile
} from "./lib/local-db";
import { syncAll } from "./lib/research-sync";
import OpenResearchesPage from "./pages/open-researches-page";
import ProfilePage from "./pages/profile-page";

const FIRESTORE_USERS_COLLECTION = "users";

const EMPTY_PROFILE = {
  name: "",
  rg: "",
  cpf: "",
  home_address: "",
  work_address: ""
};

function toSubscriptionMap(items = []) {
  const map = {};
  for (const item of items) {
    const eventId = String(item?.event_id || "");
    if (!eventId) {
      continue;
    }
    map[eventId] = {
      status: String(item?.status || "PENDING_SYNC"),
      reason: String(item?.reason || "")
    };
  }
  return map;
}

export default function App() {
  const isOnline = useNetworkStatus();
  const pendingResearcherCreationRef = useRef(false);

  const [authLoading, setAuthLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState("profile");
  const [events, setEvents] = useState([]);
  const [profileForm, setProfileForm] = useState(EMPTY_PROFILE);
  const [subscriptionsByEvent, setSubscriptionsByEvent] = useState({});
  const [syncing, setSyncing] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [message, setMessage] = useState("");

  const [authMode, setAuthMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authSubmitting, setAuthSubmitting] = useState(false);

  const canSync = useMemo(
    () => Boolean(currentUser?.uid && isOnline && hasFirebaseConfig),
    [currentUser?.uid, isOnline]
  );

  const ensureResearcherAccess = useCallback(async (user, options = {}) => {
    if (!user?.uid || !db) {
      return false;
    }

    const allowCreate = Boolean(options?.allowCreateWhenMissing);
    const userRef = doc(db, FIRESTORE_USERS_COLLECTION, String(user.uid));
    const snapshot = await getDoc(userRef);

    if (!snapshot.exists()) {
      if (!allowCreate) {
        return false;
      }

      await setDoc(
        userRef,
        {
          uid: String(user.uid),
          email: String(user.email || ""),
          display_name: String(user.displayName || user.email || ""),
          type: "researcher",
          role: "researcher",
          created_at: serverTimestamp(),
          updated_at: serverTimestamp(),
          last_login_at: serverTimestamp()
        },
        { merge: true }
      );
      return true;
    }

    const data = snapshot.data() || {};
    const userType = String(data?.type || "").toLowerCase();
    if (userType !== "researcher") {
      return false;
    }

    await setDoc(
      userRef,
      {
        uid: String(user.uid),
        email: String(user.email || data?.email || ""),
        updated_at: serverTimestamp(),
        last_login_at: serverTimestamp()
      },
      { merge: true }
    );

    return true;
  }, []);

  const loadLocalState = useCallback(async (uid) => {
    const [localProfile, localEvents, localSubscriptions] = await Promise.all([
      getLocalResearcherProfile(uid),
      listCachedOpenResearchEvents(),
      listLocalSubscriptions(uid)
    ]);

    setProfileForm({
      name: String(localProfile?.name || ""),
      rg: String(localProfile?.rg || ""),
      cpf: String(localProfile?.cpf || ""),
      home_address: String(localProfile?.home_address || ""),
      work_address: String(localProfile?.work_address || "")
    });
    setEvents(localEvents);
    setSubscriptionsByEvent(toSubscriptionMap(localSubscriptions));
  }, []);

  const runSync = useCallback(async () => {
    if (!currentUser?.uid || !hasFirebaseConfig || !isOnline) {
      return;
    }

    setSyncing(true);
    try {
      const result = await syncAll(currentUser.uid);
      await loadLocalState(currentUser.uid);
      setMessage(
        `Sync ok: eventos=${result.eventsPulled}, mutacoes processadas=${result.processedMutations}, falhas=${result.failedMutations}`
      );
    } catch (error) {
      setMessage(`Falha de sincronizacao: ${error?.message || "erro inesperado"}`);
    } finally {
      setSyncing(false);
    }
  }, [currentUser?.uid, isOnline, loadLocalState]);

  useEffect(() => {
    if (!hasFirebaseConfig || !auth) {
      setAuthLoading(false);
      return () => undefined;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setCurrentUser(null);
        setProfileForm(EMPTY_PROFILE);
        setEvents([]);
        setSubscriptionsByEvent({});
        setAuthLoading(false);
        return;
      }

      try {
        const canAccessMobile = await ensureResearcherAccess(user, {
          allowCreateWhenMissing: pendingResearcherCreationRef.current
        });
        pendingResearcherCreationRef.current = false;

        if (!canAccessMobile) {
          await signOut(auth);
          setCurrentUser(null);
          setMessage("Acesso mobile permitido somente para usuarios com type: researcher.");
          setAuthLoading(false);
          return;
        }

        setCurrentUser(user);
        await loadLocalState(user.uid);
      } catch (error) {
        setCurrentUser(null);
        setMessage(error?.message || "Falha ao validar acesso do pesquisador.");
      } finally {
        setAuthLoading(false);
      }
    });

    return unsubscribe;
  }, [ensureResearcherAccess, loadLocalState]);

  useEffect(() => {
    if (!currentUser?.uid || !isOnline) {
      return;
    }

    runSync();
  }, [currentUser?.uid, isOnline, runSync]);

  const handleAuthSubmit = useCallback(async () => {
    if (!hasFirebaseConfig || !auth) {
      setMessage("Firebase nao configurado no mobile/.env");
      return;
    }

    setAuthSubmitting(true);
    setMessage("");
    try {
      if (authMode === "register") {
        pendingResearcherCreationRef.current = true;
        const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
        await ensureResearcherAccess(credential.user, { allowCreateWhenMissing: true });
        pendingResearcherCreationRef.current = false;
      } else {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      }
      setEmail("");
      setPassword("");
      setMessage(authMode === "register" ? "Cadastro concluido." : "Login realizado.");
    } catch (error) {
      pendingResearcherCreationRef.current = false;
      setMessage(error?.message || "Falha de autenticacao");
    } finally {
      setAuthSubmitting(false);
    }
  }, [authMode, email, password, ensureResearcherAccess]);

  const handleSaveProfile = useCallback(async () => {
    if (!currentUser?.uid) {
      return;
    }

    setSavingProfile(true);
    try {
      await saveLocalResearcherProfile({
        uid: currentUser.uid,
        ...profileForm
      });

      setMessage("Perfil salvo localmente.");
      if (isOnline) {
        await runSync();
      }
    } catch (error) {
      setMessage(`Erro ao salvar perfil: ${error?.message || "erro"}`);
    } finally {
      setSavingProfile(false);
    }
  }, [currentUser?.uid, isOnline, profileForm, runSync]);

  const handleSubscribe = useCallback(
    async (eventItem) => {
      if (!currentUser?.uid) {
        return;
      }

      const eventId = String(eventItem?.id || "");
      if (!eventId) {
        return;
      }

      const existing = subscriptionsByEvent[eventId];
      if (existing && existing.status !== "REJECTED") {
        return;
      }

      try {
        await markLocalSubscription({
          uid: currentUser.uid,
          eventId,
          status: "PENDING_SYNC"
        });

        await queuePendingMutation("SUBSCRIBE_EVENT", {
          uid: currentUser.uid,
          event_id: eventId,
          researcher_name: profileForm.name || ""
        });

        setSubscriptionsByEvent((prev) => ({
          ...prev,
          [eventId]: {
            status: "PENDING_SYNC",
            reason: ""
          }
        }));

        setMessage("Inscricao salva localmente.");
        if (isOnline) {
          await runSync();
        }
      } catch (error) {
        setMessage(`Erro ao inscrever: ${error?.message || "erro"}`);
      }
    },
    [currentUser?.uid, isOnline, profileForm.name, runSync, subscriptionsByEvent]
  );

  if (!hasFirebaseConfig) {
    return (
      <main className="app-shell">
        <section className="panel">
          <h1>Geo Mobile</h1>
          <p className="muted">Configure as variaveis VITE_FIREBASE_* no arquivo mobile/.env.</p>
        </section>
      </main>
    );
  }

  if (authLoading) {
    return (
      <main className="app-shell">
        <section className="panel">
          <h1>Geo Mobile</h1>
          <p className="muted">Carregando...</p>
        </section>
      </main>
    );
  }

  if (!currentUser) {
    return (
      <main className="app-shell">
        <section className="panel auth-panel">
          <h1>Geo Mobile</h1>
          <p className="muted">Acesso do pesquisador</p>

          <div className="auth-switch">
            <button
              type="button"
              className={`btn ${authMode === "login" ? "" : "btn-outline"}`}
              onClick={() => setAuthMode("login")}
            >
              Entrar
            </button>
            <button
              type="button"
              className={`btn ${authMode === "register" ? "" : "btn-outline"}`}
              onClick={() => setAuthMode("register")}
            >
              Registrar
            </button>
          </div>

          <label>
            Email
            <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" required />
          </label>

          <label>
            Senha
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              minLength={6}
              required
            />
          </label>

          <button type="button" className="btn" onClick={handleAuthSubmit} disabled={authSubmitting}>
            {authSubmitting ? "Processando..." : authMode === "register" ? "Criar conta" : "Entrar"}
          </button>

          {message ? <p className="status-line">{message}</p> : null}
        </section>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <header className="panel header-panel">
        <div>
          <h1>Geo Mobile</h1>
          <p className="muted">Usuario: {currentUser.email}</p>
          <p className={`muted ${isOnline ? "ok" : "warn"}`}>{isOnline ? "Online" : "Offline"}</p>
        </div>

        <div className="header-actions">
          <InstallAppButton />
          <button type="button" className="btn btn-outline" onClick={runSync} disabled={!canSync || syncing}>
            {syncing ? "Sincronizando..." : "Sincronizar"}
          </button>
          <button
            type="button"
            className="btn btn-outline"
            onClick={async () => {
              await signOut(auth);
            }}
          >
            Sair
          </button>
        </div>
      </header>

      <nav className="tab-row">
        <button
          type="button"
          className={`tab ${activeTab === "profile" ? "active" : ""}`}
          onClick={() => setActiveTab("profile")}
        >
          Perfil
        </button>
        <button
          type="button"
          className={`tab ${activeTab === "researches" ? "active" : ""}`}
          onClick={() => setActiveTab("researches")}
        >
          Pesquisas abertas
        </button>
      </nav>

      {message ? <p className="status-line">{message}</p> : null}

      {activeTab === "profile" ? (
        <ProfilePage
          value={profileForm}
          saving={savingProfile}
          onChange={(field, value) => {
            setProfileForm((prev) => ({
              ...prev,
              [field]: value
            }));
          }}
          onSave={handleSaveProfile}
        />
      ) : (
        <OpenResearchesPage
          events={events}
          subscriptionsByEvent={subscriptionsByEvent}
          syncing={syncing}
          onRefresh={runSync}
          onSubscribe={handleSubscribe}
        />
      )}
    </main>
  );
}

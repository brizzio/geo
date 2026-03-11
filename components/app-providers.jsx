"use client";

import { FirebaseAuthProvider } from "../features/auth/state/firebase-auth-context";
import { DomainStateProvider } from "../features/domain/state/domain-state";

export default function AppProviders({ children }) {
  return (
    <FirebaseAuthProvider>
      <DomainStateProvider>{children}</DomainStateProvider>
    </FirebaseAuthProvider>
  );
}

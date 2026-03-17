"use client";

import { FirebaseAuthProvider } from "../features/auth/state/firebase-auth-context";
import { DomainStateProvider } from "../features/domain/state/domain-state";
import { MobileResearchProvider } from "../features/mobile/state/mobile-research-state";

export default function AppProviders({ children }) {
  return (
    <FirebaseAuthProvider>
      <DomainStateProvider>
        <MobileResearchProvider>{children}</MobileResearchProvider>
      </DomainStateProvider>
    </FirebaseAuthProvider>
  );
}

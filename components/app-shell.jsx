"use client";

import Link from "next/link";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useFirebaseAuth } from "../features/auth/state/firebase-auth-context";
import { useDomainActions } from "../features/domain/hooks/use-domain-actions";
import { useDomainState } from "../features/domain/state/domain-state";

function Icon({ children }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={"h-[18px] w-[18px]"}
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

const NAV_ITEMS = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: (
      <Icon>
        <rect x="3" y="3" width="8" height="8" />
        <rect x="13" y="3" width="8" height="5" />
        <rect x="13" y="10" width="8" height="11" />
        <rect x="3" y="13" width="8" height="8" />
      </Icon>
    )
  },
  {
    href: "/accounts",
    label: "Conta",
    icon: (
      <Icon>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 20a8 8 0 0 1 16 0" />
      </Icon>
    )
  },
  {
    href: "/users",
    label: "Times",
    icon: (
      <Icon>
        <circle cx="8" cy="8" r="2.5" />
        <circle cx="16" cy="8" r="2.5" />
        <path d="M3.5 19a4.5 4.5 0 0 1 9 0" />
        <path d="M11.5 19a4.5 4.5 0 0 1 9 0" />
      </Icon>
    )
  },
  {
    href: "/networks",
    label: "Redes",
    icon: (
      <Icon>
        <circle cx="6" cy="6" r="2.5" />
        <circle cx="18" cy="6" r="2.5" />
        <circle cx="12" cy="18" r="2.5" />
        <path d="M8 7.5l2.8 7" />
        <path d="M16 7.5l-2.8 7" />
      </Icon>
    )
  },
  {
    href: "/banners",
    label: "Bandeira",
    icon: (
      <Icon>
        <path d="M5 4v16" />
        <path d="M5 5c4 0 4 2 8 2s4-2 8-2v8c-4 0-4 2-8 2s-4-2-8-2" />
      </Icon>
    )
  },
  {
    href: "/stores",
    matchPrefixes: ["/stores"],
    excludePrefixes: ["/stores/competitors"],
    label: "Lojas",
    icon: (
      <Icon>
        <path d="M3 10h18" />
        <path d="M5 10v10h14V10" />
        <path d="M4 10l1-5h14l1 5" />
        <path d="M9 20v-5h6v5" />
      </Icon>
    )
  },
  {
    href: "/competitors",
    matchPrefixes: ["/competitors", "/stores/competitors"],
    label: "Concorr.",
    icon: (
      <Icon>
        <circle cx="8" cy="8" r="3" />
        <circle cx="16" cy="8" r="3" />
        <path d="M4 20a4 4 0 0 1 8 0" />
        <path d="M12 20a4 4 0 0 1 8 0" />
      </Icon>
    )
  },
  {
    href: "/clusters",
    matchPrefixes: ["/clusters"],
    label: "Clusters",
    icon: (
      <Icon>
        <rect x="3" y="3" width="6" height="6" />
        <rect x="15" y="3" width="6" height="6" />
        <rect x="9" y="15" width="6" height="6" />
        <path d="M9 6h6" />
        <path d="M12 9v6" />
      </Icon>
    )
  },
  {
    href: "/researches",
    matchPrefixes: ["/researches"],
    label: "Pesquisas",
    icon: (
      <Icon>
        <circle cx="11" cy="11" r="7" />
        <path d="M21 21l-4.3-4.3" />
        <path d="M8 11h6" />
        <path d="M11 8v6" />
      </Icon>
    )
  },
  {
    href: "/products",
    matchPrefixes: ["/products"],
    label: "Produtos",
    icon: (
      <Icon>
        <path d="M12 3l8 4.5-8 4.5-8-4.5L12 3z" />
        <path d="M4 7.5V16.5L12 21l8-4.5V7.5" />
        <path d="M12 12v9" />
      </Icon>
    )
  }
];

function isHiddenPath(pathname) {
  if (!pathname) {
    return false;
  }
  return (
    pathname === "/" ||
    pathname === "/mobile" ||
    pathname.startsWith("/dash-mobile") ||
    pathname.startsWith("/profile-mobile") ||
    pathname.startsWith("/history-mobile") ||
    pathname.startsWith("/task-mobile") ||
    pathname.startsWith("/map")
  );
}

function isMobilePath(pathname) {
  if (!pathname) {
    return false;
  }
  return (
    pathname === "/mobile" ||
    pathname.startsWith("/dash-mobile") ||
    pathname.startsWith("/profile-mobile") ||
    pathname.startsWith("/history-mobile") ||
    pathname.startsWith("/task-mobile")
  );
}

export default function AppShell({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, loading, profile, session, signOut } = useFirebaseAuth();
  const { state } = useDomainState();
  const { setActiveTenant } = useDomainActions();
  const isPublicRoute = pathname === "/" || pathname === "/mobile";
  const isResearcher = String(profile?.type || "").toLowerCase() === "researcher";
  const inMobilePath = isMobilePath(pathname);

  useEffect(() => {
    if (typeof window === "undefined" || inMobilePath || !("serviceWorker" in navigator)) {
      return;
    }

    navigator.serviceWorker.getRegistrations().then((registrations) => {
      registrations.forEach((registration) => {
        registration.unregister().catch(() => undefined);
      });
    });
  }, [inMobilePath]);

  useEffect(() => {
    if (loading) {
      return;
    }

    if (!currentUser && !isPublicRoute) {
      router.replace(inMobilePath ? "/mobile" : "/");
      return;
    }

    if (!currentUser) {
      return;
    }

    if (isResearcher && !inMobilePath) {
      router.replace("/dash-mobile");
      return;
    }

    if (!isResearcher && inMobilePath) {
      router.replace("/dashboard");
      return;
    }

    if (isResearcher && pathname === "/mobile") {
      router.replace("/dash-mobile");
      return;
    }

    if (!isResearcher && pathname === "/mobile") {
      router.replace("/dashboard");
      return;
    }

  }, [loading, currentUser, isPublicRoute, inMobilePath, isResearcher, pathname, router]);

  useEffect(() => {
    if (loading || !currentUser) {
      return;
    }

    const preferredTenantId = String(profile?.default_tenant_id || "").trim();
    if (!preferredTenantId) {
      return;
    }

    const hasPreferredTenant = (state?.tenants || []).some(
      (tenant) => String(tenant.id) === preferredTenantId
    );
    if (!hasPreferredTenant) {
      return;
    }

    const activeTenantId = String(state?.meta?.activeTenantId || "").trim();
    if (activeTenantId === preferredTenantId) {
      return;
    }

    setActiveTenant(preferredTenantId);
  }, [loading, currentUser, profile?.default_tenant_id, setActiveTenant, state?.meta?.activeTenantId, state?.tenants]);

  if (!isPublicRoute && loading) {
    return (
      <main className={"grid min-h-screen place-items-center bg-slate-100 p-6"}>
        <p className={"m-0 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700"}>
          Carregando...
        </p>
      </main>
    );
  }

  if (!isPublicRoute && !currentUser) {
    return null;
  }

  if (isHiddenPath(pathname)) {
    return children;
  }

  async function handleSignOut() {
    try {
      await signOut();
      router.replace("/");
    } catch (error) {
      console.error("Falha ao encerrar sessao", error);
    }
  }

  return (
    <div className={"flex min-h-screen bg-slate-100 max-[960px]:block"}>
      <aside className={"sticky top-0 z-20 flex h-screen w-[92px] flex-col gap-3 border-r border-white/10 bg-slate-900 px-[10px] py-[14px] text-slate-300 max-[960px]:h-auto max-[960px]:w-full max-[960px]:border-b max-[960px]:border-r-0 max-[960px]:p-2.5"} aria-label="Navegacao principal">
        <img src="images/nket-logo-white-framed.png" alt="Logo" className={"mx-auto h-6 w-auto"} />
        <nav className={"flex flex-col gap-2 max-[960px]:flex-row max-[960px]:overflow-x-auto"}>
          {NAV_ITEMS.map((item) => {
            const matchPrefixes = item.matchPrefixes || [item.href];
            const excludePrefixes = item.excludePrefixes || [];
            const isActive =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : matchPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)) &&
                  !excludePrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`${"grid justify-items-center gap-1 rounded-[10px] border border-transparent px-1.5 py-2 text-[10px] leading-[1.2] text-inherit no-underline transition-all duration-100 max-[960px]:min-w-[70px] hover:border-white/[0.15] hover:bg-white/10 hover:text-white"} ${isActive ? "border-white/20 bg-blue-600 text-white" : ""}`}
              >
                {item.icon}
                <span className={"text-center"}>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className={"mt-auto grid gap-2 border-t border-white/10 pt-2.5"}>
          <p className={"m-0 truncate text-center text-[10px] text-slate-400"} title={currentUser?.email || ""}>
            {currentUser?.email || "usuario"}
          </p>
          <p className={"m-0 truncate text-center text-[9px] text-slate-500"} title={session?.sessionId || ""}>
            {session?.active ? "sessao ativa" : "sem sessao"}
          </p>
          <button
            type="button"
            onClick={handleSignOut}
            className={"cursor-pointer rounded-[10px] border border-red-400/40 bg-red-500/20 px-2 py-2 text-[10px] font-semibold uppercase tracking-[0.04em] text-red-100 transition hover:border-red-300/60 hover:bg-red-500/30"}
          >
            Sair
          </button>
        </div>
      </aside>
      <div className={"min-w-0 flex-1"}>{children}</div>
    </div>
  );
}

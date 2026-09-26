import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { localRepo } from "@/data/localRepo";
import type { Repo } from "@/data/repo";
import { supabase } from "@/data/supabaseClient";
import { createSupabaseRepo } from "@/data/supabaseRepo";
import type { Role } from "@/data/types";

interface AppCtx {
  repo: Repo;
  backend: "local" | "supabase";
  setBackend: (b: "local" | "supabase") => void;
  role: Role;
  setRole: (r: Role) => void;
  user: string;
  supabaseAvailable: boolean;
  signedIn: boolean;
}

const Ctx = createContext<AppCtx | null>(null);

const readPref = (k: string, d: string) => {
  try {
    return localStorage.getItem(k) ?? d;
  } catch {
    return d;
  }
};
const writePref = (k: string, v: string) => {
  try {
    localStorage.setItem(k, v);
  } catch {
    /* sem armazenamento: segue com o valor em memória */
  }
};

export function AppProvider({ children }: { children: ReactNode }) {
  const [backend, setBackendState] = useState<"local" | "supabase">(() => (supabase && readPref("nexacoop.backend", "local") === "supabase" ? "supabase" : "local"));
  const [localRole, setLocalRole] = useState<Role>(() => readPref("nexacoop.role", "ADMIN") as Role);
  const [sbUser, setSbUser] = useState<{ email: string; role: Role } | null>(null);

  useEffect(() => {
    if (!supabase) return;
    const load = async () => {
      const { data } = await supabase!.auth.getUser();
      if (!data.user) return setSbUser(null);
      const { data: roles } = await supabase!.from("user_roles").select("role").eq("user_id", data.user.id).limit(1);
      setSbUser({ email: data.user.email ?? "", role: (roles?.[0]?.role as Role) ?? "VIEWER" });
    };
    load();
    const { data: sub } = supabase.auth.onAuthStateChange(() => load());
    return () => sub.subscription.unsubscribe();
  }, []);

  const repo = useMemo(() => (backend === "supabase" && supabase ? createSupabaseRepo(supabase) : localRepo), [backend]);
  const value: AppCtx = {
    repo,
    backend,
    setBackend: (b) => {
      writePref("nexacoop.backend", b);
      setBackendState(b);
    },
    // No modo local o papel é simulado (para testar permissões); no Supabase vem de user_roles.
    role: backend === "supabase" ? sbUser?.role ?? "VIEWER" : localRole,
    setRole: (r) => {
      writePref("nexacoop.role", r);
      setLocalRole(r);
    },
    user: backend === "supabase" ? sbUser?.email ?? "anônimo" : "operador local",
    supabaseAvailable: !!supabase,
    signedIn: backend === "local" || !!sbUser,
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp() {
  const c = useContext(Ctx);
  if (!c) throw new Error("AppProvider ausente");
  return c;
}

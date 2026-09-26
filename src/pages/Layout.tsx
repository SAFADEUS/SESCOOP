import { Database, FlaskConical, LogIn, Network } from "lucide-react";
import { Link, Outlet, useNavigate } from "react-router-dom";
import { Select } from "@/components/ui";
import { useApp } from "@/features/AppContext";
import type { Role } from "@/data/types";

export function Layout() {
  const { backend, setBackend, role, setRole, user, supabaseAvailable, signedIn } = useApp();
  const nav = useNavigate();
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-coop-800 bg-coop-700 text-white">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center gap-3 px-4 py-2.5">
          <Link to="/" className="flex items-center gap-2">
            <Network size={22} />
            <div>
              <div className="text-sm font-bold leading-tight">NexaCoop</div>
              <div className="text-[11px] leading-tight text-coop-100">Conexão Cooperativista · MNBD</div>
            </div>
          </Link>
          <Link to="/" className="ml-4 flex items-center gap-1 rounded px-2 py-1 text-sm hover:bg-coop-600">
            <FlaskConical size={15} /> Sandbox & Eventos
          </Link>
          <div className="ml-auto flex flex-wrap items-center gap-2 text-xs">
            <span className="flex items-center gap-1 text-coop-100">
              <Database size={14} /> Dados:
            </span>
            <Select
              className="border-coop-500 bg-coop-800 py-1 text-xs text-white"
              value={backend}
              onChange={(e) => {
                setBackend(e.target.value as "local" | "supabase");
                nav("/");
              }}
            >
              <option value="local">Local (navegador)</option>
              <option value="supabase" disabled={!supabaseAvailable}>
                Supabase{supabaseAvailable ? "" : " (não configurado)"}
              </option>
            </Select>
            <span className="text-coop-100">Papel:</span>
            {backend === "local" ? (
              <Select className="border-coop-500 bg-coop-800 py-1 text-xs text-white" value={role} onChange={(e) => setRole(e.target.value as Role)} title="No modo local o papel é simulado para testar permissões">
                <option value="ADMIN">ADMIN</option>
                <option value="OPERATOR">OPERATOR</option>
                <option value="VIEWER">VIEWER</option>
              </Select>
            ) : (
              <span className="rounded bg-coop-800 px-2 py-1">{role}</span>
            )}
            <span className="text-coop-100">{user}</span>
            {backend === "supabase" && !signedIn && (
              <Link to="/login" className="flex items-center gap-1 rounded bg-white px-2 py-1 font-medium text-coop-800">
                <LogIn size={13} /> Entrar
              </Link>
            )}
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-[1600px] px-4 py-5">
        <Outlet />
      </main>
    </div>
  );
}

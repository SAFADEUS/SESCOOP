import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Badge, Card, Select, Tabs } from "@/components/ui";
import type { RunRecord, SandboxEvent } from "@/data/types";
import { useApp } from "@/features/AppContext";
import { EventProvider, useEvent } from "@/features/EventContext";
import { ParticipantDrawer } from "@/features/ParticipantDrawer";
import { AuditTab } from "@/features/tabs/AuditTab";
import { ConfigTab } from "@/features/tabs/ConfigTab";
import { DashboardTab } from "@/features/tabs/DashboardTab";
import { DemandTab } from "@/features/tabs/DemandTab";
import { MatrixTab } from "@/features/tabs/MatrixTab";
import { OptimizeTab } from "@/features/tabs/OptimizeTab";
import { ParticipantsTab } from "@/features/tabs/ParticipantsTab";
import { PreferencesTab } from "@/features/tabs/PreferencesTab";
import { ReoptTab } from "@/features/tabs/ReoptTab";
import { TablesTab } from "@/features/tabs/TablesTab";
import { fmtDate } from "@/lib/utils";

type TabKey = "painel" | "otimizacao" | "mesas" | "participantes" | "preferencias" | "demanda" | "matriz" | "reotimizacao" | "config" | "auditoria";

export function EventPage() {
  const { id } = useParams();
  const { repo } = useApp();
  const [data, setData] = useState<{ ev: SandboxEvent; runs: RunRecord[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [ev, runs] = await Promise.all([repo.getEvent(id!), repo.listRuns(id!)]);
        if (!alive) return;
        if (!ev) setError("Evento não encontrado.");
        else setData({ ev, runs });
      } catch (e) {
        if (alive) setError((e as Error).message);
      }
    })();
    return () => {
      alive = false;
    };
  }, [id, repo]);
  if (error) return <Card>{error}</Card>;
  if (!data) return <div className="p-8 text-center text-slate-500">Carregando…</div>;
  return (
    <EventProvider initial={data.ev} initialRuns={data.runs}>
      <Workspace />
    </EventProvider>
  );
}

function Workspace() {
  const { ev, runs, selectedRun, selectRun, P } = useEvent();
  const [tab, setTab] = useState<TabKey>(runs.length ? "painel" : "otimizacao");
  const [participant, setParticipant] = useState<string | null>(null);
  const errors = P.issues.filter((i) => i.severity === "ERROR").length;
  const tabs: { key: TabKey; label: string }[] = [
    { key: "painel", label: "Painel" },
    { key: "otimizacao", label: "Simulação & versões" },
    { key: "mesas", label: "Mesas × Sessões" },
    { key: "participantes", label: `Participantes (${ev.input.participants.length})` },
    { key: "preferencias", label: `Preferências (${ev.input.preferences.length})` },
    { key: "demanda", label: "Mapa de demanda" },
    { key: "matriz", label: "Matriz P×P" },
    { key: "reotimizacao", label: "Imprevistos & reotimização" },
    { key: "config", label: "Configuração" },
    { key: "auditoria", label: "Auditoria" },
  ];
  const open = (pid: string) => setParticipant(pid);
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link to="/" className="mb-1 inline-flex items-center gap-1 text-xs text-slate-500 hover:text-coop-700">
            <ArrowLeft size={13} /> Eventos
          </Link>
          <h1 className="flex flex-wrap items-center gap-2 text-xl font-semibold text-slate-900">
            {ev.name}
            {ev.sandbox ? <Badge tone="violet">SANDBOX</Badge> : <Badge tone="blue">PRODUÇÃO</Badge>}
            <Badge tone={ev.status === "PUBLISHED" ? "green" : "amber"}>{ev.status}</Badge>
            {ev.frozenUntil > 0 && <Badge tone="slate">sessões 1–{ev.frozenUntil} congeladas</Badge>}
            {errors > 0 && <Badge tone="red">{errors} erro(s) de viabilidade</Badge>}
          </h1>
          <div className="text-xs text-slate-500">
            {P.n} participantes ativos · {ev.input.tables.length} mesas · {ev.input.config.sessionCount} sessões · capacidade {ev.input.config.minTableCapacity}–
            {ev.input.config.maxTableCapacity} (ideal {ev.input.config.idealTableCapacity})
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-slate-500">Versão em análise:</span>
          <Select value={selectedRun?.id ?? ""} onChange={(e) => selectRun(e.target.value || null)} className="max-w-[420px]">
            {runs.length === 0 && <option value="">(nenhuma execução)</option>}
            {runs.map((r) => (
              <option key={r.id} value={r.id}>
                v{r.version} · {r.label} · {r.status} · {fmtDate(r.createdAt)}
              </option>
            ))}
          </Select>
        </div>
      </div>
      <Tabs tabs={tabs} value={tab} onChange={setTab} />
      {tab === "painel" && <DashboardTab onOpenParticipant={open} goTo={(t) => setTab(t as TabKey)} />}
      {tab === "otimizacao" && <OptimizeTab onOpenParticipant={open} goTo={(t) => setTab(t as TabKey)} />}
      {tab === "mesas" && <TablesTab onOpenParticipant={open} />}
      {tab === "participantes" && <ParticipantsTab onOpenParticipant={open} />}
      {tab === "preferencias" && <PreferencesTab onOpenParticipant={open} />}
      {tab === "demanda" && <DemandTab onOpenParticipant={open} />}
      {tab === "matriz" && <MatrixTab onOpenParticipant={open} />}
      {tab === "reotimizacao" && <ReoptTab />}
      {tab === "config" && <ConfigTab />}
      {tab === "auditoria" && <AuditTab />}
      <ParticipantDrawer participantId={participant} onClose={() => setParticipant(null)} onOpenParticipant={open} />
    </div>
  );
}

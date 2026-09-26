import { FlaskConical, Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Badge, Button, Card, Empty, Field, Input, Select } from "@/components/ui";
import { SCENARIOS, type ScenarioKey } from "@/engine";
import { newBlankEvent, newEventFromScenario } from "@/data/factories";
import type { EventSummary, SandboxEvent } from "@/data/types";
import { useApp } from "@/features/AppContext";
import { fmtDate } from "@/lib/utils";

const statusTone = (s: string) => (s === "PUBLISHED" ? "green" : s === "APPROVED" ? "blue" : s === "DRAFT" ? "slate" : "amber");

export function SandboxHome() {
  const { repo, role, backend, signedIn } = useApp();
  const nav = useNavigate();
  const [events, setEvents] = useState<EventSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scenario, setScenario] = useState<ScenarioKey>("A_EQUILIBRADO");
  const [seed, setSeed] = useState(1);
  const [blankName, setBlankName] = useState("Sessão de Negócios 2026");
  const [blankSandbox, setBlankSandbox] = useState(true);
  const [fake, setFake] = useState(0);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setError(null);
      setEvents(await repo.listEvents());
    } catch (e) {
      setError((e as Error).message);
      setEvents([]);
    }
  }, [repo]);
  useEffect(() => {
    load();
  }, [load]);

  const create = async (ev: SandboxEvent, what: string) => {
    setBusy(true);
    try {
      const saved = await repo.saveEvent(ev);
      await repo.addAudit({ eventId: saved.id, user: "", role, action: "evento criado", details: what });
      nav(`/evento/${saved.id}`);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async (e: EventSummary) => {
    if (!confirm(`Apagar o evento sandbox "${e.name}" e todo o seu histórico?`)) return;
    try {
      await repo.deleteEvent(e.id);
      load();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const readOnly = role === "VIEWER";
  if (backend === "supabase" && !signedIn)
    return (
      <Card>
        Entre com sua conta para usar o Supabase. <Link className="text-coop-700 underline" to="/login">Entrar</Link>
      </Card>
    );

  return (
    <div className="grid gap-5 lg:grid-cols-[380px_1fr]">
      <div className="space-y-5">
        <Card title={<span className="flex items-center gap-2"><FlaskConical size={16} /> Criar cenário de teste (SANDBOX)</span>}>
          <div className="space-y-3">
            <p className="text-xs text-slate-500">
              Gera 60 participantes fictícios, 10 mesas e 6 sessões com um padrão de demanda. Dados de sandbox nunca alteram eventos de produção.
            </p>
            <Field label="Cenário">
              <Select className="w-full" value={scenario} onChange={(e) => setScenario(e.target.value as ScenarioKey)}>
                {SCENARIOS.map((s) => (
                  <option key={s.key} value={s.key}>
                    {s.label}
                  </option>
                ))}
              </Select>
            </Field>
            <p className="text-xs text-slate-600">{SCENARIOS.find((s) => s.key === scenario)?.description}</p>
            <Field label="Seed do gerador" hint="Mesma seed ⇒ mesmos participantes e preferências.">
              <Input type="number" min={1} value={seed} onChange={(e) => setSeed(Math.max(1, Number(e.target.value) || 1))} />
            </Field>
            <Button disabled={busy || readOnly} onClick={() => create(newEventFromScenario(scenario, seed), `cenário ${scenario} seed ${seed}`)}>
              <Plus size={15} /> Criar cenário
            </Button>
          </div>
        </Card>
        <Card title="Novo evento em branco">
          <div className="space-y-3">
            <Field label="Nome">
              <Input value={blankName} onChange={(e) => setBlankName(e.target.value)} />
            </Field>
            <Field label="Participantes fictícios iniciais" hint="0 = cadastrar/importar manualmente">
              <Input type="number" min={0} max={300} value={fake} onChange={(e) => setFake(Math.max(0, Math.min(300, Number(e.target.value) || 0)))} />
            </Field>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={blankSandbox} onChange={(e) => setBlankSandbox(e.target.checked)} /> Sandbox (ambiente controlado)
            </label>
            <Button variant="outline" disabled={busy || readOnly || (!blankSandbox && role !== "ADMIN")} onClick={() => create(newBlankEvent(blankName, blankSandbox, fake), "evento em branco")}>
              <Plus size={15} /> Criar evento
            </Button>
            {!blankSandbox && role !== "ADMIN" && <p className="text-xs text-amber-700">Somente ADMIN cria eventos de produção.</p>}
          </div>
        </Card>
      </div>
      <Card title={`Eventos (${events?.length ?? "…"})`} actions={<Badge tone="slate">{backend === "local" ? "armazenados neste navegador" : "Supabase"}</Badge>}>
        {error && <div className="mb-3 rounded bg-red-50 p-2 text-sm text-red-700">{error}</div>}
        {events && events.length === 0 && <Empty>Nenhum evento ainda. Crie um cenário de teste ao lado.</Empty>}
        {events && events.length > 0 && (
          <table className="tbl">
            <thead>
              <tr>
                <th>Evento</th>
                <th>Tipo</th>
                <th>Status</th>
                <th className="text-right">Participantes</th>
                <th className="text-right">Preferências</th>
                <th className="text-right">Execuções</th>
                <th>Atualizado</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {events.map((e) => (
                <tr key={e.id}>
                  <td>
                    <Link to={`/evento/${e.id}`} className="font-medium text-coop-700 hover:underline">
                      {e.name}
                    </Link>
                  </td>
                  <td>{e.sandbox ? <Badge tone="violet">SANDBOX</Badge> : <Badge tone="blue">PRODUÇÃO</Badge>}</td>
                  <td>
                    <Badge tone={statusTone(e.status)}>{e.status}</Badge>
                  </td>
                  <td className="text-right tabular-nums">{e.participants}</td>
                  <td className="text-right tabular-nums">{e.preferences}</td>
                  <td className="text-right tabular-nums">{e.runs}</td>
                  <td className="text-xs text-slate-500">{fmtDate(e.updatedAt)}</td>
                  <td className="text-right">
                    {e.sandbox && role === "ADMIN" && (
                      <button className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600" title="Apagar sandbox" onClick={() => remove(e)}>
                        <Trash2 size={15} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}

import { Download, Pencil, Plus, Trash2, Upload, UserX } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { Badge, Button, Card, Field, Input, Modal, Select } from "@/components/ui";
import { makeParticipants, mulberry32, type AttendanceStatus, type Participant } from "@/engine";
import { useEvent } from "@/features/EventContext";
import { DemandBadge, ipdText } from "@/features/shared";
import { participantsFromRows, participantsToCsv, readTable } from "@/lib/importers";
import { downloadText, uid } from "@/lib/utils";

const blank = (): Participant => ({
  id: uid(),
  name: "",
  company: "",
  role: "",
  segment: "",
  category: "",
  description: "",
  tags: [],
  active: true,
  fixed: false,
  fixedTableId: null,
  institutionalPriority: 0,
  kind: "PARTICIPANT",
  countsTowardCapacity: true,
  notes: "",
  status: "CONFIRMED",
});

export function ParticipantsTab({ onOpenParticipant }: { onOpenParticipant: (id: string) => void }) {
  const { ev, P, update, canEdit } = useEvent();
  const [edit, setEdit] = useState<{ p: Participant; avail: boolean[]; isNew: boolean } | null>(null);
  const [q, setQ] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [importMode, setImportMode] = useState<"append" | "replace">("append");
  const file = useRef<HTMLInputElement>(null);
  const S = ev.input.config.sessionCount;
  const demand = useMemo(() => new Map(P.demand.map((d) => [d.participantId, d])), [P]);

  const list = ev.input.participants.filter((p) => {
    const s = q.trim().toLowerCase();
    return !s || [p.name, p.company, p.segment, p.category, p.role, ...p.tags].some((x) => x.toLowerCase().includes(s));
  });

  const save = async () => {
    if (!edit) return;
    if (!edit.p.name.trim()) return setMsg("Informe o nome.");
    const { p, avail, isNew } = edit;
    const allTrue = avail.every(Boolean);
    await update(
      (e) => {
        const availability = { ...(e.input.availability ?? {}) };
        if (allTrue) delete availability[p.id];
        else availability[p.id] = avail;
        return {
          ...e,
          input: {
            ...e.input,
            participants: isNew ? [...e.input.participants, p] : e.input.participants.map((x) => (x.id === p.id ? p : x)),
            availability,
          },
        };
      },
      isNew ? "participante cadastrado" : "participante editado",
      p.name,
    );
    setEdit(null);
    setMsg(null);
  };

  const remove = async (p: Participant) => {
    if (!confirm(`Excluir ${p.name}? Preferências, bloqueios e disponibilidade dele também serão removidos. (Prefira "desativar" se já houver programação publicada.)`)) return;
    await update(
      (e) => {
        const availability = { ...(e.input.availability ?? {}) };
        delete availability[p.id];
        return {
          ...e,
          input: {
            ...e.input,
            participants: e.input.participants.filter((x) => x.id !== p.id),
            preferences: e.input.preferences.filter((x) => x.sourceId !== p.id && x.targetId !== p.id),
            locks: (e.input.locks ?? []).filter((l) => l.participantId !== p.id),
            availability,
          },
        };
      },
      "participante excluído",
      p.name,
    );
  };

  const toggleActive = (p: Participant) =>
    update((e) => ({ ...e, input: { ...e.input, participants: e.input.participants.map((x) => (x.id === p.id ? { ...x, active: !x.active } : x)) } }), p.active ? "participante desativado" : "participante reativado", p.name);

  const onImport = async (f: File) => {
    try {
      const rows = await readTable(f);
      const { participants, errors } = participantsFromRows(rows, ev.input.tables);
      if (!participants.length) return setMsg(`Nada importado. ${errors.slice(0, 5).join(" ")}`);
      await update(
        (e) => {
          if (importMode === "replace") return { ...e, input: { ...e.input, participants, preferences: [], locks: [], availability: {} } };
          const existing = new Set(e.input.participants.map((p) => p.id));
          const merged = [...e.input.participants.map((p) => participants.find((n) => n.id === p.id) ?? p), ...participants.filter((p) => !existing.has(p.id))];
          return { ...e, input: { ...e.input, participants: merged } };
        },
        "importação de participantes",
        `${f.name}: ${participants.length} linha(s), modo ${importMode}`,
      );
      setMsg(`${participants.length} participante(s) importado(s).${errors.length ? ` ${errors.length} aviso(s): ${errors.slice(0, 3).join(" ")}` : ""}`);
    } catch (e) {
      setMsg(`Falha ao importar: ${(e as Error).message}`);
    }
  };

  const addFake = async (n: number) => {
    const fresh = makeParticipants(mulberry32(Date.now() & 0xffff), n).map((p) => ({ ...p, id: uid() }));
    await update((e) => ({ ...e, input: { ...e.input, participants: [...e.input.participants, ...fresh] } }), "participantes fictícios gerados", `${n}`);
  };

  const setStatus = (p: Participant, status: AttendanceStatus) =>
    update((e) => ({ ...e, input: { ...e.input, participants: e.input.participants.map((x) => (x.id === p.id ? { ...x, status } : x)) } }), "status de presença", `${p.name} → ${status}`);

  return (
    <Card
      title={`Participantes (${ev.input.participants.filter((p) => p.active).length} ativos de ${ev.input.participants.length})`}
      actions={
        <>
          <Input className="w-56" placeholder="Buscar nome, empresa, segmento, tag…" value={q} onChange={(e) => setQ(e.target.value)} />
          <Button size="sm" variant="outline" onClick={() => downloadText(`participantes-${ev.name}.csv`, participantsToCsv(ev.input.participants, ev.input.tables))}>
            <Download size={13} /> CSV
          </Button>
          {canEdit && (
            <>
              <Select value={importMode} onChange={(e) => setImportMode(e.target.value as "append" | "replace")} className="py-1 text-xs">
                <option value="append">Importar: adicionar/atualizar</option>
                <option value="replace">Importar: substituir tudo</option>
              </Select>
              <Button size="sm" variant="outline" onClick={() => file.current?.click()}>
                <Upload size={13} /> CSV/XLSX
              </Button>
              <input ref={file} type="file" accept=".csv,.xlsx" className="hidden" onChange={(e) => e.target.files?.[0] && onImport(e.target.files[0]).finally(() => (e.target.value = ""))} />
              {ev.sandbox && (
                <Button size="sm" variant="outline" onClick={() => addFake(10)}>
                  +10 fictícios
                </Button>
              )}
              <Button size="sm" onClick={() => setEdit({ p: blank(), avail: Array(S).fill(true), isNew: true })}>
                <Plus size={13} /> Novo
              </Button>
            </>
          )}
        </>
      }
    >
      {msg && <div className="mb-3 rounded bg-slate-100 p-2 text-sm">{msg}</div>}
      <p className="mb-2 text-xs text-slate-500">
        Colunas aceitas na importação: nome, empresa, cargo, segmento, categoria, descricao, tags (separadas por ;), ativo, fixo, mesa_fixa (número), prioridade_institucional (0–3),
        tipo (PARTICIPANT/MODERATOR/ANCHOR), conta_capacidade, observacoes, id (opcional).
      </p>
      <div className="max-h-[70vh] overflow-auto">
        <table className="tbl">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Empresa</th>
              <th>Cargo</th>
              <th>Segmento</th>
              <th>Categoria</th>
              <th className="text-right">Inbound</th>
              <th className="text-right">Outbound</th>
              <th className="text-right">IPD</th>
              <th>Demanda</th>
              <th>Disponibilidade</th>
              <th>Presença</th>
              <th>Flags</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {list.map((p) => {
              const d = demand.get(p.id);
              const av = ev.input.availability?.[p.id];
              return (
                <tr key={p.id} className={p.active ? "" : "opacity-50"}>
                  <td>
                    <button className="font-medium text-coop-700 hover:underline" onClick={() => onOpenParticipant(p.id)}>
                      {p.name}
                    </button>
                  </td>
                  <td>{p.company}</td>
                  <td className="text-slate-600">{p.role}</td>
                  <td>{p.segment}</td>
                  <td className="text-slate-600">{p.category}</td>
                  <td className="text-right tabular-nums">{d?.inbound ?? "—"}</td>
                  <td className="text-right tabular-nums">{d?.outbound ?? "—"}</td>
                  <td className="text-right tabular-nums">{d ? ipdText(d.ipd) : "—"}</td>
                  <td>{d && <DemandBadge cls={d.demandClass} />}</td>
                  <td className="font-mono text-[11px]">{Array.from({ length: S }, (_, s) => (av && av[s] === false ? "·" : String(s + 1))).join(" ")}</td>
                  <td>
                    <Select className="py-0.5 text-xs" disabled={!canEdit} value={p.status ?? "CONFIRMED"} onChange={(e) => setStatus(p, e.target.value as AttendanceStatus)}>
                      {["CONFIRMED", "CHECKED_IN", "ABSENT", "LATE", "LEFT_EVENT"].map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </Select>
                  </td>
                  <td className="space-x-1">
                    {!p.active && <Badge>inativo</Badge>}
                    {p.kind !== "PARTICIPANT" && <Badge tone="violet">{p.kind}</Badge>}
                    {(p.fixed || p.fixedTableId) && <Badge tone="blue">fixo{p.fixedTableId ? ` ${ev.input.tables.find((t) => t.id === p.fixedTableId)?.name ?? ""}` : ""}</Badge>}
                    {!p.countsTowardCapacity && <Badge>fora da capacidade</Badge>}
                    {p.institutionalPriority > 0 && <Badge tone="amber">prior. {p.institutionalPriority}</Badge>}
                  </td>
                  <td className="whitespace-nowrap text-right">
                    {canEdit && (
                      <>
                        <button className="rounded p-1 text-slate-500 hover:bg-slate-100" title="Editar" onClick={() => setEdit({ p: { ...p }, avail: av ? [...av] : Array(S).fill(true), isNew: false })}>
                          <Pencil size={14} />
                        </button>
                        <button className="rounded p-1 text-slate-500 hover:bg-slate-100" title={p.active ? "Desativar" : "Reativar"} onClick={() => toggleActive(p)}>
                          <UserX size={14} />
                        </button>
                        <button className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600" title="Excluir" onClick={() => remove(p)}>
                          <Trash2 size={14} />
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Modal
        open={!!edit}
        onClose={() => setEdit(null)}
        title={edit?.isNew ? "Novo participante" : `Editar ${edit?.p.name}`}
        footer={
          <>
            <Button variant="outline" onClick={() => setEdit(null)}>
              Cancelar
            </Button>
            <Button onClick={save}>Salvar</Button>
          </>
        }
      >
        {edit && (
          <div className="grid gap-3 sm:grid-cols-2">
            {(
              [
                ["Nome", "name"],
                ["Empresa", "company"],
                ["Cargo", "role"],
                ["Segmento", "segment"],
                ["Categoria", "category"],
              ] as const
            ).map(([label, key]) => (
              <Field key={key} label={label}>
                <Input value={edit.p[key]} onChange={(e) => setEdit({ ...edit, p: { ...edit.p, [key]: e.target.value } })} />
              </Field>
            ))}
            <Field label="Tags / interesses (separe por vírgula)">
              <Input
                value={edit.p.tags.join(", ")}
                onChange={(e) =>
                  setEdit({
                    ...edit,
                    p: {
                      ...edit.p,
                      tags: e.target.value
                        .split(",")
                        .map((t) => t.trim())
                        .filter(Boolean),
                    },
                  })
                }
              />
            </Field>
            <Field label="Descrição">
              <Input value={edit.p.description ?? ""} onChange={(e) => setEdit({ ...edit, p: { ...edit.p, description: e.target.value } })} />
            </Field>
            <Field label="Observações">
              <Input value={edit.p.notes ?? ""} onChange={(e) => setEdit({ ...edit, p: { ...edit.p, notes: e.target.value } })} />
            </Field>
            <Field label="Tipo">
              <Select
                className="w-full"
                value={edit.p.kind}
                onChange={(e) => {
                  const kind = e.target.value as Participant["kind"];
                  setEdit({ ...edit, p: { ...edit.p, kind, countsTowardCapacity: kind === "MODERATOR" ? false : edit.p.countsTowardCapacity } });
                }}
              >
                <option value="PARTICIPANT">Participante</option>
                <option value="ANCHOR">Âncora</option>
                <option value="MODERATOR">Moderador</option>
              </Select>
            </Field>
            <Field label="Prioridade institucional (0–3)">
              <Input type="number" min={0} max={3} value={edit.p.institutionalPriority} onChange={(e) => setEdit({ ...edit, p: { ...edit.p, institutionalPriority: Math.max(0, Math.min(3, Number(e.target.value) || 0)) } })} />
            </Field>
            <Field label="Mesa fixa">
              <Select
                className="w-full"
                value={edit.p.fixedTableId ?? ""}
                onChange={(e) => setEdit({ ...edit, p: { ...edit.p, fixedTableId: e.target.value || null, fixed: e.target.value ? true : edit.p.fixed } })}
              >
                <option value="">— nenhuma —</option>
                {ev.input.tables.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </Select>
            </Field>
            <div className="space-y-1 pt-5 text-sm">
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={edit.p.active} onChange={(e) => setEdit({ ...edit, p: { ...edit.p, active: e.target.checked } })} /> Ativo
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={edit.p.fixed} onChange={(e) => setEdit({ ...edit, p: { ...edit.p, fixed: e.target.checked } })} /> Participante fixo (mantém a mesma mesa)
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={edit.p.countsTowardCapacity} onChange={(e) => setEdit({ ...edit, p: { ...edit.p, countsTowardCapacity: e.target.checked } })} /> Ocupa vaga comercial
                (counts_toward_capacity)
              </label>
            </div>
            <div className="sm:col-span-2">
              <div className="mb-1 text-xs font-medium text-slate-600">Disponibilidade por sessão</div>
              <div className="flex flex-wrap gap-3 text-sm">
                {edit.avail.map((a, s) => (
                  <label key={s} className="flex items-center gap-1">
                    <input type="checkbox" checked={a} disabled={s < ev.frozenUntil} onChange={(e) => setEdit({ ...edit, avail: edit.avail.map((x, k) => (k === s ? e.target.checked : x)) })} />
                    {ev.sessionNames[s] ?? `Sessão ${s + 1}`}
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </Card>
  );
}

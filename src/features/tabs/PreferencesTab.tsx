import { Download, Plus, Trash2, Upload } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { Badge, Button, Card, Field, Input, Select } from "@/components/ui";
import type { Preference, PreferenceType } from "@/engine";
import { useEvent } from "@/features/EventContext";
import { PREF_LABEL, PREF_TYPES, PrefBadge } from "@/features/shared";
import { preferencesFromRows, preferencesToCsv, readTable } from "@/lib/importers";
import { downloadText, uid } from "@/lib/utils";

const POSITIVE = new Set(["NORMAL", "PREFER", "HIGH_PRIORITY", "MUST_MEET"]);

export function PreferencesTab({ onOpenParticipant }: { onOpenParticipant: (id: string) => void }) {
  const { ev, update, canEdit, liveMetrics, selectedRun } = useEvent();
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [who, setWho] = useState("");
  const [status, setStatus] = useState<"" | "met" | "pending">("");
  const [draft, setDraft] = useState<Preference>({ id: "", sourceId: "", targetId: "", type: "PREFER", weight: 1, reason: "", allowRepeat: false });
  const [msg, setMsg] = useState<string | null>(null);
  const file = useRef<HTMLInputElement>(null);
  const people = [...ev.input.participants].sort((a, b) => a.name.localeCompare(b.name));
  const name = useMemo(() => new Map(ev.input.participants.map((p) => [p.id, p.name])), [ev.input.participants]);
  const positiveKey = useMemo(() => new Set(ev.input.preferences.filter((p) => POSITIVE.has(p.type)).map((p) => `${p.sourceId}>${p.targetId}`)), [ev.input.preferences]);
  // Pares que se encontraram na versão selecionada (nas duas direções).
  const met = useMemo(() => {
    const s = new Set<string>();
    selectedRun?.schedule.forEach((sess) =>
      sess.forEach((mem) => {
        for (const a of mem) for (const b of mem) if (a !== b) s.add(`${a}>${b}`);
      }),
    );
    return s;
  }, [selectedRun]);

  const list = ev.input.preferences.filter((p) => {
    if (typeFilter && p.type !== typeFilter) return false;
    if (who && p.sourceId !== who && p.targetId !== who) return false;
    if (status === "met" && !met.has(`${p.sourceId}>${p.targetId}`)) return false;
    if (status === "pending" && (!POSITIVE.has(p.type) || met.has(`${p.sourceId}>${p.targetId}`))) return false;
    return true;
  });

  const add = async () => {
    if (!draft.sourceId || !draft.targetId) return setMsg("Escolha origem e destino.");
    if (draft.sourceId === draft.targetId) return setMsg("Origem e destino devem ser diferentes.");
    const exists = ev.input.preferences.find((p) => p.sourceId === draft.sourceId && p.targetId === draft.targetId);
    const pref = { ...draft, id: exists?.id ?? uid() };
    await update(
      (e) => ({
        ...e,
        input: { ...e.input, preferences: exists ? e.input.preferences.map((p) => (p.id === exists.id ? pref : p)) : [...e.input.preferences, pref] },
      }),
      POSITIVE.has(pref.type) ? "preferência cadastrada" : "restrição cadastrada",
      `${name.get(pref.sourceId)} → ${name.get(pref.targetId)}: ${pref.type}`,
    );
    setMsg(exists ? "Preferência existente atualizada (um registro por par direcional)." : null);
  };

  const setType = (p: Preference, type: PreferenceType) =>
    update(
      (e) => ({ ...e, input: { ...e.input, preferences: e.input.preferences.map((x) => (x.id === p.id ? { ...x, type } : x)) } }),
      "preferência alterada",
      `${name.get(p.sourceId)} → ${name.get(p.targetId)}: ${p.type} → ${type}`,
    );
  const remove = (p: Preference) =>
    update((e) => ({ ...e, input: { ...e.input, preferences: e.input.preferences.filter((x) => x.id !== p.id) } }), "preferência removida", `${name.get(p.sourceId)} → ${name.get(p.targetId)}`);

  const onImport = async (f: File) => {
    try {
      const rows = await readTable(f);
      const { preferences, errors } = preferencesFromRows(rows, ev.input.participants);
      await update(
        (e) => {
          const key = (p: Preference) => `${p.sourceId}>${p.targetId}`;
          const incoming = new Map(preferences.map((p) => [key(p), p]));
          const kept = e.input.preferences.filter((p) => !incoming.has(key(p)));
          return { ...e, input: { ...e.input, preferences: [...kept, ...incoming.values()] } };
        },
        "importação de preferências",
        `${f.name}: ${preferences.length}`,
      );
      setMsg(`${preferences.length} preferência(s) importada(s).${errors.length ? ` ${errors.length} aviso(s): ${errors.slice(0, 3).join(" ")}` : ""}`);
    } catch (e) {
      setMsg(`Falha ao importar: ${(e as Error).message}`);
    }
  };

  return (
    <div className="space-y-4">
      {canEdit && (
        <Card title="Cadastrar preferência ou restrição">
          <div className="grid gap-3 md:grid-cols-7">
            <Field label="Quem deseja (origem)">
              <Select className="w-full" value={draft.sourceId} onChange={(e) => setDraft({ ...draft, sourceId: e.target.value })}>
                <option value="">—</option>
                {people.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} · {p.company}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Quem (destino)">
              <Select className="w-full" value={draft.targetId} onChange={(e) => setDraft({ ...draft, targetId: e.target.value })}>
                <option value="">—</option>
                {people.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} · {p.company}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Tipo">
              <Select className="w-full" value={draft.type} onChange={(e) => setDraft({ ...draft, type: e.target.value as PreferenceType })}>
                {PREF_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t} — {PREF_LABEL[t]}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Peso">
              <Input type="number" min={0.1} step={0.1} value={draft.weight ?? 1} onChange={(e) => setDraft({ ...draft, weight: Number(e.target.value) || 1 })} />
            </Field>
            <Field label="Motivo">
              <Input value={draft.reason ?? ""} onChange={(e) => setDraft({ ...draft, reason: e.target.value })} />
            </Field>
            <Field label="Reencontro estratégico">
              <label className="flex h-9 items-center gap-2 text-sm">
                <input type="checkbox" checked={!!draft.allowRepeat} onChange={(e) => setDraft({ ...draft, allowRepeat: e.target.checked })} /> permitido
              </label>
            </Field>
            <div className="flex items-end">
              <Button className="w-full" onClick={add}>
                <Plus size={14} /> Adicionar
              </Button>
            </div>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Interesse mútuo é detectado automaticamente quando A deseja B e B deseja A — não é preciso cadastrar duas vezes. MUST_MEET e MUST_NOT_MEET são restrições obrigatórias; AVOID é
            apenas penalização.
          </p>
        </Card>
      )}
      <Card
        title={`Preferências (${list.length} de ${ev.input.preferences.length})`}
        actions={
          <>
            <Select className="py-1 text-xs" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
              <option value="">Todos os tipos</option>
              {PREF_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
            <Select className="max-w-[200px] py-1 text-xs" value={who} onChange={(e) => setWho(e.target.value)}>
              <option value="">Todos os participantes</option>
              {people.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>
            <Select className="py-1 text-xs" value={status} onChange={(e) => setStatus(e.target.value as "" | "met" | "pending")}>
              <option value="">Atendidas e pendentes</option>
              <option value="met">Somente atendidas</option>
              <option value="pending">Somente pendentes</option>
            </Select>
            <Button size="sm" variant="outline" onClick={() => downloadText(`preferencias-${ev.name}.csv`, preferencesToCsv(ev.input.preferences, ev.input.participants))}>
              <Download size={13} /> CSV
            </Button>
            {canEdit && (
              <>
                <Button size="sm" variant="outline" onClick={() => file.current?.click()} title="Colunas: origem, destino (id ou nome), tipo, peso, motivo, reencontro_estrategico">
                  <Upload size={13} /> CSV/XLSX
                </Button>
                <input ref={file} type="file" accept=".csv,.xlsx" className="hidden" onChange={(e) => e.target.files?.[0] && onImport(e.target.files[0]).finally(() => (e.target.value = ""))} />
              </>
            )}
          </>
        }
      >
        {msg && <div className="mb-3 rounded bg-slate-100 p-2 text-sm">{msg}</div>}
        <div className="max-h-[65vh] overflow-auto">
          <table className="tbl">
            <thead>
              <tr>
                <th>Origem</th>
                <th>Destino</th>
                <th>Tipo</th>
                <th className="text-right">Peso</th>
                <th>Mútuo</th>
                <th>Situação na versão</th>
                <th>Motivo</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {list.slice(0, 1500).map((p) => {
                const mutual = POSITIVE.has(p.type) && positiveKey.has(`${p.targetId}>${p.sourceId}`);
                const isMet = met.has(`${p.sourceId}>${p.targetId}`);
                return (
                  <tr key={p.id}>
                    <td>
                      <button className="hover:underline" onClick={() => onOpenParticipant(p.sourceId)}>
                        {name.get(p.sourceId) ?? p.sourceId}
                      </button>
                    </td>
                    <td>
                      <button className="hover:underline" onClick={() => onOpenParticipant(p.targetId)}>
                        {name.get(p.targetId) ?? p.targetId}
                      </button>
                    </td>
                    <td>
                      {canEdit ? (
                        <Select className="py-0.5 text-xs" value={p.type} onChange={(e) => setType(p, e.target.value as PreferenceType)}>
                          {PREF_TYPES.map((t) => (
                            <option key={t}>{t}</option>
                          ))}
                        </Select>
                      ) : (
                        <PrefBadge type={p.type} />
                      )}
                      {p.allowRepeat && <Badge tone="violet" className="ml-1">reencontro estratégico</Badge>}
                    </td>
                    <td className="text-right tabular-nums">{p.weight ?? 1}</td>
                    <td>{mutual && <Badge tone="green">mútuo</Badge>}</td>
                    <td>
                      {liveMetrics &&
                        (p.type === "MUST_NOT_MEET" || p.type === "AVOID" ? (
                          isMet ? <Badge tone="red">encontraram-se</Badge> : <Badge tone="green">respeitado</Badge>
                        ) : isMet ? (
                          <Badge tone="green">atendida</Badge>
                        ) : (
                          <Badge tone="amber">pendente</Badge>
                        ))}
                    </td>
                    <td className="text-xs text-slate-500">{p.reason}</td>
                    <td className="text-right">
                      {canEdit && (
                        <button className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600" onClick={() => remove(p)}>
                          <Trash2 size={14} />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {list.length > 1500 && <div className="p-2 text-xs text-slate-500">Mostrando 1.500 de {list.length}. Use os filtros.</div>}
        </div>
      </Card>
    </div>
  );
}

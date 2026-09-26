import { useEffect, useState } from "react";
import { Button, Card, Field, Input, Select } from "@/components/ui";
import { DEFAULT_WEIGHTS, type EventConfig } from "@/engine";
import { useEvent } from "@/features/EventContext";
import { uid } from "@/lib/utils";

export function ConfigTab() {
  const { ev, update, canEdit, isAdmin } = useEvent();
  const [name, setName] = useState(ev.name);
  const [cfg, setCfg] = useState<EventConfig>(ev.input.config);
  const [sessionNames, setSessionNames] = useState(ev.sessionNames);
  const [tableCount, setTableCount] = useState(ev.input.tables.length);
  const [msg, setMsg] = useState<string | null>(null);
  useEffect(() => {
    setName(ev.name);
    setCfg(ev.input.config);
    setSessionNames(ev.sessionNames);
    setTableCount(ev.input.tables.length);
  }, [ev]);

  const num = (k: keyof EventConfig) => (e: React.ChangeEvent<HTMLInputElement>) => setCfg({ ...cfg, [k]: Math.max(1, Number(e.target.value) || 1) });

  const save = async () => {
    if (cfg.minTableCapacity > cfg.maxTableCapacity) return setMsg("Capacidade mínima maior que a máxima.");
    if (cfg.sessionCount < ev.frozenUntil) return setMsg("Não é possível remover sessões já realizadas.");
    let tables = ev.input.tables;
    if (tableCount > tables.length)
      tables = [...tables, ...Array.from({ length: tableCount - tables.length }, (_, k) => ({ id: uid(), number: tables.length + k + 1, name: `Mesa ${tables.length + k + 1}` }))];
    if (tableCount < tables.length) {
      const removed = tables.slice(tableCount).map((t) => t.id);
      const used = ev.input.participants.some((p) => p.fixedTableId && removed.includes(p.fixedTableId)) || (ev.input.locks ?? []).some((l) => removed.includes(l.tableId));
      if (used) return setMsg("Há participantes fixos ou bloqueios nas mesas que seriam removidas.");
      if (ev.frozenUntil > 0) return setMsg("Com sessões realizadas, feche mesas na aba de imprevistos em vez de removê-las.");
      tables = tables.slice(0, tableCount);
    }
    const names = Array.from({ length: cfg.sessionCount }, (_, s) => sessionNames[s] ?? `Sessão ${s + 1}`);
    await update(
      (e) => ({ ...e, name, sessionNames: names, input: { ...e.input, tables, config: { ...cfg, tableCount: tables.length } } }),
      "configuração do evento",
      `${cfg.sessionCount} sessões, ${tables.length} mesas, capacidade ${cfg.minTableCapacity}–${cfg.maxTableCapacity}`,
    );
    setMsg("Configuração salva. Execute uma nova simulação para refletir as mudanças.");
  };

  const disabled = !canEdit;
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card title="Evento">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Nome">
            <Input disabled={disabled} value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field label="Meta de participantes">
            <Input disabled={disabled} type="number" value={cfg.participantTarget} onChange={num("participantTarget")} />
          </Field>
          <Field label="Mesas">
            <Input disabled={disabled} type="number" min={1} value={tableCount} onChange={(e) => setTableCount(Math.max(1, Number(e.target.value) || 1))} />
          </Field>
          <Field label="Sessões">
            <Input disabled={disabled} type="number" min={1} max={20} value={cfg.sessionCount} onChange={num("sessionCount")} />
          </Field>
          <Field label="Capacidade ideal por mesa">
            <Input disabled={disabled} type="number" value={cfg.idealTableCapacity} onChange={num("idealTableCapacity")} />
          </Field>
          <Field label="Duração da sessão (min)">
            <Input disabled={disabled} type="number" value={cfg.sessionDurationMinutes} onChange={num("sessionDurationMinutes")} />
          </Field>
          <Field label="Capacidade mínima operacional">
            <Input disabled={disabled} type="number" value={cfg.minTableCapacity} onChange={num("minTableCapacity")} />
          </Field>
          <Field label="Capacidade máxima padrão">
            <Input disabled={disabled} type="number" value={cfg.maxTableCapacity} onChange={num("maxTableCapacity")} />
          </Field>
        </div>
        <div className="mt-4">
          <div className="mb-1 text-xs font-medium text-slate-600">Nomes das sessões</div>
          <div className="grid gap-2 sm:grid-cols-3">
            {Array.from({ length: cfg.sessionCount }, (_, s) => (
              <Input key={s} disabled={disabled} value={sessionNames[s] ?? `Sessão ${s + 1}`} onChange={(e) => setSessionNames(Object.assign([...sessionNames], { [s]: e.target.value }))} />
            ))}
          </div>
        </div>
      </Card>
      <Card title="Regras da metodologia MNBD">
        <div className="space-y-3 text-sm">
          <label className="flex items-center gap-2">
            <input type="checkbox" disabled={disabled} checked={cfg.avoidTableRevisit} onChange={(e) => setCfg({ ...cfg, avoidTableRevisit: e.target.checked })} />
            avoid_table_revisit — penalização baixa para voltar à mesma mesa física (repetir PESSOAS é o que importa)
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" disabled={disabled} checked={cfg.allowSameCompany} onChange={(e) => setCfg({ ...cfg, allowSameCompany: e.target.checked })} />
            allow_same_company — permitir pessoas da mesma empresa na mesa (com penalização)
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" disabled={disabled} checked={cfg.spreadHighDemand} onChange={(e) => setCfg({ ...cfg, spreadHighDemand: e.target.checked })} />
            Evitar concentrar participantes muito demandados na mesma mesa (preferência, não restrição)
          </label>
          <Field label="Prioridade do MUST_MEET" hint="Obrigatório: MUST_MEET viável é tratado como restrição obrigatória (P0). Ordem literal: reencontros (P1) antes de MUST_MEET (P2).">
            <Select disabled={disabled || !isAdmin} className="w-full" value={cfg.mustMeetPriority} onChange={(e) => setCfg({ ...cfg, mustMeetPriority: e.target.value as EventConfig["mustMeetPriority"] })}>
              <option value="HARD">Obrigatório (P0) — padrão</option>
              <option value="AFTER_REPEATS">Após reencontros (P2)</option>
            </Select>
          </Field>
          <div className="grid grid-cols-3 gap-2">
            {(
              [
                ["Alta demanda ≥", "high"],
                ["Crítica ≥", "critical"],
                ["Sobredemanda >", "over"],
              ] as const
            ).map(([l, k]) => (
              <Field key={k} label={`${l} (IPD %)`}>
                <Input
                  disabled={disabled}
                  type="number"
                  value={Math.round(cfg.demandThresholds[k] * 100)}
                  onChange={(e) => setCfg({ ...cfg, demandThresholds: { ...cfg.demandThresholds, [k]: (Number(e.target.value) || 0) / 100 } })}
                />
              </Field>
            ))}
          </div>
          <details>
            <summary className="cursor-pointer text-xs font-medium text-slate-600">Pesos internos da busca (avançado)</summary>
            <p className="mt-1 text-xs text-slate-500">
              Guiam a busca local. A escolha final entre soluções é sempre lexicográfica (P0 violações → P1 reencontros → P2 MUST_MEET → P3 HIGH_PRIORITY → P4 satisfação mínima → P5 P10 →
              P6 preferências → P7 contatos → P8 diversidade → P9 ocupação → P10 mesa física).
            </p>
            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {(Object.keys(DEFAULT_WEIGHTS) as (keyof typeof DEFAULT_WEIGHTS)[])
                .filter((k) => k !== "typeWeight")
                .map((k) => (
                  <Field key={k} label={k}>
                    <Input
                      disabled={disabled}
                      type="number"
                      value={cfg.weights[k] as number}
                      onChange={(e) => setCfg({ ...cfg, weights: { ...cfg.weights, [k]: Number(e.target.value) || 0 } })}
                    />
                  </Field>
                ))}
              {(Object.keys(DEFAULT_WEIGHTS.typeWeight) as (keyof typeof DEFAULT_WEIGHTS.typeWeight)[]).map((k) => (
                <Field key={k} label={`peso ${k}`}>
                  <Input
                    disabled={disabled}
                    type="number"
                    value={cfg.weights.typeWeight[k]}
                    onChange={(e) => setCfg({ ...cfg, weights: { ...cfg.weights, typeWeight: { ...cfg.weights.typeWeight, [k]: Number(e.target.value) || 0 } } })}
                  />
                </Field>
              ))}
            </div>
          </details>
        </div>
      </Card>
      <div className="lg:col-span-2">
        {msg && <div className="mb-2 rounded bg-slate-100 p-2 text-sm">{msg}</div>}
        <Button disabled={disabled} onClick={save}>
          Salvar configuração
        </Button>
      </div>
    </div>
  );
}

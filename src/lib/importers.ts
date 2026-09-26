import Papa from "papaparse";
import type { EventTable, Participant, ParticipantKind, Preference, PreferenceType } from "@/engine";
import { uid } from "./utils";

/** Lê CSV ou XLSX e devolve linhas como objetos com cabeçalhos normalizados. */
export async function readTable(file: File): Promise<Record<string, string>[]> {
  const norm = (h: string) =>
    h
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_");
  if (/\.xlsx$/i.test(file.name)) {
    const { default: readXlsxFile } = await import("read-excel-file");
    const rows = await readXlsxFile(file);
    const [head, ...body] = rows;
    const keys = head.map((h) => norm(String(h ?? "")));
    return body.map((r) => Object.fromEntries(keys.map((k, i) => [k, r[i] === null || r[i] === undefined ? "" : String(r[i])])));
  }
  const text = await file.text();
  const parsed = Papa.parse<Record<string, string>>(text, { header: true, skipEmptyLines: true, transformHeader: norm });
  return parsed.data;
}

const truthy = (v: string | undefined, d: boolean) => {
  if (v === undefined || v === "") return d;
  return ["1", "sim", "s", "true", "yes", "y", "x", "verdadeiro"].includes(v.trim().toLowerCase());
};

export function participantsFromRows(rows: Record<string, string>[], tables: EventTable[]): { participants: Participant[]; errors: string[] } {
  const errors: string[] = [];
  const participants: Participant[] = [];
  rows.forEach((r, k) => {
    const name = r.nome ?? r.name ?? "";
    if (!name.trim()) {
      errors.push(`Linha ${k + 2}: sem nome.`);
      return;
    }
    const mesa = r.mesa_fixa ?? r.fixed_table ?? "";
    const table = mesa ? tables.find((t) => String(t.number) === mesa.trim() || t.name.toLowerCase() === mesa.trim().toLowerCase()) : undefined;
    if (mesa && !table) errors.push(`Linha ${k + 2}: mesa fixa "${mesa}" não existe.`);
    const kindRaw = (r.tipo ?? r.kind ?? "PARTICIPANT").toUpperCase();
    const kind: ParticipantKind = kindRaw.startsWith("MOD") ? "MODERATOR" : kindRaw.startsWith("ANC") || kindRaw.startsWith("ÂNC") ? "ANCHOR" : "PARTICIPANT";
    participants.push({
      id: r.id?.trim() || uid(),
      name: name.trim(),
      company: (r.empresa ?? r.company ?? "").trim(),
      role: (r.cargo ?? r.role ?? "").trim(),
      segment: (r.segmento ?? r.segment ?? "").trim(),
      category: (r.categoria ?? r.category ?? "").trim(),
      description: (r.descricao ?? r.description ?? "").trim(),
      tags: (r.tags ?? r.interesses ?? "")
        .split(/[;,|]/)
        .map((t) => t.trim())
        .filter(Boolean),
      active: truthy(r.ativo ?? r.active, true),
      fixed: truthy(r.fixo ?? r.participante_fixo, false) || !!table,
      fixedTableId: table?.id ?? null,
      institutionalPriority: Math.max(0, Math.min(3, Number(r.prioridade_institucional ?? r.prioridade ?? 0) || 0)),
      kind,
      countsTowardCapacity: truthy(r.conta_capacidade ?? r.counts_toward_capacity, kind !== "MODERATOR"),
      notes: (r.observacoes ?? r.notes ?? "").trim(),
      status: "CONFIRMED",
    });
  });
  return { participants, errors };
}

const TYPE_ALIASES: Record<string, PreferenceType> = {
  normal: "NORMAL",
  prefer: "PREFER",
  prefere: "PREFER",
  preferencia: "PREFER",
  high_priority: "HIGH_PRIORITY",
  alta: "HIGH_PRIORITY",
  alta_prioridade: "HIGH_PRIORITY",
  must_meet: "MUST_MEET",
  obrigatorio: "MUST_MEET",
  deve_encontrar: "MUST_MEET",
  avoid: "AVOID",
  evitar: "AVOID",
  must_not_meet: "MUST_NOT_MEET",
  proibido: "MUST_NOT_MEET",
  nao_pode_encontrar: "MUST_NOT_MEET",
};

export function preferencesFromRows(rows: Record<string, string>[], participants: Participant[]): { preferences: Preference[]; errors: string[] } {
  const errors: string[] = [];
  const byKey = new Map<string, string>();
  for (const p of participants) {
    byKey.set(p.id.toLowerCase(), p.id);
    byKey.set(p.name.trim().toLowerCase(), p.id);
  }
  const preferences: Preference[] = [];
  rows.forEach((r, k) => {
    const src = byKey.get((r.origem ?? r.source ?? r.solicitante ?? "").trim().toLowerCase());
    const tgt = byKey.get((r.destino ?? r.target ?? r.alvo ?? "").trim().toLowerCase());
    if (!src || !tgt) {
      errors.push(`Linha ${k + 2}: participante de origem/destino não encontrado.`);
      return;
    }
    if (src === tgt) {
      errors.push(`Linha ${k + 2}: origem e destino iguais.`);
      return;
    }
    const tRaw = (r.tipo ?? r.type ?? "PREFER")
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z]+/g, "_");
    const type = TYPE_ALIASES[tRaw] ?? (tRaw.toUpperCase() as PreferenceType);
    if (!TYPE_ALIASES[tRaw] && !["NORMAL", "PREFER", "HIGH_PRIORITY", "MUST_MEET", "AVOID", "MUST_NOT_MEET"].includes(type)) {
      errors.push(`Linha ${k + 2}: tipo "${r.tipo ?? r.type}" inválido.`);
      return;
    }
    preferences.push({
      id: uid(),
      sourceId: src,
      targetId: tgt,
      type,
      weight: Number(r.peso ?? r.weight ?? 1) || 1,
      reason: (r.motivo ?? r.reason ?? "").trim(),
      allowRepeat: truthy(r.reencontro_estrategico ?? r.allow_repeat, false),
    });
  });
  return { preferences, errors };
}

export function participantsToCsv(ps: Participant[], tables: EventTable[]): string {
  return Papa.unparse(
    ps.map((p) => ({
      id: p.id,
      nome: p.name,
      empresa: p.company,
      cargo: p.role,
      segmento: p.segment,
      categoria: p.category,
      descricao: p.description ?? "",
      tags: p.tags.join(";"),
      ativo: p.active ? "sim" : "não",
      fixo: p.fixed ? "sim" : "não",
      mesa_fixa: tables.find((t) => t.id === p.fixedTableId)?.number ?? "",
      prioridade_institucional: p.institutionalPriority,
      tipo: p.kind,
      conta_capacidade: p.countsTowardCapacity ? "sim" : "não",
      observacoes: p.notes ?? "",
    })),
  );
}

export function preferencesToCsv(prefs: Preference[], participants: Participant[]): string {
  const name = new Map(participants.map((p) => [p.id, p.name]));
  return Papa.unparse(
    prefs.map((p) => ({
      origem: p.sourceId,
      origem_nome: name.get(p.sourceId) ?? "",
      destino: p.targetId,
      destino_nome: name.get(p.targetId) ?? "",
      tipo: p.type,
      peso: p.weight ?? 1,
      motivo: p.reason ?? "",
      reencontro_estrategico: p.allowRepeat ? "sim" : "não",
    })),
  );
}

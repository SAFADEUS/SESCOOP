// Gerador de cenários de teste (sandbox) — seções 45 a 51.
// Todos os cenários são determinísticos a partir da seed.

import { hashSeed, mulberry32, pick, randInt, shuffle, type Rng } from "./rng.ts";
import {
  DEFAULT_CONFIG,
  type EventConfig,
  type EventInput,
  type EventTable,
  type Participant,
  type Preference,
  type PreferenceType,
} from "./types.ts";

export type ScenarioKey = "A_EQUILIBRADO" | "B_ESTRELA" | "C_CINCO_DEMANDADOS" | "D_DESIGUALDADE" | "E_IMPREVISTO" | "F_RESTRICOES";

export const SCENARIOS: { key: ScenarioKey; label: string; description: string }[] = [
  { key: "A_EQUILIBRADO", label: "A — Equilibrado", description: "Cada participante recebe de 5 a 8 solicitações, distribuição uniforme." },
  { key: "B_ESTRELA", label: "B — Uma estrela", description: "Um participante recebe 40 solicitações (capacidade 30, IPD 133,3%)." },
  { key: "C_CINCO_DEMANDADOS", label: "C — Cinco muito demandados", description: "Cinco participantes com 35, 32, 30, 27 e 25 solicitações." },
  { key: "D_DESIGUALDADE", label: "D — Desigualdade", description: "10 com 20+ solicitações, 20 intermediários, 30 com poucas ou nenhuma." },
  { key: "E_IMPREVISTO", label: "E — Imprevisto real", description: "Após a sessão 2: 1 falta, 1 chega só na sessão 3 e 1 mesa fica indisponível." },
  { key: "F_RESTRICOES", label: "F — Restrições obrigatórias", description: "MUST_MEET, MUST_NOT_MEET, participante fixo, moderador e reencontro estratégico." },
];

const FIRST = [
  "Ana", "Bruno", "Carla", "Daniel", "Eduarda", "Felipe", "Gabriela", "Heitor", "Isabela", "João", "Karina", "Lucas",
  "Mariana", "Nicolas", "Olívia", "Paulo", "Queila", "Rafael", "Sofia", "Tiago", "Úrsula", "Vinícius", "Wesley", "Ximena",
  "Yasmin", "Zeca", "Aline", "Bernardo", "Cecília", "Diego", "Elisa", "Fábio", "Giovana", "Hugo", "Iara", "Jorge",
  "Larissa", "Marcelo", "Natália", "Otávio", "Patrícia", "Renato", "Sabrina", "Thiago", "Valéria", "Wagner", "Yuri", "Zilda",
  "Amanda", "Caio", "Débora", "Enzo", "Fernanda", "Gustavo", "Helena", "Igor", "Júlia", "Leonardo", "Manuela", "Otto",
  "Priscila", "Rodrigo", "Silvia", "Tânia", "Vitor", "Beatriz", "Carlos", "Denise", "Emerson", "Flávia",
];
const LAST = [
  "Silva", "Souza", "Oliveira", "Santos", "Lima", "Pereira", "Costa", "Rodrigues", "Almeida", "Nascimento", "Carvalho",
  "Gomes", "Martins", "Araújo", "Ribeiro", "Barbosa", "Rocha", "Dias", "Teixeira", "Moreira", "Cardoso", "Mendes",
];
const SEGMENTS = ["Crédito", "Agropecuário", "Saúde", "Transporte", "Consumo", "Infraestrutura", "Trabalho e Serviços", "Educação"];
const CATEGORIES = ["Cooperativa", "Fornecedor", "Investidor", "Instituição", "Startup"];
const ROLES = ["Presidente", "Diretor(a)", "Gerente", "Coordenador(a)", "Analista de Negócios", "Superintendente", "Conselheiro(a)"];
const TAGS = ["exportação", "tecnologia", "energia solar", "logística", "crédito rural", "ESG", "varejo", "inovação", "seguros", "capacitação", "saúde digital", "intercooperação"];
const COOP_WORDS = ["Coop", "Uni", "Agro", "Vale", "Sul", "Norte", "Serra", "Rio", "Mar", "Terra", "Vida", "Forte"];

export function makeTables(count: number): EventTable[] {
  return Array.from({ length: count }, (_, t) => ({ id: `T${String(t + 1).padStart(2, "0")}`, number: t + 1, name: `Mesa ${t + 1}` }));
}

export function makeParticipants(rng: Rng, count: number): Participant[] {
  // ~15 empresas com 2 pessoas e as demais individuais (teste de same_company).
  const companies: string[] = [];
  const nCompanies = Math.max(1, count - Math.floor(count / 4));
  for (let c = 0; c < nCompanies; c++) {
    const name = `${pick(rng, COOP_WORDS)}${pick(rng, COOP_WORDS).toLowerCase()} ${pick(rng, ["Cooperativa", "Coop", "Sicoob", "Unimed", "Cooperativa Agroindustrial", "Cooperativa de Crédito"])} ${c + 1}`;
    companies.push(name);
  }
  const usedNames = new Set<string>();
  const out: Participant[] = [];
  for (let i = 0; i < count; i++) {
    let name = "";
    for (let k = 0; k < 50; k++) {
      name = `${FIRST[(i + k * 7) % FIRST.length]} ${pick(rng, LAST)}`;
      if (!usedNames.has(name)) break;
    }
    usedNames.add(name);
    const company = i < nCompanies ? companies[i] : companies[randInt(rng, nCompanies)];
    const tags = shuffle(rng, [...TAGS]).slice(0, 2 + randInt(rng, 3));
    out.push({
      id: `P${String(i + 1).padStart(3, "0")}`,
      name,
      company,
      role: pick(rng, ROLES),
      segment: pick(rng, SEGMENTS),
      category: pick(rng, CATEGORIES),
      description: `Interesse em ${tags.join(", ")}.`,
      tags,
      active: true,
      fixed: false,
      fixedTableId: null,
      institutionalPriority: rng() < 0.1 ? 1 + randInt(rng, 3) : 0,
      kind: "PARTICIPANT",
      countsTowardCapacity: true,
      notes: "",
      status: "CONFIRMED",
    });
  }
  return out;
}

function randomType(rng: Rng): PreferenceType {
  const r = rng();
  if (r < 0.25) return "NORMAL";
  if (r < 0.8) return "PREFER";
  return "HIGH_PRIORITY";
}

/**
 * Gera preferências a partir de uma meta de solicitações recebidas por participante.
 * Os solicitantes são sorteados; a distribuição de outbound fica próxima da média.
 */
function prefsFromInbound(rng: Rng, participants: Participant[], inboundTarget: number[], maxOutbound = 30): Preference[] {
  const n = participants.length;
  const prefs: Preference[] = [];
  const outbound = new Array<number>(n).fill(0);
  const exists = new Set<string>();
  // Atende primeiro quem tem maior demanda para garantir a meta exata.
  const order = inboundTarget.map((v, i) => [v, i]).sort((a, b) => b[0] - a[0] || a[1] - b[1]);
  for (const [target, j] of order) {
    const sources = shuffle(
      rng,
      Array.from({ length: n }, (_, i) => i).filter((i) => i !== j),
    ).sort((a, b) => outbound[a] - outbound[b]); // equilibra outbound
    let added = 0;
    for (const i of sources) {
      if (added >= target) break;
      if (outbound[i] >= maxOutbound) continue;
      const key = `${i}>${j}`;
      if (exists.has(key)) continue;
      exists.add(key);
      outbound[i]++;
      added++;
      prefs.push({
        id: `pref-${prefs.length + 1}`,
        sourceId: participants[i].id,
        targetId: participants[j].id,
        type: randomType(rng),
        reason: "Gerado pelo simulador",
      });
    }
  }
  return prefs;
}

export interface ScenarioBundle {
  key: ScenarioKey;
  name: string;
  seed: number;
  input: EventInput;
  /** Para o cenário E: script do imprevisto (aplicado após a sessão 2). */
  incident?: {
    afterSession: number; // sessões 0..afterSession-1 congeladas
    absentId: string; // falta a partir da sessão afterSession
    lateId: string; // chega apenas na sessão afterSession (ausente nas anteriores)
    closedTableId: string; // indisponível a partir da sessão afterSession
    capacityOverride: number; // capacidade máxima nas sessões futuras
  };
  notes: string[];
}

export function generateScenario(key: ScenarioKey, seed = 1, config: Partial<EventConfig> = {}): ScenarioBundle {
  const rng = mulberry32(hashSeed("scenario", key, seed));
  const cfg: EventConfig = { ...DEFAULT_CONFIG, ...config, weights: { ...DEFAULT_CONFIG.weights, ...(config.weights ?? {}) } };
  const n = cfg.participantTarget;
  const participants = makeParticipants(rng, n);
  const tables = makeTables(cfg.tableCount);
  const notes: string[] = [];
  let inbound: number[] = [];
  const balanced = () => 5 + randInt(rng, 4); // 5..8

  switch (key) {
    case "A_EQUILIBRADO":
    case "E_IMPREVISTO":
    case "F_RESTRICOES":
      inbound = Array.from({ length: n }, balanced);
      break;
    case "B_ESTRELA": {
      inbound = Array.from({ length: n }, () => 4 + randInt(rng, 4));
      inbound[0] = Math.min(40, n - 1);
      participants[0].name = "Carlos Estrela";
      participants[0].role = "Presidente";
      notes.push(`${participants[0].name} recebe ${inbound[0]} solicitações.`);
      break;
    }
    case "C_CINCO_DEMANDADOS": {
      inbound = Array.from({ length: n }, () => 3 + randInt(rng, 4));
      const hubs = [35, 32, 30, 27, 25];
      hubs.forEach((v, k) => {
        inbound[k] = Math.min(v, n - 1);
        participants[k].name = `${["Alice", "Bento", "Clara", "Davi", "Elaine"][k]} ${participants[k].name.split(" ")[1]}`;
      });
      notes.push("Participantes P001–P005 recebem 35, 32, 30, 27 e 25 solicitações.");
      break;
    }
    case "D_DESIGUALDADE": {
      inbound = Array.from({ length: n }, (_, i) => {
        if (i < Math.round(n / 6)) return 20 + randInt(rng, 9); // 20..28
        if (i < Math.round(n / 2)) return 6 + randInt(rng, 7); // 6..12
        return randInt(rng, 4); // 0..3
      });
      notes.push("10 participantes com 20+, 20 intermediários, 30 com 0–3 solicitações.");
      break;
    }
  }
  const preferences = prefsFromInbound(rng, participants, inbound);
  const input: EventInput = { config: cfg, participants, preferences, tables, availability: {}, tableAvailability: {}, locks: [] };
  const bundle: ScenarioBundle = { key, name: SCENARIOS.find((s) => s.key === key)!.label, seed, input, notes };

  if (key === "F_RESTRICOES") {
    const ids = participants.map((p) => p.id);
    let hardSeq = 0;
    const add = (a: number, b: number, type: PreferenceType, reason: string, allowRepeat = false) => {
      // remove preferência pré-existente do mesmo par direcional
      input.preferences = input.preferences.filter((p) => !(p.sourceId === ids[a] && p.targetId === ids[b]));
      input.preferences.push({ id: `pref-hard-${++hardSeq}`, sourceId: ids[a], targetId: ids[b], type, reason, allowRepeat });
    };
    const mm: [number, number][] = [[1, 2], [3, 4], [5, 6], [7, 8], [1, 9], [10, 11], [12, 13], [14, 15]];
    const mn: [number, number][] = [[1, 3], [2, 4], [5, 7], [6, 8], [9, 10], [11, 12], [13, 14], [16, 17]];
    mm.forEach(([a, b]) => add(a, b, "MUST_MEET", "Reunião institucional obrigatória"));
    mn.forEach(([a, b]) => add(a, b, "MUST_NOT_MEET", "Conflito comercial"));
    add(20, 21, "MUST_MEET", "Continuidade de negociação (reencontro estratégico)", true);
    participants[25].fixed = true;
    participants[25].fixedTableId = tables[2].id;
    participants[25].kind = "ANCHOR";
    participants[25].notes = "Âncora fixa na Mesa 3";
    participants.push({
      id: "M001",
      name: "Moderador(a) Mesa 1",
      company: "Organização",
      role: "Moderador(a)",
      segment: "Organização",
      category: "Instituição",
      tags: [],
      active: true,
      fixed: true,
      fixedTableId: tables[0].id,
      institutionalPriority: 0,
      kind: "MODERATOR",
      countsTowardCapacity: false,
      status: "CONFIRMED",
    });
    notes.push("8 pares MUST_MEET, 8 pares MUST_NOT_MEET, 1 reencontro estratégico permitido, 1 âncora fixa (Mesa 3), 1 moderador fora da capacidade (Mesa 1).");
  }

  if (key === "E_IMPREVISTO") {
    bundle.incident = {
      afterSession: 2,
      absentId: participants[10].id,
      lateId: participants[20].id,
      closedTableId: tables[tables.length - 1].id,
      capacityOverride: cfg.maxTableCapacity + 1,
    };
    notes.push(
      `Após a sessão 2: ${participants[10].name} falta; ${participants[20].name} chega apenas na sessão 3; ${tables[tables.length - 1].name} fica indisponível. ` +
        `Com 59 presentes e 9 mesas (54 lugares), a capacidade das sessões futuras é ampliada para ${cfg.maxTableCapacity + 1} (ação "alterar capacidade").`,
    );
  }
  return bundle;
}

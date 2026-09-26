import { createStore, del, get, keys, set } from "idb-keyval";
import type { Repo } from "./repo";
import type { AuditEntry, EventSummary, RunRecord, SandboxEvent } from "./types";

// IndexedDB do navegador: ideal para o SANDBOX (dados nunca saem da máquina).
const eventsStore = createStore("nexacoop-events", "events");
const runsStore = createStore("nexacoop-runs", "runs");
const auditStore = createStore("nexacoop-audit", "audit");

const uid = () => (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2));

export const localRepo: Repo = {
  kind: "local",
  async listEvents() {
    const ids = (await keys(eventsStore)) as string[];
    const out: EventSummary[] = [];
    for (const id of ids) {
      const ev = (await get(id, eventsStore)) as SandboxEvent | undefined;
      if (!ev) continue;
      const runs = ((await get(ev.id, runsStore)) as RunRecord[] | undefined) ?? [];
      out.push({
        id: ev.id,
        name: ev.name,
        status: ev.status,
        sandbox: ev.sandbox,
        scenarioKey: ev.scenarioKey,
        participants: ev.input.participants.filter((p) => p.active).length,
        preferences: ev.input.preferences.length,
        runs: runs.length,
        updatedAt: ev.updatedAt,
      });
    }
    return out.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  },
  async getEvent(id) {
    return ((await get(id, eventsStore)) as SandboxEvent | undefined) ?? null;
  },
  async saveEvent(ev) {
    const saved = { ...ev, updatedAt: new Date().toISOString() };
    await set(ev.id, saved, eventsStore);
    return saved;
  },
  async deleteEvent(id) {
    const ev = (await get(id, eventsStore)) as SandboxEvent | undefined;
    if (ev && !ev.sandbox) throw new Error("Somente eventos sandbox podem ser apagados.");
    await del(id, eventsStore);
    await del(id, runsStore);
    await del(id, auditStore);
  },
  async listRuns(eventId) {
    const runs = ((await get(eventId, runsStore)) as RunRecord[] | undefined) ?? [];
    return [...runs].sort((a, b) => b.version - a.version);
  },
  async insertRun(run) {
    const runs = ((await get(run.eventId, runsStore)) as RunRecord[] | undefined) ?? [];
    const version = runs.reduce((m, r) => Math.max(m, r.version), 0) + 1;
    const rec: RunRecord = { ...run, id: run.id || uid(), version };
    await set(run.eventId, [...runs, rec], runsStore);
    return rec;
  },
  async updateRunStatus(id, patch) {
    const ids = (await keys(runsStore)) as string[];
    for (const eventId of ids) {
      const runs = ((await get(eventId, runsStore)) as RunRecord[] | undefined) ?? [];
      const i = runs.findIndex((r) => r.id === id);
      if (i < 0) continue;
      let next = runs.map((r, k) => (k === i ? { ...r, ...patch } : r));
      if (patch.status === "PUBLISHED")
        next = next.map((r, k) => (k !== i && r.status === "PUBLISHED" ? { ...r, status: "SUPERSEDED" as const } : r));
      await set(eventId, next, runsStore);
      return;
    }
  },
  async addAudit(entry) {
    const list = ((await get(entry.eventId, auditStore)) as AuditEntry[] | undefined) ?? [];
    list.push({ ...entry, id: uid(), at: new Date().toISOString() });
    await set(entry.eventId, list.slice(-2000), auditStore);
  },
  async listAudit(eventId) {
    const list = ((await get(eventId, auditStore)) as AuditEntry[] | undefined) ?? [];
    return [...list].reverse();
  },
};

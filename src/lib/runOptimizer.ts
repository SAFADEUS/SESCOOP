import type { EventInput, OptimizationResult, OptimizeOptions } from "@/engine";

let seq = 0;

/** Roda o otimizador num Web Worker (a interface não trava). */
export function runOptimizer(
  input: EventInput,
  opts: Omit<OptimizeOptions, "onProgress">,
  onProgress?: (p: number, label: string) => void,
): Promise<OptimizationResult> {
  const worker = new Worker(new URL("../workers/optimizer.worker.ts", import.meta.url), { type: "module" });
  const id = ++seq;
  return new Promise((resolve, reject) => {
    worker.onmessage = (e) => {
      const m = e.data;
      if (m.id !== id) return;
      if (m.type === "progress") onProgress?.(m.p, m.label);
      else if (m.type === "done") {
        worker.terminate();
        resolve(m.result as OptimizationResult);
      } else if (m.type === "error") {
        worker.terminate();
        reject(new Error(m.error));
      }
    };
    worker.onerror = (e) => {
      worker.terminate();
      reject(new Error(e.message));
    };
    worker.postMessage({ id, input, opts });
  });
}

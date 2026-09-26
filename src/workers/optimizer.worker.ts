/// <reference lib="webworker" />
// Executa o motor fora da thread da interface.
import { optimizeEvent, type EventInput, type OptimizeOptions } from "@/engine";

type Msg = { id: number; input: EventInput; opts: Omit<OptimizeOptions, "onProgress"> };

self.onmessage = (e: MessageEvent<Msg>) => {
  const { id, input, opts } = e.data;
  try {
    const result = optimizeEvent(input, {
      ...opts,
      onProgress: (p, label) => (self as unknown as Worker).postMessage({ id, type: "progress", p, label }),
    });
    (self as unknown as Worker).postMessage({ id, type: "done", result });
  } catch (err) {
    (self as unknown as Worker).postMessage({ id, type: "error", error: err instanceof Error ? err.message : String(err) });
  }
};

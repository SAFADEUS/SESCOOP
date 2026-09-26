// Copia src/engine para supabase/functions/_shared/engine (Edge Functions não enxergam fora de supabase/functions).
// Uso: node scripts/sync-engine.mjs [--check]
import { cpSync, readdirSync, readFileSync, rmSync, existsSync } from "node:fs";
import { join } from "node:path";

const src = "src/engine";
const dst = "supabase/functions/_shared/engine";
const files = readdirSync(src).filter((f) => f.endsWith(".ts"));
if (process.argv.includes("--check")) {
  const stale = files.filter((f) => !existsSync(join(dst, f)) || readFileSync(join(src, f), "utf8") !== readFileSync(join(dst, f), "utf8"));
  if (stale.length) {
    console.error("Cópia do motor desatualizada em supabase/functions/_shared/engine:", stale.join(", "), "\nRode: npm run sync:engine");
    process.exit(1);
  }
  console.log("Motor sincronizado.");
} else {
  rmSync(dst, { recursive: true, force: true });
  for (const f of files) cpSync(join(src, f), join(dst, f));
  console.log(`Copiados ${files.length} arquivos para ${dst}`);
}

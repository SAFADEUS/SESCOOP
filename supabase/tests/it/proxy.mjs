// Proxy mínimo que imita as rotas do Supabase usadas pelo supabase-js:
//   /rest/v1/*  → PostgREST local
//   /auth/v1/user → devolve o usuário do JWT (sem GoTrue)
import http from "node:http";
const target = process.env.PGRST ?? "http://127.0.0.1:3900";
const port = Number(process.env.PORT ?? 54321);
http
  .createServer(async (req, res) => {
    const cors = { "access-control-allow-origin": "*", "access-control-allow-headers": "*", "access-control-allow-methods": "*" };
    if (req.method === "OPTIONS") return res.writeHead(204, cors).end();
    if (req.url.startsWith("/auth/v1/user")) {
      const tok = (req.headers.authorization ?? "").replace(/^Bearer /, "");
      try {
        const claims = JSON.parse(Buffer.from(tok.split(".")[1], "base64url").toString());
        res.writeHead(200, { ...cors, "content-type": "application/json" });
        return res.end(JSON.stringify({ id: claims.sub, email: claims.email, aud: "authenticated", role: "authenticated", app_metadata: {}, user_metadata: {}, created_at: new Date().toISOString() }));
      } catch {
        res.writeHead(401, cors);
        return res.end(JSON.stringify({ message: "invalid token" }));
      }
    }
    if (!req.url.startsWith("/rest/v1")) return res.writeHead(404, cors).end();
    const chunks = [];
    for await (const c of req) chunks.push(c);
    const headers = { ...req.headers };
    delete headers.host;
    delete headers["content-length"];
    const r = await fetch(target + req.url.slice("/rest/v1".length), { method: req.method, headers, body: chunks.length ? Buffer.concat(chunks) : undefined });
    const out = Buffer.from(await r.arrayBuffer());
    const h = Object.fromEntries(r.headers.entries());
    delete h["content-encoding"];
    delete h["content-length"];
    delete h["transfer-encoding"];
    res.writeHead(r.status, { ...h, ...cors });
    res.end(out);
  })
  .listen(port, "127.0.0.1", () => console.log(`proxy supabase-like em http://127.0.0.1:${port}`));

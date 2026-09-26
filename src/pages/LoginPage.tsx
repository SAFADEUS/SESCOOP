import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Card, Field, Input } from "@/components/ui";
import { supabase } from "@/data/supabaseClient";

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [org, setOrg] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const nav = useNavigate();
  if (!supabase) return <Card>Supabase não configurado. Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.</Card>;
  const sb = supabase;
  const signIn = async () => {
    const { error } = await sb.auth.signInWithPassword({ email, password });
    if (error) return setMsg(error.message);
    const { data } = await sb.auth.getUser();
    const { data: roles } = await sb.from("user_roles").select("id").eq("user_id", data.user!.id).limit(1);
    if (!roles?.length && org) {
      const { error: e2 } = await sb.rpc("create_organization", { _name: org });
      if (e2) return setMsg(e2.message);
    }
    nav("/");
  };
  const signUp = async () => {
    const { error } = await sb.auth.signUp({ email, password });
    setMsg(error ? error.message : "Conta criada. Confirme o e-mail (se exigido) e entre.");
  };
  return (
    <div className="mx-auto max-w-md">
      <Card title="Entrar no NexaCoop">
        <div className="space-y-3">
          <Field label="E-mail">
            <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" />
          </Field>
          <Field label="Senha">
            <Input value={password} onChange={(e) => setPassword(e.target.value)} type="password" />
          </Field>
          <Field label="Organização (somente no primeiro acesso)" hint="Se o seu usuário ainda não tem organização, ela será criada e você será ADMIN.">
            <Input value={org} onChange={(e) => setOrg(e.target.value)} placeholder="Ex.: Sistema OCB/RJ" />
          </Field>
          {msg && <div className="text-sm text-red-600">{msg}</div>}
          <div className="flex gap-2">
            <Button onClick={signIn}>Entrar</Button>
            <Button variant="outline" onClick={signUp}>
              Criar conta
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

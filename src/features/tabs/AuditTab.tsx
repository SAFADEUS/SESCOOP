import { useEffect, useState } from "react";
import { Badge, Card, Empty } from "@/components/ui";
import type { AuditEntry } from "@/data/types";
import { useApp } from "@/features/AppContext";
import { useEvent } from "@/features/EventContext";
import { fmtDate } from "@/lib/utils";

export function AuditTab() {
  const { repo, role } = useApp();
  const { ev, runs } = useEvent();
  const [list, setList] = useState<AuditEntry[] | null>(null);
  useEffect(() => {
    repo.listAudit(ev.id).then(setList).catch(() => setList([]));
  }, [repo, ev, runs]);
  if (role === "VIEWER") return <Empty>A auditoria é visível para ADMIN e OPERATOR.</Empty>;
  return (
    <Card title="Auditoria (quem, quando, o quê)">
      {!list?.length ? (
        <Empty>Nenhum registro.</Empty>
      ) : (
        <div className="max-h-[70vh] overflow-auto">
          <table className="tbl">
            <thead>
              <tr>
                <th>Data/hora</th>
                <th>Usuário</th>
                <th>Papel</th>
                <th>Ação</th>
                <th>Detalhes</th>
              </tr>
            </thead>
            <tbody>
              {list.map((a) => (
                <tr key={a.id}>
                  <td className="whitespace-nowrap text-xs">{fmtDate(a.at)}</td>
                  <td className="text-xs">{a.user}</td>
                  <td>
                    <Badge>{a.role}</Badge>
                  </td>
                  <td className="font-medium">{a.action}</td>
                  <td className="text-xs text-slate-600">{a.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

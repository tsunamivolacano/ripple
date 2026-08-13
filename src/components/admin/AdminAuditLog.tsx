import React, { useState, useEffect } from 'react';
import { AdminAuditEntry } from '@/types/admin';
import { ShieldCheck, Eye, ExternalLink, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export const AdminAuditLog: React.FC = () => {
  const [logs, setLogs] = useState<AdminAuditEntry[]>([]);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('ripple_admin_audit_logs') || '[]');
      setLogs(saved);
    } catch {
      setLogs([]);
    }
  }, []);

  return (
    <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 shadow-2xl">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          <h2 className="text-xl font-extrabold text-white">Admin Action Audit Log</h2>
        </div>
        <Badge variant="outline" className="text-xs border-emerald-500/30 text-emerald-400 bg-emerald-950/40">
          Secured Audit Trail
        </Badge>
      </div>

      {logs.length > 0 ? (
        <Table>
          <TableHeader className="bg-slate-950 border-b border-slate-800">
            <TableRow>
              <TableHead className="text-slate-300 font-bold text-xs">Timestamp</TableHead>
              <TableHead className="text-slate-300 font-bold text-xs">Admin Account</TableHead>
              <TableHead className="text-slate-300 font-bold text-xs">Action Performed</TableHead>
              <TableHead className="text-slate-300 font-bold text-xs">Target User</TableHead>
              <TableHead className="text-slate-300 font-bold text-xs">Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-slate-800 text-xs font-mono">
            {logs.map((log) => (
              <TableRow key={log.id}>
                <TableCell className="text-slate-400">
                  {new Date(log.timestamp).toLocaleString()}
                </TableCell>
                <TableCell className="text-purple-300 font-bold">{log.adminEmail}</TableCell>
                <TableCell>
                  <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/40">
                    {log.action}
                  </Badge>
                </TableCell>
                <TableCell className="text-slate-200">{log.targetUserEmail}</TableCell>
                <TableCell className="text-slate-400 italic">{log.details || 'Standard support inspection'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <div className="p-8 text-center text-slate-500 text-xs">
          No admin audit entries recorded yet. Inspecting or viewing accounts as an admin will generate entries here.
        </div>
      )}
    </div>
  );
};
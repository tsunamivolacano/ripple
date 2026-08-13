import React, { useState } from 'react';
import { AdminUserSummary } from '@/types/admin';
import { 
  Users, 
  Search, 
  ArrowUpDown, 
  ExternalLink, 
  Eye, 
  Shield, 
  GraduationCap, 
  Clock, 
  CheckCircle2 
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface AdminUsersListProps {
  users: AdminUserSummary[];
  onSelectUser: (user: AdminUserSummary) => void;
  onImpersonateUser: (user: AdminUserSummary) => void;
}

export const AdminUsersList: React.FC<AdminUsersListProps> = ({
  users,
  onSelectUser,
  onImpersonateUser
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'student'>('all');
  const [sortField, setSortField] = useState<'name' | 'lastActivity' | 'tasksCreated'>('lastActivity');
  const [sortAsc, setSortAsc] = useState(false);

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase());

    if (roleFilter === 'all') return matchesSearch;
    return u.role === roleFilter && matchesSearch;
  }).sort((a, b) => {
    let valA = a[sortField];
    let valB = b[sortField];

    if (valA < valB) return sortAsc ? -1 : 1;
    if (valA > valB) return sortAsc ? 1 : -1;
    return 0;
  });

  const toggleSort = (field: 'name' | 'lastActivity' | 'tasksCreated') => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Control Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            placeholder="Search registered accounts by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-slate-950 border-slate-800 text-xs text-white"
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            {(['all', 'student', 'admin'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRoleFilter(r)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition-all ${
                  roleFilter === r
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          <span className="text-xs font-mono text-slate-400">
            Showing {filteredUsers.length} of {users.length}
          </span>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-slate-900/80 rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
        <Table>
          <TableHeader className="bg-slate-950/80 border-b border-slate-800">
            <TableRow>
              <TableHead className="text-slate-300 font-bold text-xs">
                <button onClick={() => toggleSort('name')} className="flex items-center gap-1">
                  User Account <ArrowUpDown className="w-3 h-3 text-slate-500" />
                </button>
              </TableHead>
              <TableHead className="text-slate-300 font-bold text-xs">Role</TableHead>
              <TableHead className="text-slate-300 font-bold text-xs">
                <button onClick={() => toggleSort('lastActivity')} className="flex items-center gap-1">
                  Last Active <ArrowUpDown className="w-3 h-3 text-slate-500" />
                </button>
              </TableHead>
              <TableHead className="text-slate-300 font-bold text-xs">
                <button onClick={() => toggleSort('tasksCreated')} className="flex items-center gap-1">
                  Tasks (Done) <ArrowUpDown className="w-3 h-3 text-slate-500" />
                </button>
              </TableHead>
              <TableHead className="text-slate-300 font-bold text-xs">Study Hours</TableHead>
              <TableHead className="text-slate-300 font-bold text-xs text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-slate-800/60 text-xs">
            {filteredUsers.map((user) => (
              <TableRow key={user.id} className="hover:bg-slate-800/50 transition-colors">
                <TableCell className="font-semibold text-white">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-white">{user.name}</span>
                    <span className="text-[11px] font-mono text-slate-400">{user.email}</span>
                  </div>
                </TableCell>

                <TableCell>
                  {user.role === 'admin' ? (
                    <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/40 gap-1">
                      <Shield className="w-3 h-3 text-purple-400" />
                      App Owner
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-slate-300 border-slate-700 bg-slate-950">
                      Student
                    </Badge>
                  )}
                </TableCell>

                <TableCell className="text-slate-300 font-mono">
                  {new Date(user.lastActivity).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </TableCell>

                <TableCell className="font-mono text-slate-200">
                  {user.tasksCreated} ({user.tasksCompleted} done)
                </TableCell>

                <TableCell className="font-mono text-indigo-300 font-bold">
                  {user.studyHours} hrs
                </TableCell>

                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onSelectUser(user)}
                      className="border-slate-800 bg-slate-950 hover:bg-slate-800 text-slate-300 text-xs gap-1 h-8"
                    >
                      <Eye className="w-3.5 h-3.5 text-indigo-400" />
                      Inspect
                    </Button>

                    <Button
                      size="sm"
                      onClick={() => onImpersonateUser(user)}
                      className="bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs gap-1 h-8"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      View as User
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
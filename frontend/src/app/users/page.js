'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  Search, 
  Shield, 
  Trash2, 
  UserPlus,
  Crown,
  ShieldCheck,
} from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function Users() {
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, [search, roleFilter, page]);

  const fetchUsers = async () => {
    try {
      const params = { page, limit: 20 };
      if (search) params.search = search;
      if (roleFilter) params.role = roleFilter;

      const data = await api.users.getAll(params);
      setUsers(data.users);
      setPagination(data.pagination);
    } catch (error) {
      toast.error('Fehler beim Laden der Benutzer');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRole = async (id, currentRole) => {
    const newRole = currentRole === 'ADMIN' ? 'MODERATOR' : 'ADMIN';
    if (!confirm(`Rolle wirklich zu ${newRole} ändern?`)) return;

    try {
      await api.users.updateRole(id, { role: newRole });
      toast.success('Rolle aktualisiert');
      fetchUsers();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleDelete = async (id, username) => {
    if (!confirm(`${username} wirklich löschen?`)) return;

    try {
      await api.users.delete(id);
      toast.success('Benutzer gelöscht');
      fetchUsers();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const getRoleIcon = (role) => {
    return role === 'ADMIN' ? Crown : ShieldCheck;
  };

  const getRoleColor = (role) => {
    return role === 'ADMIN' ? 'text-kyro-purple' : 'text-kyro-blue';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-kyro-purple text-2xl">Laden...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">Benutzer</h1>
          <p className="text-[#bcbcbc]">Verwalte alle Benutzer</p>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-card p-6 mb-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#bcbcbc] w-5 h-5" />
              <input
                type="text"
                placeholder="Suche..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="neon-input w-full pl-10"
              />
            </div>
          </div>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="neon-input min-w-[150px]"
          >
            <option value="">Alle Rollen</option>
            <option value="ADMIN">Admin</option>
            <option value="MODERATOR">Moderator</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="glass-card p-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-4 px-4">Benutzername</th>
                <th className="text-left py-4 px-4">E-Mail</th>
                <th className="text-left py-4 px-4">Rolle</th>
                <th className="text-left py-4 px-4">2FA</th>
                <th className="text-left py-4 px-4">Lizenzen</th>
                <th className="text-left py-4 px-4">Letzter Login</th>
                <th className="text-left py-4 px-4">Aktionen</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => {
                const RoleIcon = getRoleIcon(user.role);
                return (
                  <tr key={user.id} className="border-b border-white/5 hover:bg-white/5">
                    <td className="py-4 px-4 font-bold">{user.username}</td>
                    <td className="py-4 px-4 text-[#bcbcbc]">{user.email}</td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <RoleIcon className={`w-4 h-4 ${getRoleColor(user.role)}`} />
                        <span className={getRoleColor(user.role)}>{user.role}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`px-3 py-1 rounded-full text-sm ${
                        user.twoFactorEnabled 
                          ? 'bg-green-500/20 text-green-500' 
                          : 'bg-gray-500/20 text-gray-500'
                      }`}>
                        {user.twoFactorEnabled ? 'Aktiv' : 'Inaktiv'}
                      </span>
                    </td>
                    <td className="py-4 px-4">{user._count.createdLicenses}</td>
                    <td className="py-4 px-4 text-[#bcbcbc]">
                      {user.lastLogin 
                        ? new Date(user.lastLogin).toLocaleDateString('de-DE')
                        : 'Niemals'
                      }
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleUpdateRole(user.id, user.role)}
                          className="p-2 hover:bg-kyro-purple/20 rounded-lg transition-colors"
                          title="Rolle ändern"
                        >
                          <Shield className="w-4 h-4 text-kyro-purple" />
                        </button>
                        <button
                          onClick={() => router.push(`/users/${user.id}`)}
                          className="p-2 hover:bg-kyro-purple/20 rounded-lg transition-colors"
                          title="Details"
                        >
                          <Search className="w-4 h-4 text-kyro-purple" />
                        </button>
                        <button
                          onClick={() => handleDelete(user.id, user.username)}
                          className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
                          title="Löschen"
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination && pagination.pages > 1 && (
          <div className="flex justify-center gap-2 mt-6">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-50"
            >
              Zurück
            </button>
            <span className="px-4 py-2">
              Seite {page} von {pagination.pages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
              disabled={page === pagination.pages}
              className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-50"
            >
              Weiter
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

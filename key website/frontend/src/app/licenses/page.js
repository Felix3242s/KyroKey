'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  Search, 
  Filter, 
  Download, 
  Trash2, 
  Lock, 
  Unlock,
  Clock,
  Plus,
  RefreshCw,
} from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function Licenses() {
  const router = useRouter();
  const [licenses, setLicenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  useEffect(() => {
    fetchLicenses();
  }, [search, statusFilter, page]);

  const fetchLicenses = async () => {
    try {
      const params = { page, limit: 20 };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;

      const data = await api.licenses.getAll(params);
      setLicenses(data.licenses);
      setPagination(data.pagination);
    } catch (error) {
      toast.error('Fehler beim Laden der Lizenzen');
    } finally {
      setLoading(false);
    }
  };

  const handleBlock = async (id, key) => {
    if (!confirm(`Möchtest du ${key} wirklich sperren?`)) return;

    try {
      await api.licenses.block(id, { reason: 'Manual block' });
      toast.success('Lizenz gesperrt');
      fetchLicenses();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleUnblock = async (id) => {
    try {
      await api.licenses.unblock(id);
      toast.success('Lizenz entsperrt');
      fetchLicenses();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleDelete = async (id, key) => {
    if (!confirm(`Möchtest du ${key} wirklich löschen?`)) return;

    try {
      await api.licenses.delete(id);
      toast.success('Lizenz gelöscht');
      fetchLicenses();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleExport = async (format) => {
    try {
      const response = await api.licenses.export(format, statusFilter);
      const blob = new Blob([response], { 
        type: format === 'csv' ? 'text/csv' : 'text/plain' 
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `licenses.${format}`;
      a.click();
      toast.success(`Export als ${format.toUpperCase()} erfolgreich`);
    } catch (error) {
      toast.error('Export fehlgeschlagen');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-500/20 text-green-500';
      case 'BLOCKED': return 'bg-red-500/20 text-red-500';
      case 'EXPIRED': return 'bg-yellow-500/20 text-yellow-500';
      case 'PENDING': return 'bg-gray-500/20 text-gray-500';
      default: return 'bg-gray-500/20 text-gray-500';
    }
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
          <h1 className="text-4xl font-bold mb-2">Lizenzen</h1>
          <p className="text-[#bcbcbc]">Verwalte alle deine Lizenzen</p>
        </div>
        <button
          onClick={() => router.push('/licenses/generate')}
          className="neon-button flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Neue Lizenz
        </button>
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
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="neon-input min-w-[150px]"
          >
            <option value="">Alle Status</option>
            <option value="ACTIVE">Aktiv</option>
            <option value="PENDING">Ausstehend</option>
            <option value="EXPIRED">Abgelaufen</option>
            <option value="BLOCKED">Gesperrt</option>
          </select>

          <button
            onClick={() => handleExport('csv')}
            className="neon-button flex items-center gap-2"
          >
            <Download className="w-5 h-5" />
            CSV Export
          </button>

          <button
            onClick={() => handleExport('txt')}
            className="neon-button flex items-center gap-2"
          >
            <Download className="w-5 h-5" />
            TXT Export
          </button>
        </div>
      </div>

      {/* Licenses Table */}
      <div className="glass-card p-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-4 px-4">Key</th>
                <th className="text-left py-4 px-4">Dauer</th>
                <th className="text-left py-4 px-4">Status</th>
                <th className="text-left py-4 px-4">Ablaufdatum</th>
                <th className="text-left py-4 px-4">HWID</th>
                <th className="text-left py-4 px-4">Erstellt von</th>
                <th className="text-left py-4 px-4">Aktionen</th>
              </tr>
            </thead>
            <tbody>
              {licenses.map((license) => (
                <tr key={license.id} className="border-b border-white/5 hover:bg-white/5">
                  <td className="py-4 px-4 font-mono text-kyro-purple">{license.key}</td>
                  <td className="py-4 px-4">{license.duration}</td>
                  <td className="py-4 px-4">
                    <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(license.status)}`}>
                      {license.status}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    {license.expiresAt 
                      ? new Date(license.expiresAt).toLocaleDateString('de-DE')
                      : 'Lifetime'
                    }
                  </td>
                  <td className="py-4 px-4 font-mono text-sm">
                    {license.hwid ? `${license.hwid.substring(0, 16)}...` : 'N/A'}
                  </td>
                  <td className="py-4 px-4">{license.createdBy?.username}</td>
                  <td className="py-4 px-4">
                    <div className="flex gap-2">
                      {license.status === 'BLOCKED' ? (
                        <button
                          onClick={() => handleUnblock(license.id)}
                          className="p-2 hover:bg-green-500/20 rounded-lg transition-colors"
                          title="Entsperren"
                        >
                          <Unlock className="w-4 h-4 text-green-500" />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleBlock(license.id, license.key)}
                          className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
                          title="Sperren"
                        >
                          <Lock className="w-4 h-4 text-red-500" />
                        </button>
                      )}
                      <button
                        onClick={() => router.push(`/licenses/${license.id}`)}
                        className="p-2 hover:bg-kyro-purple/20 rounded-lg transition-colors"
                        title="Details"
                      >
                        <Clock className="w-4 h-4 text-kyro-purple" />
                      </button>
                      <button
                        onClick={() => handleDelete(license.id, license.key)}
                        className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
                        title="Löschen"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
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

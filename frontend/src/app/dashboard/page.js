'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  Key, 
  Clock, 
  Shield, 
  AlertTriangle, 
  Users, 
  TrendingUp,
  Activity,
  Download,
  Search,
  Filter,
} from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function Dashboard() {
  const router = useRouter();
  const [stats, setStats] = useState(null);
  const [recentLicenses, setRecentLicenses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    fetchDashboardData();
  }, [router]);

  const fetchDashboardData = async () => {
    try {
      const data = await api.dashboard.getStats();
      setStats(data.stats);
      setRecentLicenses(data.recentLicenses);
    } catch (error) {
      toast.error('Fehler beim Laden der Daten');
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon: Icon, color }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <span className="text-[#bcbcbc]">{title}</span>
        <Icon className={`w-6 h-6 ${color}`} />
      </div>
      <div className="text-3xl font-bold">{value}</div>
    </motion.div>
  );

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
          <h1 className="text-4xl font-bold mb-2">Dashboard</h1>
          <p className="text-[#bcbcbc]">Übersicht deiner Lizenzen</p>
        </div>
        <button
          onClick={() => router.push('/licenses/generate')}
          className="neon-button flex items-center gap-2"
        >
          <Key className="w-5 h-5" />
          Neue Lizenz
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard 
          title="Aktive Keys" 
          value={stats?.activeLicenses || 0} 
          icon={Key} 
          color="text-kyro-purple" 
        />
        <StatCard 
          title="Lifetime" 
          value={stats?.lifetimeLicenses || 0} 
          icon={Clock} 
          color="text-kyro-blue" 
        />
        <StatCard 
          title="Abgelaufen" 
          value={stats?.expiredLicenses || 0} 
          icon={AlertTriangle} 
          color="text-red-500" 
        />
        <StatCard 
          title="Gesperrt" 
          value={stats?.blockedLicenses || 0} 
          icon={Shield} 
          color="text-yellow-500" 
        />
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard 
          title="Neue Aktivierungen (Heute)" 
          value={stats?.newActivationsToday || 0} 
          icon={Activity} 
          color="text-green-500" 
        />
        <StatCard 
          title="Neue Aktivierungen (Woche)" 
          value={stats?.newActivationsWeek || 0} 
          icon={TrendingUp} 
          color="text-green-500" 
        />
        <StatCard 
          title="Gesamt Benutzer" 
          value={stats?.totalUsers || 0} 
          icon={Users} 
          color="text-kyro-purple" 
        />
      </div>

      {/* Recent Licenses */}
      <div className="glass-card p-6 mb-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Neueste Lizenzen</h2>
          <button
            onClick={() => router.push('/licenses')}
            className="text-kyro-purple hover:underline flex items-center gap-2"
          >
            Alle anzeigen
          </button>
        </div>

        <div className="space-y-4">
          {recentLicenses.map((license) => (
            <div
              key={license.id}
              className="flex justify-between items-center p-4 bg-[#151515] rounded-xl"
            >
              <div>
                <div className="font-mono text-kyro-purple mb-1">{license.key}</div>
                <div className="text-sm text-[#bcbcbc]">
                  {license.duration} • Erstellt von {license.createdBy?.username}
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span
                  className={`px-3 py-1 rounded-full text-sm ${
                    license.status === 'ACTIVE'
                      ? 'bg-green-500/20 text-green-500'
                      : license.status === 'BLOCKED'
                      ? 'bg-red-500/20 text-red-500'
                      : license.status === 'EXPIRED'
                      ? 'bg-yellow-500/20 text-yellow-500'
                      : 'bg-gray-500/20 text-gray-500'
                  }`}
                >
                  {license.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <button
          onClick={() => router.push('/licenses')}
          className="glass-card p-6 text-left hover:border-kyro-purple transition-colors"
        >
          <Key className="w-8 h-8 text-kyro-purple mb-4" />
          <h3 className="text-xl font-bold mb-2">Lizenzen verwalten</h3>
          <p className="text-[#bcbcbc]">Alle Lizenzen anzeigen und verwalten</p>
        </button>

        <button
          onClick={() => router.push('/users')}
          className="glass-card p-6 text-left hover:border-kyro-purple transition-colors"
        >
          <Users className="w-8 h-8 text-kyro-blue mb-4" />
          <h3 className="text-xl font-bold mb-2">Benutzer verwalten</h3>
          <p className="text-[#bcbcbc]">Benutzer und Rollen verwalten</p>
        </button>

        <button
          onClick={() => router.push('/settings')}
          className="glass-card p-6 text-left hover:border-kyro-purple transition-colors"
        >
          <Shield className="w-8 h-8 text-kyro-purple mb-4" />
          <h3 className="text-xl font-bold mb-2">Einstellungen</h3>
          <p className="text-[#bcbcbc]">2FA und Sicherheitseinstellungen</p>
        </button>
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Shield, Lock, Key, LogOut, User } from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function Settings() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [show2FA, setShow2FA] = useState(false);
  const [qrCode, setQrCode] = useState(null);
  const [twoFactorSecret, setTwoFactorSecret] = useState('');
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    twoFactorToken: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  const handleEnable2FA = async () => {
    try {
      const response = await api.auth.enable2FA();
      setQrCode(response.qrCode);
      setTwoFactorSecret(response.secret);
      setShow2FA(true);
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleVerify2FA = async () => {
    try {
      await api.auth.verify2FA({ token: formData.twoFactorToken });
      toast.success('2FA erfolgreich aktiviert');
      setShow2FA(false);
      setQrCode(null);
      setFormData({ ...formData, twoFactorToken: '' });
      
      // Update user data
      const updatedUser = { ...user, twoFactorEnabled: true };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleDisable2FA = async () => {
    try {
      await api.auth.disable2FA({ token: formData.twoFactorToken });
      toast.success('2FA erfolgreich deaktiviert');
      setFormData({ ...formData, twoFactorToken: '' });
      
      const updatedUser = { ...user, twoFactorEnabled: false };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();

    if (formData.newPassword !== formData.confirmPassword) {
      toast.error('Passwörter stimmen nicht überein');
      return;
    }

    if (formData.newPassword.length < 8) {
      toast.error('Passwort muss mindestens 8 Zeichen lang sein');
      return;
    }

    setLoading(true);

    try {
      await api.auth.changePassword({
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      });
      toast.success('Passwort erfolgreich geändert');
      setFormData({ ...formData, currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Einstellungen</h1>
        <p className="text-[#bcbcbc]">Verwalte dein Konto und Sicherheit</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* User Info */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-full bg-kyro-purple/20 flex items-center justify-center">
              <User className="w-8 h-8 text-kyro-purple" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">{user?.username}</h2>
              <p className="text-[#bcbcbc]">{user?.email}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-[#151515] rounded-xl">
              <span className="text-[#bcbcbc]">Rolle</span>
              <span className="font-bold text-kyro-purple">{user?.role}</span>
            </div>

            <div className="flex justify-between items-center p-4 bg-[#151515] rounded-xl">
              <span className="text-[#bcbcbc]">2FA Status</span>
              <span className={`font-bold ${user?.twoFactorEnabled ? 'text-green-500' : 'text-yellow-500'}`}>
                {user?.twoFactorEnabled ? 'Aktiviert' : 'Deaktiviert'}
              </span>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full mt-6 py-3 rounded-xl bg-red-500/20 text-red-500 hover:bg-red-500/30 transition-colors flex items-center justify-center gap-2"
          >
            <LogOut className="w-5 h-5" />
            Ausloggen
          </button>
        </div>

        {/* Change Password */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-3 mb-6">
            <Lock className="w-6 h-6 text-kyro-purple" />
            <h2 className="text-2xl font-bold">Passwort ändern</h2>
          </div>

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block mb-2 text-[#bcbcbc]">Aktuelles Passwort</label>
              <input
                type="password"
                value={formData.currentPassword}
                onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                className="neon-input w-full"
                required
              />
            </div>

            <div>
              <label className="block mb-2 text-[#bcbcbc]">Neues Passwort</label>
              <input
                type="password"
                value={formData.newPassword}
                onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                className="neon-input w-full"
                required
                minLength={8}
              />
            </div>

            <div>
              <label className="block mb-2 text-[#bcbcbc]">Passwort bestätigen</label>
              <input
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                className="neon-input w-full"
                required
                minLength={8}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="neon-button w-full disabled:opacity-50"
            >
              {loading ? 'Laden...' : 'Passwort ändern'}
            </button>
          </form>
        </div>

        {/* 2FA Settings */}
        <div className="glass-card p-6 lg:col-span-2">
          <div className="flex items-center gap-3 mb-6">
            <Shield className="w-6 h-6 text-kyro-purple" />
            <h2 className="text-2xl font-bold">Zwei-Faktor-Authentifizierung</h2>
          </div>

          {!show2FA ? (
            <div className="space-y-4">
              {user?.twoFactorEnabled ? (
                <div>
                  <p className="text-[#bcbcbc] mb-4">
                    2FA ist aktiviert. Um es zu deaktivieren, gib deinen 2FA Token ein.
                  </p>
                  <div className="flex gap-4">
                    <input
                      type="text"
                      placeholder="2FA Token"
                      value={formData.twoFactorToken}
                      onChange={(e) => setFormData({ ...formData, twoFactorToken: e.target.value })}
                      className="neon-input flex-1"
                    />
                    <button
                      onClick={handleDisable2FA}
                      className="neon-button"
                    >
                      Deaktivieren
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={handleEnable2FA}
                  className="neon-button flex items-center gap-2"
                >
                  <Key className="w-5 h-5" />
                  2FA aktivieren
                </button>
              )}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="text-center">
                <p className="text-[#bcbcbc] mb-4">
                  Scan den QR Code mit deiner Authenticator App
                </p>
                {qrCode && (
                  <div className="inline-block p-4 bg-white rounded-xl">
                    <img src={qrCode} alt="QR Code" className="w-48 h-48" />
                  </div>
                )}
                <p className="text-sm text-[#bcbcbc] mt-4">
                  Oder gib diesen Code manuell ein: <span className="font-mono text-kyro-purple">{twoFactorSecret}</span>
                </p>
              </div>

              <div className="flex gap-4">
                <input
                  type="text"
                  placeholder="2FA Token eingeben"
                  value={formData.twoFactorToken}
                  onChange={(e) => setFormData({ ...formData, twoFactorToken: e.target.value })}
                  className="neon-input flex-1"
                />
                <button
                  onClick={handleVerify2FA}
                  className="neon-button"
                >
                  Bestätigen
                </button>
              </div>

              <button
                onClick={() => {
                  setShow2FA(false);
                  setQrCode(null);
                  setFormData({ ...formData, twoFactorToken: '' });
                }}
                className="text-[#bcbcbc] hover:text-white"
              >
                Abbrechen
              </button>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function Login() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    twoFactorToken: '',
  });
  const [requiresTwoFactor, setRequiresTwoFactor] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await api.auth.login(formData);
      
      if (response.requiresTwoFactor) {
        setRequiresTwoFactor(true);
        toast.success('2FA Token erforderlich');
      } else {
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
        toast.success('Erfolgreich eingeloggt');
        router.push('/dashboard');
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="glass-card w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-kyro-purple mb-2">KYRO</h1>
          <p className="text-[#bcbcbc]">Login</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="email"
              placeholder="E-Mail"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="neon-input w-full"
              required
            />
          </div>

          <div>
            <input
              type="password"
              placeholder="Passwort"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="neon-input w-full"
              required
            />
          </div>

          {requiresTwoFactor && (
            <div>
              <input
                type="text"
                placeholder="2FA Token"
                value={formData.twoFactorToken}
                onChange={(e) => setFormData({ ...formData, twoFactorToken: e.target.value })}
                className="neon-input w-full"
                required
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="neon-button w-full disabled:opacity-50"
          >
            {loading ? 'Laden...' : 'Login'}
          </button>
        </form>

        <p className="text-center mt-6 text-[#bcbcbc]">
          Noch kein Account?{' '}
          <Link href="/register" className="text-kyro-purple hover:underline">
            Registrieren
          </Link>
        </p>
      </div>
    </div>
  );
}

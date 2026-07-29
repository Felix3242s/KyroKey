'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function Register() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwörter stimmen nicht überein');
      return;
    }

    if (formData.password.length < 8) {
      toast.error('Passwort muss mindestens 8 Zeichen lang sein');
      return;
    }

    setLoading(true);

    try {
      await api.auth.register({
        email: formData.email,
        username: formData.username,
        password: formData.password,
      });
      toast.success('Registrierung erfolgreich');
      router.push('/login');
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
          <p className="text-[#bcbcbc]">Registrieren</p>
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
              type="text"
              placeholder="Benutzername"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              className="neon-input w-full"
              required
              minLength={3}
              maxLength={20}
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
              minLength={8}
            />
          </div>

          <div>
            <input
              type="password"
              placeholder="Passwort bestätigen"
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
            {loading ? 'Laden...' : 'Registrieren'}
          </button>
        </form>

        <p className="text-center mt-6 text-[#bcbcbc]">
          Bereits ein Account?{' '}
          <Link href="/login" className="text-kyro-purple hover:underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}

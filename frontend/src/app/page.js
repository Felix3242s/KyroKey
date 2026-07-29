'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Home() {
  const router = useRouter();
  const [stats, setStats] = useState({
    activeKeys: 284,
    lifetimeKeys: 42,
    expiredKeys: 17,
    newActivations: 9,
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      router.push('/dashboard');
    }
  }, [router]);

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="flex justify-between items-center px-[70px] py-6">
        <div className="text-3xl font-bold text-kyro-purple">KYRO</div>
        <ul className="flex gap-9 list-none">
          <li className="cursor-pointer transition-colors hover:text-kyro-purple">Home</li>
          <li className="cursor-pointer transition-colors hover:text-kyro-purple">Dashboard</li>
          <li className="cursor-pointer transition-colors hover:text-kyro-purple">Keys</li>
          <li className="cursor-pointer transition-colors hover:text-kyro-purple">API</li>
          <li className="cursor-pointer transition-colors hover:text-kyro-purple">Kontakt</li>
        </ul>
        <Link href="/login">
          <button className="neon-button">Login</button>
        </Link>
      </nav>

      {/* Hero Section */}
      <section className="flex justify-between items-center px-20 py-20 min-h-[80vh]">
        <div className="max-w-[600px]">
          <h1 className="text-[64px] leading-tight mb-5">
            Modernes <span className="text-kyro-purple">KYRO</span>
            <br />
            License Panel
          </h1>
          <p className="text-[#bcbcbc] mb-9 leading-relaxed">
            Verwalte Lizenzen für deine eigene Software an einem Ort.
            Erstelle zeitlich begrenzte oder Lifetime-Lizenzen und behalte den Überblick.
          </p>
          <Link href="/login">
            <button className="neon-button">Zum Dashboard</button>
          </Link>
        </div>

        <div className="glass-card w-[420px] p-8">
          <h2 className="text-2xl font-bold mb-5">Dashboard</h2>

          <div className="flex justify-between items-center p-4 mb-4 bg-[#151515] rounded-xl">
            <span>Aktive Keys</span>
            <strong className="text-kyro-purple">{stats.activeKeys}</strong>
          </div>

          <div className="flex justify-between items-center p-4 mb-4 bg-[#151515] rounded-xl">
            <span>Lifetime</span>
            <strong className="text-kyro-blue">{stats.lifetimeKeys}</strong>
          </div>

          <div className="flex justify-between items-center p-4 mb-4 bg-[#151515] rounded-xl">
            <span>Abgelaufen</span>
            <strong className="text-red-500">{stats.expiredKeys}</strong>
          </div>

          <div className="flex justify-between items-center p-4 bg-[#151515] rounded-xl">
            <span>Neue Aktivierungen</span>
            <strong className="text-green-500">{stats.newActivations}</strong>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 text-center text-[#777]">
        © 2026 KYRO License Panel
      </footer>
    </div>
  );
}

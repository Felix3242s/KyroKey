'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Home, Key, Users, Settings, LogOut, Menu, X } from 'lucide-react';

export default function Navbar() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  const navItems = [
    { icon: Home, label: 'Dashboard', path: '/dashboard' },
    { icon: Key, label: 'Lizenzen', path: '/licenses' },
    { icon: Users, label: 'Benutzer', path: '/users' },
    { icon: Settings, label: 'Einstellungen', path: '/settings' },
  ];

  return (
    <nav className="flex justify-between items-center px-[70px] py-6">
      <div 
        className="text-3xl font-bold text-kyro-purple cursor-pointer"
        onClick={() => router.push('/dashboard')}
      >
        KYRO
      </div>

      {/* Desktop Menu */}
      <ul className="hidden md:flex gap-9 list-none">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <li
              key={item.path}
              onClick={() => router.push(item.path)}
              className="cursor-pointer transition-colors hover:text-kyro-purple flex items-center gap-2"
            >
              <Icon className="w-4 h-4" />
              {item.label}
            </li>
          );
        })}
      </ul>

      <div className="hidden md:flex items-center gap-4">
        <span className="text-[#bcbcbc]">{user?.username}</span>
        <button
          onClick={handleLogout}
          className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
          title="Ausloggen"
        >
          <LogOut className="w-5 h-5 text-red-500" />
        </button>
      </div>

      {/* Mobile Menu Button */}
      <button
        className="md:hidden"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
      >
        {mobileMenuOpen ? (
          <X className="w-6 h-6 text-white" />
        ) : (
          <Menu className="w-6 h-6 text-white" />
        )}
      </button>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-20 left-0 right-0 glass-card mx-4 p-4">
          <ul className="flex flex-col gap-4">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <li
                  key={item.path}
                  onClick={() => {
                    router.push(item.path);
                    setMobileMenuOpen(false);
                  }}
                  className="cursor-pointer transition-colors hover:text-kyro-purple flex items-center gap-2 p-2"
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </li>
              );
            })}
            <li
              onClick={handleLogout}
              className="cursor-pointer transition-colors hover:text-red-500 flex items-center gap-2 p-2 text-red-500"
            >
              <LogOut className="w-4 h-4" />
              Ausloggen
            </li>
          </ul>
        </div>
      )}
    </nav>
  );
}

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Key, Copy, Check } from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function GenerateLicense() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    duration: 'DAY_30',
    count: 1,
    note: '',
  });
  const [generatedKeys, setGeneratedKeys] = useState([]);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await api.licenses.generate(formData);
      setGeneratedKeys(response.licenses);
      toast.success(`${response.licenses.length} Lizenzen generiert`);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('In Zwischenablage kopiert');
    setTimeout(() => setCopied(false), 2000);
  };

  const copyAllKeys = () => {
    const allKeys = generatedKeys.map(l => l.key).join('\n');
    copyToClipboard(allKeys);
  };

  const durations = [
    { value: 'DAY_1', label: '1 Tag' },
    { value: 'DAY_3', label: '3 Tage' },
    { value: 'DAY_7', label: '7 Tage' },
    { value: 'DAY_30', label: '30 Tage' },
    { value: 'DAY_90', label: '90 Tage' },
    { value: 'LIFETIME', label: 'Lifetime' },
  ];

  return (
    <div className="min-h-screen p-8">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => router.push('/licenses')}
          className="text-[#bcbcbc] hover:text-white mb-4"
        >
          ← Zurück zu Lizenzen
        </button>
        <h1 className="text-4xl font-bold mb-2">Lizenz generieren</h1>
        <p className="text-[#bcbcbc]">Erstelle neue Lizenzschlüssel</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Form */}
        <div className="glass-card p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block mb-2 text-[#bcbcbc]">Dauer</label>
              <select
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                className="neon-input w-full"
              >
                {durations.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block mb-2 text-[#bcbcbc]">Anzahl</label>
              <input
                type="number"
                min="1"
                max="100"
                value={formData.count}
                onChange={(e) => setFormData({ ...formData, count: parseInt(e.target.value) })}
                className="neon-input w-full"
              />
            </div>

            <div>
              <label className="block mb-2 text-[#bcbcbc]">Notiz (optional)</label>
              <textarea
                value={formData.note}
                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                className="neon-input w-full h-24 resize-none"
                placeholder="Interne Notiz für diese Lizenzen..."
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="neon-button w-full flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Key className="w-5 h-5" />
              {loading ? 'Generieren...' : 'Generieren'}
            </button>
          </form>
        </div>

        {/* Generated Keys */}
        {generatedKeys.length > 0 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass-card p-8"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Generierte Keys</h2>
              <button
                onClick={copyAllKeys}
                className="neon-button flex items-center gap-2 text-sm"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                Alle kopieren
              </button>
            </div>

            <div className="space-y-3 max-h-[400px] overflow-y-auto scrollbar-custom">
              {generatedKeys.map((license) => (
                <div
                  key={license.id}
                  className="flex justify-between items-center p-4 bg-[#151515] rounded-xl group"
                >
                  <span className="font-mono text-kyro-purple">{license.key}</span>
                  <button
                    onClick={() => copyToClipboard(license.key)}
                    className="p-2 hover:bg-white/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={() => {
                setGeneratedKeys([]);
                setFormData({ ...formData, count: 1 });
              }}
              className="w-full mt-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
            >
              Weitere generieren
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}

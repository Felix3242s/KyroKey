/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        kyro: {
          purple: '#8d54ff',
          blue: '#2f7cff',
          dark: '#0d0d0d',
          darker: '#080808',
          card: 'rgba(255, 255, 255, 0.06)',
          cardBorder: 'rgba(255, 255, 255, 0.08)',
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'neon-purple': 'radial-gradient(circle, rgba(141, 84, 255, 0.35) 0%, transparent 70%)',
        'neon-blue': 'radial-gradient(circle, rgba(47, 124, 255, 0.25) 0%, transparent 70%)',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px #8d54ff, 0 0 10px #8d54ff' },
          '100%': { boxShadow: '0 0 20px #8d54ff, 0 0 30px #8d54ff' },
        },
      },
    },
  },
  plugins: [],
}

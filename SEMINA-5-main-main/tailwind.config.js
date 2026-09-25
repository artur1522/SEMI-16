/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx,js,jsx}'],
  theme: {
    extend: {
      colors: {
        background: '#FAF9FF',
        sidebar: '#0F172A',
        primary: '#2563EB',
        success: '#16A34A',
        warning: '#F59E0B',
        danger: '#DC2626',
        textPrimary: '#1E293B',
        textSecondary: '#64748B',
        border: '#E2E8F0',
        accentFrom: '#7C3AED',
        accentTo: '#EC4899',
        darkBackground: '#0F0B24',
        darkCard: '#1A1433',
        darkBorder: '#31214F',
        darkTextPrimary: '#E5E7EB',
        darkTextSecondary: '#A8B3CF',
        darkPrimary: '#3B82F6',
        darkSuccess: '#22C55E',
        darkWarning: '#FBBF24',
        darkDanger: '#F87171',
        darkAccentFrom: '#8B5CF6',
        darkAccentTo: '#EC4899'
      }
    }
  },
  plugins: []
}

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx,js,jsx}'],
  theme: {
    extend: {
      colors: {
        background: '#F8FAFC',
        sidebar: '#0F172A',
        primary: '#2563EB',
        success: '#16A34A',
        warning: '#F59E0B',
        danger: '#DC2626',
        textPrimary: '#1E293B',
        textSecondary: '#64748B',
        border: '#E2E8F0',
        darkBackground: '#0B1220',
        darkCard: '#111827',
        darkBorder: '#1E293B',
        darkTextPrimary: '#E5E7EB',
        darkTextSecondary: '#94A3B8',
        darkPrimary: '#3B82F6',
        darkSuccess: '#22C55E',
        darkWarning: '#FBBF24',
        darkDanger: '#F87171'
      }
    }
  },
  plugins: []
}

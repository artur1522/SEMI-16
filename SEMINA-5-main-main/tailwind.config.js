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
        info: '#4F46E5',
        textPrimary: '#1E293B',
        textSecondary: '#64748B',
        border: '#E2E8F0',
        surface: '#FFFFFF',
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
        darkInfo: '#818CF8',
        darkSurface: '#1A1433',
        darkAccentFrom: '#8B5CF6',
        darkAccentTo: '#EC4899'
      },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '1rem' }],
        xs: ['0.75rem', { lineHeight: '1rem' }],
        sm: ['0.875rem', { lineHeight: '1.25rem' }],
        base: ['1rem', { lineHeight: '1.5rem' }],
        lg: ['1.125rem', { lineHeight: '1.75rem' }],
        xl: ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }]
      },
      borderRadius: {
        card: '1rem',
        control: '0.75rem'
      },
      boxShadow: {
        card: '0 1px 2px rgba(15,23,42,0.04), 0 8px 24px rgba(15,23,42,0.05)',
        'card-hover':
          '0 0 0 1px rgba(124,58,237,0.16), 0 12px 28px rgba(15,23,42,0.10)',
        elevated: '0 18px 45px rgba(15,23,42,0.12)',
        'dark-card': '0 1px 2px rgba(0,0,0,0.3), 0 10px 30px rgba(0,0,0,0.35)',
        'dark-card-hover':
          '0 0 0 1px rgba(139,92,246,0.35), 0 14px 32px rgba(0,0,0,0.45)'
      },
      keyframes: {
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(6px)' },
          to: { opacity: '1', transform: 'translateY(0)' }
        }
      },
      animation: {
        'fade-up': 'fade-up 260ms ease-out both'
      }
    }
  },
  plugins: []
}

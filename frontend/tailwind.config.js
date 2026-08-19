/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx}'
  ],
  theme: {
    extend: {
      colors: {
        // Brand — deep teal reads clinical and calm without being generic
        // medical blue, and leaves green/amber/red free for status.
        primary: {
          50:  '#EDF6F5',
          100: '#D6EBE9',
          200: '#AED7D5',
          300: '#7CBCBB',
          400: '#3F9A9A',
          500: '#0E7C7B',
          600: '#0B5F63',
          700: '#0A4D50',
          800: '#083C3F',
          900: '#062B2D'
        },
        // Accent — marigold. Emphasis only, never status.
        accent: {
          50:  '#FDF6EA',
          100: '#F9E7C7',
          200: '#F0CB8C',
          300: '#E3A94F',
          400: '#D48E1E',
          500: '#C97A0C',
          600: '#A66109',
          700: '#834B08'
        },
        // Neutrals biased slightly green so surfaces sit with the brand.
        ink:     '#0E1A1B',
        body:    '#31474A',
        muted:   '#66797B',
        line:    '#DAE5E3',
        'line-soft': '#E9F0EF',
        surface: '#FFFFFF',
        'surface-2': '#EEF4F3',
        ground:  '#F6F9F8',
        // Semantic — independent of brand
        success: { 50: '#ECFDF3', 100: '#D1FADF', 500: '#15803D', 600: '#12652F' },
        warning: { 50: '#FFFAEB', 100: '#FEF0C7', 500: '#B45309', 600: '#92400E' },
        danger:  { 50: '#FEF3F2', 100: '#FEE4E2', 500: '#A81E17', 600: '#8A1811' },
        info:    { 50: '#EFF8FF', 100: '#D1E9FF', 500: '#1B6394', 600: '#155078' }
      },
      borderRadius: {
        DEFAULT: '8px',
        control: '8px',
        card: '12px',
        sheet: '16px'
      },
      boxShadow: {
        rest:    '0 1px 2px rgba(14,26,27,.04), 0 1px 3px rgba(14,26,27,.05)',
        raised:  '0 4px 12px -2px rgba(14,26,27,.08), 0 12px 28px -12px rgba(14,26,27,.16)',
        lifted:  '0 8px 20px -6px rgba(14,26,27,.10), 0 24px 48px -20px rgba(14,26,27,.22)',
        sheet:   '0 24px 48px -12px rgba(14,26,27,.35)',
        // Inset hairline that reads as a crisp edge rather than a border.
        ring:    'inset 0 0 0 1px rgba(14,26,27,.06)',
        glow:    '0 0 0 1px rgba(79,176,175,.25), 0 8px 32px -8px rgba(11,95,99,.45)',
        'glow-accent': '0 0 0 1px rgba(201,122,12,.3), 0 8px 32px -8px rgba(201,122,12,.35)'
      },
      fontSize: {
        // 16px floor for body — prevents iOS zoom-on-focus and serves older eyes.
        caption: ['0.8125rem', { lineHeight: '1.5' }],
        small:   ['0.875rem',  { lineHeight: '1.55' }],
        base:    ['1rem',      { lineHeight: '1.6' }],
        h3:      ['1.0625rem', { lineHeight: '1.4', fontWeight: '600' }],
        h2:      ['1.375rem',  { lineHeight: '1.3', fontWeight: '600', letterSpacing: '-0.01em' }],
        h1:      ['1.875rem',  { lineHeight: '1.2',  fontWeight: '600', letterSpacing: '-0.02em' }],
        // Display sizes carry the landing page — real scale contrast is
        // most of what separates a designed page from a template.
        d1:      ['clamp(2.5rem, 6.5vw, 4.5rem)',  { lineHeight: '1.02', fontWeight: '680', letterSpacing: '-0.035em' }],
        d2:      ['clamp(2rem, 4.5vw, 3.25rem)',   { lineHeight: '1.08', fontWeight: '660', letterSpacing: '-0.03em' }],
        d3:      ['clamp(1.5rem, 3vw, 2.25rem)',   { lineHeight: '1.15', fontWeight: '640', letterSpacing: '-0.02em' }]
      },
      minHeight: { touch: '44px' },
      minWidth:  { touch: '44px' },
      keyframes: {
        'fade-in':   { from: { opacity: '0' }, to: { opacity: '1' } },
        'rise-in':   { from: { opacity: '0', transform: 'translateY(8px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        'sheet-up':  { from: { transform: 'translateY(100%)' }, to: { transform: 'translateY(0)' } },
        'toast-in':  { from: { opacity: '0', transform: 'translateY(-12px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        shimmer:     { '100%': { transform: 'translateX(100%)' } },
        'reveal-up': { from: { opacity: '0', transform: 'translateY(20px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        float:       { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-8px)' } },
        'pulse-ring':{ '0%': { transform: 'scale(.9)', opacity: '.7' }, '100%': { transform: 'scale(1.6)', opacity: '0' } }
      },
      animation: {
        'fade-in':  'fade-in 120ms ease-out',
        'rise-in':  'rise-in 150ms ease-out',
        'sheet-up': 'sheet-up 200ms ease-out',
        'toast-in': 'toast-in 180ms ease-out',
        'reveal-up': 'reveal-up 620ms cubic-bezier(.16,1,.3,1) both',
        float:       'float 6s ease-in-out infinite',
        'pulse-ring':'pulse-ring 2.4s ease-out infinite'
      }
    }
  },
  plugins: []
}

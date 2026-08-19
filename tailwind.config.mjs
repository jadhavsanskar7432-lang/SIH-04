/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // Brand — dark green surface family. 900 is the exact hex already
        // used throughout Admin/Hospital (`#12281F`, theme/adminColors.js).
        // 700/800 give hover/secondary states without hardcoding hex in JSX.
        brand: {
          50: '#EEF6F1',
          200: '#BCD6C8',
          700: '#1B3A2D',
          800: '#173025',
          900: '#12281F',
        },
        // Accent — the lime highlight (`#D7FF5F`), same idea.
        accent: {
          50: '#F7FFE9',
          200: '#E8FFB0',
          300: '#D7FF5F',
        },
        // Semantic aliases onto the Tailwind palette already used
        // consistently for status colors (emerald/amber/rose/blue). Lets
        // new/updated components say `bg-success-50` instead of picking a
        // color by hand each time.
        success: {
          50: '#ECFDF5', 100: '#D1FAE5', 600: '#059669', 700: '#047857',
        },
        warning: {
          50: '#FFFBEB', 100: '#FEF3C7', 600: '#D97706', 700: '#B45309',
        },
        danger: {
          50: '#FEF2F2', 100: '#FEE2E2', 600: '#DC2626', 700: '#B91C1C',
        },
        info: {
          50: '#EFF6FF', 100: '#DBEAFE', 600: '#2563EB', 700: '#1D4ED8',
        },
      },
      boxShadow: {
        card: '0 1px 2px 0 rgb(15 23 42 / 0.04), 0 1px 3px 0 rgb(15 23 42 / 0.06)',
        popover: '0 8px 24px -4px rgb(15 23 42 / 0.12), 0 2px 8px -2px rgb(15 23 42 / 0.06)',
      },
      keyframes: {
        'fade-in': { from: { opacity: 0 }, to: { opacity: 1 } },
        'scale-in': {
          from: { opacity: 0, transform: 'scale(0.96) translateY(-2px)' },
          to: { opacity: 1, transform: 'scale(1) translateY(0)' },
        },
        'page-in': {
          '0%': { opacity: 0, transform: 'translateY(20px) scale(0.975)' },
          '55%': { opacity: 1, transform: 'translateY(-3px) scale(1.004)' },
          '100%': { opacity: 1, transform: 'translateY(0) scale(1)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        'fade-in': 'fade-in 180ms ease-out both',
        'scale-in': 'scale-in 160ms cubic-bezier(0.16, 1, 0.3, 1) both',
        'page-in': 'page-in 420ms cubic-bezier(0.16, 1, 0.3, 1) both',
        shimmer: 'shimmer 1.6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
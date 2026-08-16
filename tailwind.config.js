/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // Page background — pale warm grey, not stark white
        paper: '#F5F6F0',
        'paper-dim': '#ECEEE4',
        // Sidebar / dark panel — deep pharmacy green
        panel: '#12332A',
        'panel-soft': '#1C4536',
        // Text
        ink: '#16241C',
        'ink-soft': '#5B665F',
        'ink-faint': '#93998E',
        // Primary accent — lime (buttons, active nav, highlights)
        amber: '#CFEE5D',
        'amber-soft': '#EAF6C4',
        // Status vocabulary
        moss: '#2F8F5B',
        'moss-soft': '#DEF0E4',
        coral: '#D1453D',
        'coral-soft': '#F8DEDC',
        gold: '#E4772E',
        'gold-soft': '#FBE4D2',
        line: '#E4E7DE',
        'line-dark': 'rgba(245,246,240,0.14)',
      },
      boxShadow: {
        card: '0 1px 2px rgba(18,36,28,0.05), 0 8px 20px -10px rgba(18,36,28,0.12)',
      },
    },
  },
  plugins: [],
}
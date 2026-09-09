/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        heritage: {
          green: {
            50: '#f2f7f4',
            100: '#e1ede6',
            200: '#c5dcd0',
            300: '#9bc2b0',
            400: '#6ea38c',
            500: '#4c866f',
            600: '#386b57',
            700: '#2c5445',
            800: '#1b382b', // Core Forest Green from mockup
            900: '#132a20', // Dark Sidebar Forest Green
            950: '#0a1711',
          },
          cream: {
            50: '#ffffff',
            100: '#fdfbf7',
            200: '#fbf8f2', // Primary App Background from mockup
            300: '#f5efe4',
            400: '#ece3d2',
            500: '#dfd2bc',
            600: '#c5b499',
            700: '#9e8c72',
            800: '#756652',
            900: '#4e4335',
          },
          gold: {
            50: '#fbf8ee',
            100: '#f5edd2',
            200: '#ebd9a3',
            300: '#dfc270',
            400: '#d4af37',
            500: '#c5a059', // Elegant Muted Gold accent
            600: '#a68241',
            700: '#846332',
            800: '#6b4f2c',
            900: '#584027',
          },
          bark: {
            50: '#faf7f5',
            100: '#f3ece6',
            200: '#e5d7cb',
            300: '#d3bca9',
            400: '#be9d85',
            500: '#a68066',
            600: '#8b654e',
            700: '#6f4f3e',
            800: '#553d32',
            900: '#3e2e27',
          },
          dark: {
            bg: '#0c1511',
            card: '#14201a',
            border: '#22352b',
            hover: '#1b2d24',
            text: '#e8f0eb',
            muted: '#95ab9e'
          }
        }
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'Cambria', '"Times New Roman"', 'serif'],
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        cinzel: ['Cinzel', 'serif']
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(27, 56, 43, 0.06), 0 2px 6px -1px rgba(27, 56, 43, 0.04)',
        'soft-lg': '0 10px 30px -4px rgba(27, 56, 43, 0.08), 0 4px 12px -2px rgba(27, 56, 43, 0.04)',
        'gold': '0 0 15px rgba(197, 160, 89, 0.25)',
        'vintage': 'inset 0 0 30px rgba(111, 79, 62, 0.12), 0 8px 24px rgba(0,0,0,0.08)',
      }
    },
  },
  plugins: [],
}

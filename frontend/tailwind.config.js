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
        warm: {
          50: '#FAF8F5',   // Creamy background light
          100: '#F5ECE1',  // Sand/Beige highlight light
          200: '#EADBC8',  // Darker Beige border
          800: '#1F1D1B',  // Darker warm text for perfect legibility in light mode
          900: '#0F0E0D',  // Pitch black text for headings in light mode
        },
        darkbg: {
          base: '#121212',    // True Minimal Dark
          surface: '#1E1E1E', // Dark Card
          border: '#2C2C2C',  // Subtle Dark Border
        },
        brand: {
          50: 'var(--color-brand-50, #F7F5F0)',
          500: 'var(--color-brand-500, #8C7A6B)',
          600: 'var(--color-brand-600, #6E5D50)',
          700: 'var(--color-brand-700, #524337)',
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
      },
      boxShadow: {
        'elegant': '0 4px 20px -2px rgba(140, 122, 107, 0.08)',
        'elegant-dark': '0 4px 20px -2px rgba(0, 0, 0, 0.5)',
      }
    },
  },
  plugins: [],
}

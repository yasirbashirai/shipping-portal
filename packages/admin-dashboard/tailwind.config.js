/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#1A56DB',
        sidebar: '#1F2937',
        'sidebar-active': '#1A56DB',
        danger: '#C81E1E',
        success: '#057A55',
        warning: '#C27803',
        page: '#F9FAFB',
      },
      fontFamily: {
        sans: ['Geist Sans', 'Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

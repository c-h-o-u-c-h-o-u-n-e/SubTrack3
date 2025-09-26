/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        'sans': ['WF Visual Sans', 'system-ui', 'sans-serif'],
      },
      colors: {
        gruvbox: {
          'bg0-hard': '#1d2021',
          'bg0': '#282828',
          'bg0-soft': '#32302f',
          'bg1': '#3c3836',
          'bg2': '#504945',
          'bg3': '#665c54',
          'bg4': '#7c6f64',
          'fg0': '#fbf1c7',
          'fg1': '#ebdbb2',
          'fg2': '#d5c4a1',
          'fg3': '#bdae93',
          'fg4': '#a89984',
          'red': '#cc241d',
          'red-bright': '#fb4934',
          'green': '#98971a',
          'green-bright': '#b8bb26',
          'yellow': '#d79921',
          'yellow-bright': '#fabd2f',
          'blue': '#458588',
          'blue-bright': '#83a598',
          'purple': '#b16286',
          'purple-bright': '#d3869b',
          'aqua': '#689d6a',
          'aqua-bright': '#8ec07c',
          'orange': '#d65d0e',
          'orange-bright': '#fe8019',
        }
      }
    },
  },
  plugins: [],
};

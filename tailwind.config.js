module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    screens: {
      'sm': '744px',     // Mobile breakpoint (744+)
      'md': '1280px',    // Tablet/smaller desktop (1280+)
      'lg': '1440px',    // Desktop (1440+)
    },
    extend: {
      colors: {
        'mindaro-light': '#FAFFE7',
      },
      fontFamily: {
        bricolage: ['"Bricolage Grotesque"', 'sans-serif'],
        poppins: ['Poppins', 'sans-serif'],
      },
      fontSize: {
        'body-l': ['24px', { lineHeight: '1.4' }],
        'body-m-med': ['20px', { lineHeight: '1.4' }],
        'body-m-reg': ['20px', { lineHeight: '1.4' }],
        'body-s-med': ['16px', { lineHeight: '1.4' }],
        'body-s-reg': ['16px', { lineHeight: '1.4' }],
        'h1': ['64px', { lineHeight: '1.1' }],
        'h2': ['48px', { lineHeight: '1.1' }],
        'h3': ['40px', { lineHeight: '1.1' }],
        'h4': ['40px', { lineHeight: '1.1' }],
        'h5': ['36px', { lineHeight: '1.1' }],
        'h6': ['32px', { lineHeight: '1.1' }],
        'h7': ['24px', { lineHeight: '1.1' }],
        'h8': ['16px', { lineHeight: '1.1' }],
      },
      gap: {
        'xxl': '100px',
        'xl': '75px',
        'l': '50px',
        'm': '32px',
        's': '24px',
        'xs': '16px',
        'xxs': '12px',
        'xxxs': '8px',
      },
      margin: {
        'xxl': '100px',
        'xl': '75px',
        'l': '50px',
        'm': '32px',
        's': '24px',
        'xs': '16px',
      },
    },
  },
  plugins: [],
}

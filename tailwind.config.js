/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.{js,ts,tsx}', './components/**/*.{js,ts,tsx}', './src/**/*.{js,ts,tsx}'],

  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        gold: '#D4AF37',
        lightgray: '#F5F5F5',
      },
      fontFamily: {
        'spaceGrotesk': ['SpaceGrotesk'],
      },
    },
  },
  plugins: [
    function ({ addBase }) {
      addBase({
        // This applies the Poppins font to all Text components
        Text: {
          fontFamily: 'Poppins-Regular',
        },
      });
    },
  ],
};

/** @type {import('tailwindcss').Config} */
export default {
    content: ['./src/**/*.tsx'],
    theme: {
        extend: {},
        fontFamily: {
            sans: ['Inter var'],
        },
    },
    plugins: [require('@tailwindcss/forms')({ strategy: 'class' })],
};

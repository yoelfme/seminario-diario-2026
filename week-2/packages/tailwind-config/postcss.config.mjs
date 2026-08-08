/**
 * Shared PostCSS config for Tailwind v4. Re-exported by every frontend app
 * so the Tailwind pipeline stays identical across the monorepo.
 */
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

export default config;

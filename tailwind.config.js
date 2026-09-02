/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      // === Color tokens (mirrors Figma "Primitives" + "Color" variable collections) ===
      colors: {
        navy: {
          950: '#060E20', // color/bg/base
          900: '#0B1326', // color/bg/surface
        },
        accent: {
          primary: '#D0BCFF', // color/accent/primary
          glow: '#A078FF',    // color/accent/glow
        },
        text: {
          primary: '#DAE2FD',   // color/text/primary
          secondary: '#CBC3D7', // color/text/secondary
          onAccent: '#060E20',  // color/text/on-accent
        },
        // Approximate accent colors used by the 4 Growth insight cards.
        // TODO: confirm exact hex against the Figma file once MCP quota resets —
        // these are visual estimates from the screenshots, not sampled values.
        insight: {
          teal: '#5EEAD4',   // Consistency
          green: '#4ADE80',  // Emotional Regulation
          purple: '#D0BCFF', // Self-Control (same as accent/primary)
          muted: '#CBC3D7',  // Facing Challenges (dashed/muted style)
        },
        // TODO: also a visual estimate (used on "Delete Account" / "Delete All Data").
        danger: '#F87171',
      },
      // Hairline borders used on nearly every card/panel across the app.
      borderColor: {
        subtle: 'rgba(255,255,255,0.05)',
        muted: 'rgba(255,255,255,0.10)',
      },

      // === Spacing tokens (mirrors Figma "Spacing" collection) ===
      spacing: {
        xs: '4px',
        sm: '8px',
        md: '16px',
        lg: '24px',
        xl: '32px',
        '2xl': '40px',
        '3xl': '48px',
      },

      // === Radius tokens (mirrors Figma "Radius" collection) ===
      borderRadius: {
        sm: '8px',
        md: '16px',
        full: '9999px',
      },

      // === Typography (mirrors Figma text styles Heading/24, Body/16, Label/14) ===
      fontFamily: {
        sans: ['Manrope', 'sans-serif'],
      },
      fontSize: {
        heading: ['24px', { lineHeight: '32px', fontWeight: '700' }],
        body: ['16px', { lineHeight: '26px', fontWeight: '400' }],
        label: ['14px', { lineHeight: '20px', fontWeight: '500' }],
      },
    },
  },
  plugins: [],
};

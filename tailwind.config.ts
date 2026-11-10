import type { Config } from "tailwindcss";
import defaultTheme from "tailwindcss/defaultTheme";

const withAlpha = (variable: string) => `rgb(var(${variable}) / <alpha-value>)`;

const config: Config = {
  darkMode: "class",
  content: ["./src/app/**/*.{ts,tsx}", "./src/components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", ...defaultTheme.fontFamily.sans],
      },

      fontSize: {
        xs: ["0.8125rem", { lineHeight: "1.15rem" }],
        sm: ["0.9375rem", { lineHeight: "1.4rem" }],
        base: ["1.0625rem", { lineHeight: "1.6rem" }],
        lg: ["1.1875rem", { lineHeight: "1.75rem", letterSpacing: "-0.01em" }],
        xl: ["1.375rem", { lineHeight: "1.9rem", letterSpacing: "-0.015em" }],
        "2xl": ["1.75rem", { lineHeight: "2.2rem", letterSpacing: "-0.02em" }],
        "3xl": ["2.125rem", { lineHeight: "2.5rem", letterSpacing: "-0.025em" }],
        "4xl": ["2.625rem", { lineHeight: "3rem", letterSpacing: "-0.03em" }],
      },

      colors: {
        brand: {
          DEFAULT: withAlpha("--brand"),
          strong: withAlpha("--brand-strong"),
          fg: withAlpha("--brand-fg"),
        },
        bg: withAlpha("--bg"),
        surface: {
          DEFAULT: withAlpha("--surface"),
          muted: withAlpha("--surface-muted"),
        },
        subtle: withAlpha("--border-subtle"),
        fg: withAlpha("--fg"),
        muted: withAlpha("--muted"),
      },
    },
  },
  plugins: [],
};

export default config;

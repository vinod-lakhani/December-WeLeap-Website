import type { Config } from "tailwindcss"

// all in fixtures is set to tailwind v3 as interims solutions

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./weleap-landing.tsx",
    "*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        /**
         * Brand tokens ported from the product app (client/webui tokens.css) so
         * the marketing site and the app read as one product.
         *
         * Added ALONGSIDE the legacy `primary` ramp rather than replacing it:
         * 31 files still reference `primary-*`, so pages can migrate one at a
         * time instead of all shifting at once.
         *
         * `brand`  — chrome only (buttons, nav, links). Never for data.
         * `cat-*`  — financial categories; a colour always means the same thing.
         */
        brand: {
          50: "#eef7f1",
          100: "#d8f0e0",
          200: "#b2ddc4",
          300: "#86c7a3",
          400: "#55aa7f",
          500: "#3a8f66",
          600: "#327a58",
          700: "#2d6a4f",
          800: "#205038",
          900: "#163a29",
          DEFAULT: "#2d6a4f",
        },
        lime: "#a7c957",
        canvas: "#f6f5f0",
        ink: { DEFAULT: "#10201a", soft: "#33443c" },
        subtle: "#6b7a72",
        faint: "#9aa7a0",
        hairline: "#e7e5dd",
        cat: { needs: "#ff9f40", wants: "#36a2eb", savings: "#4bc0c0" },
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          50: "#f0f9f4",
          100: "#dcf2e4",
          200: "#bce5cd",
          300: "#8dd1a8",
          400: "#57b67c",
          500: "#386641",
          600: "#2d5234",
          700: "#25422a",
          800: "#1f3523",
          900: "#1a2c1d",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        card: "24px", // pillowy card radius, matches the app
        chip: "12px",
      },
      boxShadow: {
        card: "0 1px 2px rgba(16,32,26,.04), 0 12px 32px rgba(16,32,26,.07)",
        lift: "0 8px 28px rgba(16,32,26,.12)",
        pill: "0 3px 12px rgba(45,106,79,.24)",
      },
      fontFamily: {
        sans: ["var(--font-jakarta)", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [],
}
export default config

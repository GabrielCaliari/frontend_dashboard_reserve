const { heroui } = require("@heroui/theme");
const tailwindAnimate = require("tailwindcss-animate");

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        nunito: ["var(--font-nunito)", "sans-serif"],
        sans: ["var(--font-nunito)", "var(--font-sans)"],
        mono: ["var(--font-mono)"],
        portalDisplay: ["var(--font-portal-display)", "ui-serif", "Georgia", "serif"],
      },
      colors: {
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
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "fade-out": {
          from: { opacity: "1" },
          to: { opacity: "0" },
        },
        "slide-down-fade-in": {
          from: { opacity: "0", transform: "translateY(-4px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      boxShadow: {
        sm: "none",
        DEFAULT: "none",
        md: "none",
        lg: "none",
        xl: "none",
        "2xl": "none",
        inner: "none",
      },
      animation: {
        "fade-in": "fade-in 200ms ease-out",
        "fade-out": "fade-out 150ms ease-in",
        "slide-down-fade-in": "slide-down-fade-in 200ms ease-out",
      },
    },
  },
  darkMode: "class",
  plugins: [
    heroui({
      layout: {
        boxShadow: {
          small: "none",
          medium: "none",
          large: "none",
        },
      },
      themes: {
        light: {
          colors: {
            background: "#F8FAF4",
            foreground: "#0E1009",
            content1: "#FFFFFF",
            content2: "#F2F5F1",
            content3: "#E5E9E4",
            content4: "#D8DFD7",
            primary: {
              DEFAULT: "#8B9B75",
              foreground: "#1E2A16",
            },
            secondary: {
              DEFAULT: "#E2F6D5",
              foreground: "#0E1009",
            },
            default: {
              50: "#F2F5F1",
              100: "#E5E9E4",
              200: "#D8DFD7",
              300: "#CCD5CA",
              400: "#BFCCBD",
              500: "#B3C2B0",
              600: "#A6B8A3",
              700: "#99AF96",
              800: "#8CA589",
              900: "#809C7D",
              foreground: "#0E1009",
            },
            focus: "#8B9B75",
          },
        },
        dark: {
          colors: {
            background: "#0F1423",
            foreground: "#ECEEF5",
            content1: "#141A2B",
            content2: "#1C243B",
            content3: "#293355",
            content4: "#36436F",
            primary: {
              DEFAULT: "#8B9B75",
              foreground: "#1E2A16",
            },
            secondary: {
              DEFAULT: "#1A2236",
              foreground: "#ECEEF5",
            },
            default: {
              50: "#141A2B",
              100: "#1C243B",
              200: "#293355",
              300: "#36436F",
              400: "#43528A",
              500: "#5062A5",
              600: "#6A7AB3",
              700: "#8391C1",
              800: "#9DA9CF",
              900: "#B6C0DD",
              foreground: "#ECEEF5",
            },
            focus: "#8B9B75",
          },
        },
      },
    }),
    tailwindAnimate
  ],
};

import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
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
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      // 8dp 그리드 시스템: 간격 스케일
      spacing: {
        // 8의 배수로 간격 정의
        '0.5': '2px',   // 4dp의 절반
        '1': '4px',     // 4dp
        '2': '8px',     // 8dp (기본 단위)
        '3': '12px',    // 1.5 * 8dp
        '4': '16px',    // 2 * 8dp
        '5': '20px',    // 2.5 * 8dp
        '6': '24px',    // 3 * 8dp
        '8': '32px',    // 4 * 8dp
        '10': '40px',   // 5 * 8dp
        '12': '48px',   // 6 * 8dp
        '16': '64px',   // 8 * 8dp
      },
      // 타이포그래피: 행간 (Line Height)
      lineHeight: {
        'tight': '1.2',      // 제목용 (120%)
        'snug': '1.375',    // 부제목용 (137.5%)
        'normal': '1.5',    // 본문용 (150%)
        'relaxed': '1.625', // 여유로운 본문 (162.5%)
        'loose': '1.75',    // 넓은 간격 (175%)
      },
      // 타이포그래피: 자간 (Letter Spacing)
      letterSpacing: {
        'tighter': '-0.02em',
        'tight': '-0.01em',
        'normal': '0',
        'wide': '0.01em',
        'wider': '0.02em',
        'widest': '0.05em', // 대문자용
      },
    },
  },
  plugins: [],
};

export default config;


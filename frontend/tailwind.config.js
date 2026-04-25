export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Professional Trading Floor Palette
        trading: {
          // Primary - Electric Cyan
          cyan: '#00D4FF',
          'cyan-glow': '#00D4FF',
          // Secondary - Deep Electric Blue  
          blue: '#0066CC',
          'blue-glow': '#0088FF',
          // Premium - Gold/Amber
          gold: '#FFB800',
          'gold-glow': '#FFD700',
          // Success - Profit Green
          profit: '#00C853',
          'profit-glow': '#00E676',
          // Loss - Warning Red
          loss: '#FF3D00',
          'loss-glow': '#FF5252',
          // Accent - Plasma Purple (sparingly)
          plasma: '#7C4DFF',
        },
        // Dark Theme - Professional Navy/Charcoal
        dark: {
          950: '#030508',  // Deepest background
          900: '#0A0E17',  // Main background
          850: '#0D1219',  // Card background
          800: '#111827',  // Elevated surface
          750: '#151D2B',  // Border/subtle
          700: '#1A2332',  // Input/secondary
          600: '#243447',  // Hover state
          500: '#2D3E52',  // Disabled
        },
        // Legacy neon (keep for compatibility, but migrate to trading)
        neon: {
          cyan: '#00D4FF',
          purple: '#7C4DFF',
          green: '#00C853',
          pink: '#FF3D00',
          blue: '#0066CC',
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'glow': 'glow 2s ease-in-out infinite alternate',
        'slide-up': 'slideUp 0.3s ease-out',
        'fade-in': 'fadeIn 0.2s ease-in',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(0, 240, 255, 0.5)' },
          '100%': { boxShadow: '0 0 20px rgba(0, 240, 255, 0.8)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      screens: {
        'mobile-sm': '450px',
        'mobile': '450px',
        'mobile-lg': '600px',
        'tablet-sm': '640px',
        'tablet': '680px',
        'tablet-lg': '768px',
        'desktop-sm': '991px',
        'desktop': '1024px',
        'desktop-lg': '1280px',
      },
      container: {
        center: true,
        padding: {
          DEFAULT: '1rem',
          'mobile-sm': '1rem',
          'mobile': '1.5rem',
          'mobile-lg': '1.5rem',
          'tablet-sm': '2rem',
          'tablet': '2rem',
          'tablet-lg': '3rem',
          'desktop-sm': '3rem',
          'desktop': '4rem',
          'desktop-lg': '6rem',
        },
        screens: {
          'mobile-sm': '100%',
          'mobile': '100%',
          'mobile-lg': '100%',
          'tablet-sm': '100%',
          'tablet': '100%',
          'tablet-lg': '100%',
          'desktop-sm': '100%',
          'desktop': '1024px',
          'desktop-lg': '1280px',
        },
      },
      animation: {
        'shine-pulse': 'shine-pulse var(--shine-pulse-duration) infinite linear',
        'fade-in': 'fadeIn 0.6s ease-in-out',
        'slide-up': 'slideUp 0.6s ease-out',
        'slide-down': 'slideDown 0.6s ease-out',
        'scale-in': 'scaleIn 0.4s ease-out',
      },
      keyframes: {
        'shine-pulse': {
          '0%': {
            'background-position': '0% 0%',
          },
          '50%': {
            'background-position': '100% 100%',
          },
          to: {
            'background-position': '0% 0%',
          },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      fontFamily: {
        display: ['var(--font-display)'],
        body: ['var(--font-body)'],
      },
      colors: {
        background: {
          DEFAULT: 'hsl(var(--background))',
          elevated: 'hsl(var(--background-elevated))',
        },
        foreground: {
          DEFAULT: 'hsl(var(--foreground))',
          muted: 'hsl(var(--foreground-muted))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
          soft: 'hsl(var(--primary-soft))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
          soft: 'hsl(var(--accent-soft))',
        },
        border: {
          DEFAULT: 'hsl(var(--border))',
          soft: 'hsl(var(--border-soft))',
        },
        glass: {
          DEFAULT: 'hsl(var(--glass))',
          border: 'hsl(var(--glass-border))',
        },
        pale: 'hsl(var(--pale-text))',
        success: 'hsl(var(--success))',
        warning: 'hsl(var(--warning))',
        error: 'hsl(var(--error))',
        ring: 'hsl(var(--ring))',
      },
      spacing: {
        '1': 'var(--space-1)', // 4px
        '2': 'var(--space-2)', // 8px
        '3': 'var(--space-3)', // 12px
        '4': 'var(--space-4)', // 16px
        '5': 'var(--space-5)', // 20px
        '6': 'var(--space-6)', // 24px
        '8': 'var(--space-8)', // 32px
        '10': 'var(--space-10)', // 40px
        '12': 'var(--space-12)', // 48px
        '16': 'var(--space-16)', // 64px
        '18': 'var(--space-18)', // 72px
        'section': 'var(--section-spacing)', // 48px
        'section-lg': 'var(--section-spacing-lg)', // 72px
        'section-mobile': '3rem',
        'section-tablet': '5rem',
        'section-desktop': '8rem',
        'card': 'var(--card-padding)', // 24px
        'card-lg': 'var(--card-padding-lg)', // 32px
      },
      gap: {
        'card': 'var(--card-gap)', // 20px
        'card-lg': 'var(--card-gap-lg)', // 24px
        'sidebar': 'var(--sidebar-item-gap)', // 12px
        'sidebar-lg': 'var(--sidebar-item-gap-lg)', // 16px
      },
      minHeight: {
        'table-row': 'var(--table-row-height)', // 72px
        'btn': '40px',
        'btn-lg': '48px',
        'btn-sm': '36px',
      },
      fontSize: {
        'hero-mobile-sm': ['2rem', { lineHeight: '2.25rem', letterSpacing: '-0.02em' }],
        'hero-mobile': ['2.5rem', { lineHeight: '2.75rem', letterSpacing: '-0.02em' }],
        'hero-tablet': ['3.5rem', { lineHeight: '3.75rem', letterSpacing: '-0.02em' }],
        'hero-desktop': ['4.5rem', { lineHeight: '4.75rem', letterSpacing: '-0.03em' }],
        'hero-desktop-lg': ['5.5rem', { lineHeight: '5.75rem', letterSpacing: '-0.03em' }],
      },
      gridTemplateColumns: {
        'responsive-1': 'repeat(1, minmax(0, 1fr))',
        'responsive-2': 'repeat(2, minmax(0, 1fr))',
        'responsive-3': 'repeat(3, minmax(0, 1fr))',
        'responsive-4': 'repeat(4, minmax(0, 1fr))',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
        xl: 'calc(var(--radius) + 4px)',
        '2xl': 'calc(var(--radius) + 8px)',
      },
      boxShadow: {
        glass: 'var(--shadow-glass)',
        elevated: 'var(--shadow-elevated)',
        floating: 'var(--shadow-floating)',
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}

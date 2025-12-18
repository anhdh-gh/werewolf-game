// @ts-check
const { fontFamily } = require('tailwindcss/defaultTheme')
const colors = require('tailwindcss/colors')

/** @type {import("tailwindcss/types").Config } */
module.exports = {
  content: [
    './node_modules/pliny/**/*.js',
    './app/**/*.{js,ts,jsx,tsx}',
    './pages/**/*.{js,ts,tsx}',
    './components/**/*.{js,ts,tsx}',
    './layouts/**/*.{js,ts,tsx}',
    './data/**/*.mdx',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      backgroundImage: {
        'section1': "url('/images/section1.jpg')",
        'hen-truoc': "url('/images/hen-truoc-bg.png')",
        'cot-moc': "url('/images/cot-moc-bg.png')",
        'dac-sac-game': "url('/images/dac-sac-game-bg.png')",
        'hien-thi-nhan-vat': "url('/images/hien-thi-nhan-vat-bg.png')",
        'rut-thuong': "url('/images/rut-thuong-bg.png')",
        'hen-truoc-form': "url('/images/hen-truoc-form.png')",
        'hen-truoc-input': "url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAqgAAABVCAYAAACFKxayAAAElElEQVR4nO3dTWsdVRzA4f/c3Lw1SdPY1Gor6KKfR5daXbS4cVfBjQtBROjCpe4KLuzCYnfWl48hfgNxIdqifUtak/s2IxNSSObOTUqTeA7c54G7CZdJ5sxAfpw5M1P8evujeA5zux8AAHhR/d3PgbrPsfGrEfFORHQcCgAAjqCMiO8i4puDNnFYoJ6NiMtlWRVPtg+NXQAAmGh5Ya7T6RSXI+LHiLg/6XuHBerpiCh+u3s/3v7iW6MNAMALu/3xe3Hpwnqx25gTA9VlewAAsiJQAQDIikAFACAre9egrtRrVxt/3LrDxUl59aWVubKMuPdo0x14ADBd6sbcbuzxk4jYjD2B+m5EXKlviHJy8H95/eW1xfpXCVQAmDrXW3a4ioibEXGrDtRTdZyOyrK4+3CzdXDuPXritOHYnVlanDWqADA96qZcnG//9//K2kox0+nUE6bfd3cv6xd/P34ab35+4DNT4VitLQtUAJgm127cmbi3P3/2/k6k1m36PG+SghNRz6AWFpUAAA0ClWRWlxZm9SkA0CRQSWZl0iIUAGCqCVSSWVmc73pyBADQJFBJZnlxvl6DKlABgH0EKsmcPjU/Z/QBgCaBSjJLC3PdqjL+AMB+ApVkFudmu67vAwBNApVk5me7Xc9BBQCaBCrJzM7MdIw+ANAkUEnG7CkA0MYMFgAAWRGoAABkRaACAJAVgQoAQFYEKgAAWRGoAABkRaACAJAVgQoAQFYEKgAAWRGoAABkRaACAJAVgQoAQFYEKgAAWRGoAABkRaACAJAVgQoAQFYEKgAAWRGoAABkRaACAJAVgQoAQFYEKgAAWRGoAABkRaACAJAVgQoAQFYEKgAAWRGoAABkRaACAJAVgQoAQFa6DgepVJWhBwDGCVSSKatSogIAYwQqyYzKqjT6AECTQCWZ4cgMKgAwTqCSTFmWZlABgDEClWQGZlABgBYClWTKnbukNCoAsJ9AJZnBaOQSPwAwRqCSjEAFANoIVJIZDN0kBQCME6gk0x8OBSoAMEagkkyvPxwZfQCgSaCSTG9oDSoAME6gksxgODKDCgCMEagksz2wBhUAGCdQSaY/sAYVABgnUEmmbw0qANBCoJLMthlUAKCFQCWZXt8aVABgnEAlmZ4ZVACghUAlGXfxAwBtBCrJCFQAoI1AJZn6VadVVTkAAMA+ApVktvqDegZVoQIA+whUktnuD0YRhQMAAOwjUEmmXoNaCFQAoKEO1K36Muu51aXih0+vto7P7/cexrUbd4wdx2qw8yapQqECwJT46oO34o3za607e251KXaX/m3VgboZETdnOp0rF8+utsbCVm/gvOHY9QajyhpUAJge588sx8Wzq5P2t26Cm3WbPrvEfysifoqIpcYXX4uI684bToIH9QPA1PokIv5o7PzTiNiIxhrUjWc/3GPBecNJ+bfXL6vKDCoATKF/IuKvSbvtJimS+fPBRs/oAwBNApVkPKMfAGjTMSoAAOTksBnUR/VE16UL68UvX37owAEAcFT1NdTHB23jsBnUhxHxdf1MdYcCAIAjqpuybssHE7cTEf8BxJ3su4qM6YYAAAAASUVORK5CYII=')",
      },
      lineHeight: {
        11: '2.75rem',
        12: '3rem',
        13: '3.25rem',
        14: '3.5rem',
      },
      fontFamily: {
        sans: ['var(--font-space-grotesk)', ...fontFamily.sans],
      },
      colors: {
        primary: colors.pink,
        gray: colors.gray,
      },
      zIndex: {
        60: '60',
        70: '70',
        80: '80',
      },
      typography: ({ theme }) => ({
        DEFAULT: {
          css: {
            a: {
              color: theme('colors.primary.500'),
              '&:hover': {
                color: `${theme('colors.primary.600')}`,
              },
              code: { color: theme('colors.primary.400') },
            },
            'h1,h2': {
              fontWeight: '700',
              letterSpacing: theme('letterSpacing.tight'),
            },
            h3: {
              fontWeight: '600',
            },
            code: {
              color: theme('colors.indigo.500'),
            },
          },
        },
        invert: {
          css: {
            a: {
              color: theme('colors.primary.500'),
              '&:hover': {
                color: `${theme('colors.primary.400')}`,
              },
              code: { color: theme('colors.primary.400') },
            },
            'h1,h2,h3,h4,h5,h6': {
              color: theme('colors.gray.100'),
            },
          },
        },
      }),
    },
  },
  plugins: [require('@tailwindcss/forms'), require('@tailwindcss/typography')],
}

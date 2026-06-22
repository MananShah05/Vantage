export const ease = {
  out:   [0.16, 1, 0.3, 1],    // expo-out — entrances
  in:    [0.7, 0, 0.84, 0],    // expo-in  — exits
  inOut: [0.87, 0, 0.13, 1],   // crossfades, panel switches
  snap:  [0.34, 1.56, 0.64, 1],// micro pops: badges, dots ONLY (<48px elements)
} as const;

export const dur = {
  instant: 0.10,
  fast:    0.25,
  base:    0.45,
  slow:    0.65,
  crawl:   1.00,
} as const;

export const variants = {
  fadeUp: {
    hidden: { opacity: 0, y: 20 },
    show:   { opacity: 1, y: 0, transition: { duration: dur.base, ease: ease.out } },
  },
  heroHeading: {
    hidden: { opacity: 0, y: 32 },
    show:   { opacity: 1, y: 0, transition: { duration: dur.slow, ease: ease.out } },
  },
  stagger: (delayChildren = 0.1, staggerChildren = 0.1) => ({
    hidden: { opacity: 0 },
    show:   { opacity: 1, transition: { delayChildren, staggerChildren } },
  }),
  fadeIn: {
    hidden: { opacity: 0 },
    show:   { opacity: 1, transition: { duration: dur.base, ease: ease.out } },
  },
  slideLeft: (i: number) => ({
    hidden: { opacity: 0, x: -12 },
    show:   { opacity: 1, x: 0,
              transition: { delay: i * 0.04, duration: dur.base, ease: ease.out } },
  }),
  panelCross: {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0,  transition: { duration: dur.fast,  ease: ease.inOut } },
    exit:    { opacity: 0, y: -10, transition: { duration: 0.18,      ease: ease.in   } },
  },
} as const;

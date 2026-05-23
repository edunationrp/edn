export const MOTION_EASE = [0.22, 1, 0.36, 1] as const

export const MOTION_DURATION = {
  fast: 0.45,
  base: 0.75,
  slow: 0.95,
} as const

export const scrollRevealVariants = {
  hidden: { opacity: 0, y: 36, filter: 'blur(6px)' },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: MOTION_DURATION.slow, ease: MOTION_EASE },
  },
}

export const scrollFadeVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: MOTION_DURATION.base, ease: MOTION_EASE },
  },
}

export const scrollScaleVariants = {
  hidden: { opacity: 0, scale: 0.94, y: 24 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: MOTION_DURATION.slow, ease: MOTION_EASE },
  },
}

export const scrollLeftVariants = {
  hidden: { opacity: 0, x: -40, filter: 'blur(4px)' },
  visible: {
    opacity: 1,
    x: 0,
    filter: 'blur(0px)',
    transition: { duration: MOTION_DURATION.slow, ease: MOTION_EASE },
  },
}

export const scrollRightVariants = {
  hidden: { opacity: 0, x: 40, filter: 'blur(4px)' },
  visible: {
    opacity: 1,
    x: 0,
    filter: 'blur(0px)',
    transition: { duration: MOTION_DURATION.slow, ease: MOTION_EASE },
  },
}

export const staggerContainerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.06,
    },
  },
}

export const staggerItemVariants = {
  hidden: { opacity: 0, y: 28, filter: 'blur(4px)' },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: MOTION_DURATION.base, ease: MOTION_EASE },
  },
}

export const heroContainerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.14, delayChildren: 0.08 },
  },
}

export const heroItemVariants = {
  hidden: { opacity: 0, y: 32, filter: 'blur(8px)' },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.9, ease: MOTION_EASE },
  },
}

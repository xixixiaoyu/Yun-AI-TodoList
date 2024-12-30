declare module 'canvas-confetti' {
  interface ConfettiConfig {
    particleCount?: number
    angle?: number
    spread?: number
    startVelocity?: number
    decay?: number
    gravity?: number
    drift?: number
    ticks?: number
    origin?: {
      x: number
      y: number
    }
    colors?: string[]
    shapes?: string[]
    scalar?: number
    zIndex?: number
  }

  type ConfettiFire = (options?: ConfettiConfig) => Promise<null>

  const confetti: ConfettiFire & {
    reset: () => void
  }

  export default confetti
}

// Small vibrations on Android (iPhones ignore these). Patterns are in milliseconds: buzz, pause, buzz…
const vibrate = (pattern: number | number[]) => {
  try {
    navigator.vibrate?.(pattern)
  } catch {
    // some in-app browsers throw instead of ignoring
  }
}

export const haptics = {
  tap: () => vibrate(8),
  error: () => vibrate([60, 40, 60]),
  success: () => vibrate([20, 40, 20]),
  open: () => vibrate(30),
  ripple: () => vibrate([12, 90, 12, 90, 12, 90, 12]),
  shutter: () => vibrate([15, 30, 40]),
  reveal: () => vibrate([20, 50, 40]),
  flip: () => vibrate(25),
  soft: () => vibrate(10),
}

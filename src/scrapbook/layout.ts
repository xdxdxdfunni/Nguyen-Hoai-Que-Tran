// Generated from the Canva mockup by tools/scrapbook — positions are in px on the 1080×2340 design.
// Each part is [x, y, width, height]. Re-run the tool if the design changes.

export const DESIGN = { width: 1080, height: 2340 } as const

export const PARTS = {
  'script-scrap': [-392, -351, 764, 897],
  'rose-strip': [645, 3, 422, 126],
  'cat': [520, 10, 105, 101],
  'fish': [339, 25, 156, 83],
  'notepad': [116, 129, 493, 462],
  'zap-1': [978, 137, 33, 61],
  'zap-2': [1010, 141, 36, 56],
  'polaroids': [648, 155, 432, 688],
  'zap-3': [1014, 187, 63, 35],
  'red-stars': [478, 523, 157, 140],
  'heart-1': [72, 609, 85, 76],
  'heart-2': [162, 661, 85, 85],
  'letter-paper': [404, 699, 1017, 855],
  'star-sticker': [394, 733, 150, 149],
  'grid-paper': [-170, 745, 523, 986],
  'heart-3': [72, 761, 85, 77],
  'sparkle-1': [310, 1205, 60, 93],
  'sparkle-2': [348, 1277, 44, 59],
  'gray-flower-1': [512, 1545, 107, 119],
  'gray-flower-2': [382, 1565, 129, 157],
  'yellow-mark-1': [870, 1565, 42, 53],
  'yellow-mark-2': [898, 1599, 69, 83],
  'camera': [648, 1625, 251, 500],
  'gray-flower-3': [492, 1681, 120, 105],
  'butterfly': [948, 1715, 165, 159],
  'dog': [198, 1755, 113, 82],
  'clip-paper': [-6, 1797, 526, 471],
  'newspaper': [256, 1907, 863, 565],
  'sparkle-3': [536, 2171, 54, 84],
  'sparkle-4': [562, 2247, 40, 55],
  'bouquet': [-22, 808, 444, 429],
  'flower-stem': [805, 1142, 270, 328],
} as const satisfies Record<string, readonly [number, number, number, number]>

export type PartName = keyof typeof PARTS

export const WINDOWS = {
  "polaroids": [
    {
      "x": 703,
      "y": 175,
      "w": 237,
      "h": 214,
      "mask": "polaroid-window-1-mask.png"
    },
    {
      "x": 800,
      "y": 308,
      "w": 252,
      "h": 245,
      "mask": "polaroid-window-2-mask.png"
    },
    {
      "x": 679,
      "y": 530,
      "w": 259,
      "h": 254,
      "mask": "polaroid-window-3-mask.png"
    }
  ],
  "camera": {
    "x": 674,
    "y": 1831,
    "w": 198,
    "h": 180,
    "mask": "camera-window-1-mask.png"
  },
  "heartFrame": {
    "x": 74,
    "y": 1405,
    "w": 241,
    "h": 263
  }
} as const

// Edit everything in this file to personalise the site.

export const content = {
  name: 'Quế Trân',
  from: 'Anh',

  // Lock screen shown before the gift opens.
  passcode: '0108',
  lockTitle: 'Nhập mật mã để mở thư',
  lockHint: 'Gợi ý: một ngày đặc biệt của hai đứa mình', // set to '' to hide
  lockHintStrong: 'Gợi ý thêm: 4 số, ngày rồi tới tháng (ddmm) nha', // shown after 3 wrong tries

  // Shown under the envelope once the passcode is right; tap the envelope to open it.
  openMe: 'Open me',

  greeting: 'Chúc mừng ngày Phụ nữ Việt Nam · 20/10',

  // The letter on the lined paper. Tapping the paper opens it full screen.
  letter: [
    'Gửi em,',
    'Viết lá thư của bạn ở đây. Mỗi phần tử trong mảng này là một đoạn văn.',
    'Cảm ơn em vì đã luôn ở bên anh.',
  ],
  // A photo of your handwritten letter (e.g. '/photos/letter.png'). When set, it replaces the typed text above.
  letterImage: '',

  // Photos: put image files in public/photos/ and list them like '/photos/1.jpg'. Empty = placeholder.
  photos: {
    scratch: ['/scrapbook/photos/photo-1.jpg', '/scrapbook/photos/photo-4.jpg', '/scrapbook/photos/photo-5.jpg'] as string[], // the three polaroids she scratches to reveal
    heartFrame: '/scrapbook/photos/photo-3.jpg', // the pink heart frame
    camera: [2, 1, 3, 4, 5].map((n) => `/scrapbook/photos/photo-${n}.jpg`), // printed by the camera, one per tap
  },

  // The clipped note: tap to flip it over.
  noteFront: 'Chạm vào đây nè',
  surpriseMessage: 'Anh yêu em nhiều lắm.',

  // The song on the CD under the scrapbook; it starts playing when she opens the envelope.
  // Put the mp3 in public/music/ and set src, e.g. '/music/song.mp3'. Empty = a built-in music box.
  song: {
    src: '/music/de-danh-cho-em.mp3',
    title: 'Để dành cho em',
    artist: 'Dangrangto',
  },
}

// Edit everything in this file to personalise the site.

export const content = {
  name: 'Quế Trân',
  from: 'Anh',

  // Envelope screen shown before the gift opens.
  passcode: '0108',
  lockTitle: 'Nhập mật mã để mở thư',
  lockHint: 'Gợi ý: một ngày đặc biệt của hai đứa mình', // set to '' to hide

  greeting: 'Chúc mừng ngày Phụ nữ Việt Nam · 20/10',

  letter: [
    'Gửi em,',
    'Viết lá thư của bạn ở đây. Mỗi phần tử trong mảng này là một đoạn văn.',
    'Cảm ơn em vì đã luôn ở bên anh.',
  ],

  // Photo-booth strip beside the letter (shown in black & white).
  // Put up to 3 images in public/photos/ and list them, e.g. '/photos/1.jpg'.
  photos: [] as string[],

  reasonsTitle: 'Những điều anh thương ở em',
  reasons: [
    'Nụ cười của em',
    'Sự dịu dàng của em',
    'Em luôn mạnh mẽ',
    'Những bữa ăn cùng em',
    'Những cuộc gọi đêm khuya',
    'Mọi thứ về em',
  ],

  surpriseButton: 'Mở điều bí mật',
  surpriseMessage: 'Anh yêu em nhiều lắm.',
} as const

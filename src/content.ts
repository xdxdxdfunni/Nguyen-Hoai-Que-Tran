// Edit everything in this file to personalise the site.

export const content = {
  name: 'Quế Trân',
  fullName: 'Nguyễn Hoài Quế Trân',
  fromFullName: 'Trương Trần Gia Bảo',
  from: 'Cá xanh', // how the letter is signed
  date: '20/10/2026',

  // Lock screen shown before the gift opens.
  passcode: '0108',
  lockTitle: 'Nhập mật mã để mở thư',
  lockHint: 'Gợi ý: một ngày đặc biệt của hai đứa mình', // set to '' to hide
  lockHintStrong: 'Gợi ý thêm: 4 số, ngày rồi tới tháng (ddmm) nha', // shown after 3 wrong tries

  // Shown under the envelope once the passcode is right; tap the envelope to open it.
  openMe: 'Open me',

  greeting: 'Chúc mừng ngày Phụ nữ Việt Nam · 20/10',

  // The letter on the lined paper. The first line is the greeting; tapping the paper opens it full screen.
  letter: [
    'Kính gửi Nguyễn Hoài Quế Trân,',
    'Hôm nay nhân ngày 20/10, cá xanh chúc cá đỏ có một ngày thật là ý nghĩa và tràn đầy hạnh phúc. Cá xanh chúc cho cá đỏ mãi trẻ, khoẻ, xinh đẹp, hồn nhiên, may mắn và luôn luôn hạnh phúc ạ.',
    'Đã 1 tháng kể từ khi chúng ta gặp nhau, và qua 1 tháng đó cá xanh cảm thấy rất là vui và may mắn khi được có mặt và đồng hành bên cá đỏ ạ.',
    'Có những lúc vui, lúc buồn, nhưng mà tụi mình vẫn không chịu từ bỏ nhau là một diễm phúc rất lớn đối với cá xanh ạ. Sau 20/10 này, cá xanh mong rằng chúng ta có thể đồng hành về lâu về dài, cho từ bây giờ đến về sau ạ.',
  ],
  // A recording of you reading the letter; it plays when she opens it, and the words appear in time with it.
  letterVoice: '/music/letter-voice.m4a',
  // A photo of your handwritten letter (e.g. '/photos/letter.png'). When set, it replaces the typed text above.
  letterImage: '',

  // Photos: put image files in public/photos/ and list them like '/photos/1.jpg'. Empty = placeholder.
  photos: {
    scratch: ['/scrapbook/photos/photo-1.jpg', '/scrapbook/photos/photo-4.jpg', '/scrapbook/photos/photo-5.jpg'] as string[], // the three polaroids she scratches to reveal
    heartFrame: '/scrapbook/photos/photo-3.jpg', // the pink heart frame
    camera: [2, 1, 3, 4, 5].map((n) => `/scrapbook/photos/photo-${n}.jpg`), // printed by the camera, one per tap
  },

  // The clipped note: tap it to open the list.
  loveList: {
    title: 'Things I love about you',
    hint: 'Chạm để xem nè',
    items: [
      'Cá xanh yêu cá đỏ dễ thương ạ',
      'Yêu cái cách cá đỏ thấu hiểu cho cá xanh ạ',
      'Yêu từng lời nói, cử chỉ của cá đỏ',
      'Yêu cá đỏ rất nhiều ạ',
    ],
  },

  // The song on the CD under the scrapbook; it starts playing when she opens the envelope.
  // Put the mp3 in public/music/ and set src, e.g. '/music/song.mp3'. Empty = a built-in music box.
  song: {
    src: '/music/de-danh-cho-em.mp3',
    title: 'Để dành cho em',
    artist: 'Dangrangto',
  },
}

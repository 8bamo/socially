// Vordefinierter Dienste-Katalog. Eigene Dienste können per URL ergänzt werden.
// icon = Slug in icons.js (offizielles Markenlogo); fehlt er, wird der Buchstabe gezeigt.
const CATALOG = [
  { key: 'whatsapp',  name: 'WhatsApp',    url: 'https://web.whatsapp.com',     color: '#25D366', letter: 'W',  icon: 'whatsapp' },
  { key: 'telegram',  name: 'Telegram',    url: 'https://web.telegram.org/a/',  color: '#2AABEE', letter: 'T',  icon: 'telegram' },
  { key: 'messenger', name: 'Messenger',   url: 'https://www.messenger.com',    color: '#0084FF', letter: 'M',  icon: 'messenger' },
  { key: 'instagram', name: 'Instagram',   url: 'https://www.instagram.com',    color: 'radial-gradient(circle at 30% 110%, #fdf497 0%, #fd5949 45%, #d6249f 60%, #285AEB 90%)', letter: 'I', icon: 'instagram' },
  { key: 'facebook',  name: 'Facebook',    url: 'https://www.facebook.com',     color: '#1877F2', letter: 'F',  icon: 'facebook' },
  { key: 'x',         name: 'X / Twitter', url: 'https://x.com',                color: '#000000', letter: 'X',  icon: 'x' },
  { key: 'discord',   name: 'Discord',     url: 'https://discord.com/app',      color: '#5865F2', letter: 'D',  icon: 'discord' },
  { key: 'slack',     name: 'Slack',       url: 'https://app.slack.com/client', color: '#611F69', letter: 'S',  icon: 'slack' },
  { key: 'teams',     name: 'MS Teams',    url: 'https://teams.microsoft.com',  color: '#6264A7', letter: 'T' },
  { key: 'linkedin',  name: 'LinkedIn',    url: 'https://www.linkedin.com',     color: '#0A66C2', letter: 'in', icon: 'linkedin' },
  { key: 'reddit',    name: 'Reddit',      url: 'https://www.reddit.com',       color: '#FF4500', letter: 'R',  icon: 'reddit' },
  { key: 'tiktok',    name: 'TikTok',      url: 'https://www.tiktok.com',       color: '#010101', letter: 'Tt', icon: 'tiktok' },
  { key: 'gmail',     name: 'Gmail',       url: 'https://mail.google.com',      color: '#EA4335', letter: 'G',  icon: 'gmail' },
  { key: 'threads',   name: 'Threads',     url: 'https://www.threads.net',      color: '#000000', letter: '@',  icon: 'threads' },
  { key: 'mastodon',  name: 'Mastodon',    url: 'https://mastodon.social',      color: '#6364FF', letter: 'M',  icon: 'mastodon' },
  { key: 'bluesky',   name: 'Bluesky',     url: 'https://bsky.app',             color: '#0085FF', letter: 'B',  icon: 'bluesky' }
];

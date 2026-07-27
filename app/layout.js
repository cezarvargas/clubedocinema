import './globals.css';

export const metadata = {
  title: 'Clube do Cinema',
  description: 'App do Clube do Cinema - avaliação de filmes e séries',
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.png',
    apple: '/favicon.png',
    shortcut: '/favicon.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Clube do Cinema',
  },
  viewport: 'width=device-width, initial-scale=1, viewport-fit=cover',
  themeColor: '#1a1a1a',
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },
  applicationName: 'Clube do Cinema',
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Cinema" />
      </head>
      <body>{children}</body>
    </html>
  );
}

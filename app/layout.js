import './globals.css';

export const metadata = {
  title: 'Clube do Cinema',
  description: 'App do Clube do Cinema',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no',
  themeColor: '#D4AF37',
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <meta name="theme-color" content="#D4AF37" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <script dangerouslySetInnerHTML={{__html: `
          if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js').catch(err => console.log('SW registration failed:', err));
          }
        `}} />
      </head>
      <body>{children}</body>
    </html>
  );
}
import './globals.css';

export const metadata = {
  title: 'Clube do Cinema',
  description: 'App do Clube do Cinema - avaliação de filmes e séries',
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
  },
  themeColor: '#1a1a1a',
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>
        {children}
        <script>{`
          if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js').catch(() => {});
          }
        `}</script>
      </body>
    </html>
  );
}

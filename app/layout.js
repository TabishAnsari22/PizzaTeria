import './globals.css';
import './responsive.css';

export const metadata = {
  title: 'Pizza Teria — Fire. Flour. Obsession.',
  description: 'Pizza Teria: slow-fermented dough, a blistered wood-fired crust, and a little obsession. Experience the craft in 3D and discover our house signatures.',
  applicationName: 'Pizza Teria',
  icons: { icon: '/favicon.svg' },
};

export const viewport = { themeColor: '#0c0c0c', colorScheme: 'dark' };

export default function RootLayout({ children }) {
  return <html lang="en"><body>{children}</body></html>;
}

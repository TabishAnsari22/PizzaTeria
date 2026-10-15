import './globals.css';

export const metadata = {
  title: 'FORNO — A little fire. A lot of soul.',
  description: 'Slow-fermented dough. Fiery ovens. A little Italian soul. Explore the FORNO pizza collection and follow your pizza from our kitchen to your doorstep in 3D.',
  applicationName: 'FORNO',
  icons: { icon: '/favicon.svg' },
};

export default function RootLayout({ children }) {
  return <html lang="en"><body>{children}</body></html>;
}

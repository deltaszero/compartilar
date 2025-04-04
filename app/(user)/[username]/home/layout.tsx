import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'CompartiLar :: Meu Lar',
  description: 'CompartiLar :: Meu Lar',
};

export default function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
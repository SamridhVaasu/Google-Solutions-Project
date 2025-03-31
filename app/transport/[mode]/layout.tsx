export function generateStaticParams() {
  return [
    { mode: 'road' },
    { mode: 'air' },
    { mode: 'waterway' }
  ];
}

export default function TransportLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

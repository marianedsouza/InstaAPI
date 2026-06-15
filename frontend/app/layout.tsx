import './globals.css';

export const metadata = {
  title: 'InstaAPI Dashboard',
  description: 'Instagram Profile Analysis',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

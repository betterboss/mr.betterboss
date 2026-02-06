export const metadata = {
  title: 'Mr. Better Boss | AI JobTread Sidebar',
  description: 'Your AI-powered JobTread implementation guide. Get instant answers on estimates, workflows, automations & best practices. Built by Better Boss.',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body style={{ margin: 0, padding: 0, fontFamily: "'Inter', system-ui, -apple-system, sans-serif", background: '#1a1a2e' }}>
        {children}
      </body>
    </html>
  );
}

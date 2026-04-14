import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "lifeNote Web",
  description: "lifeNote API 연동 웹",
};

const themeInitScript = `
(function(){
  try {
    var k = 'lifeNote-theme';
    var t = localStorage.getItem(k);
    if (t === 'light' || t === 'dark') {
      document.documentElement.setAttribute('data-theme', t);
    } else {
      document.documentElement.setAttribute(
        'data-theme',
        window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      );
    }
  } catch (e) {
    document.documentElement.setAttribute('data-theme', 'light');
  }
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}

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
  title: {
    template: '%s | TechLife Service',
    default: 'TechLife Service | SaaS para Talleres de Reparación',
  },
  description: 'Gestiona tu taller de electrónica, computadoras o celulares con TechLife Service. Control de inventario, órdenes de servicio, punto de venta y portal de clientes.',
  manifest: '/manifest.json',
  themeColor: '#4f46e5',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'TechLife Service',
  },
  icons: {
    apple: '/logo_icon.png',
  },
  metadataBase: new URL('https://techlife.service'),
  openGraph: {
    title: 'TechLife Service',
    description: 'La plataforma definitiva para gestionar tu taller de reparaciones.',
    url: 'https://techlife.service',
    siteName: 'TechLife Service',
    locale: 'es_LA',
    type: 'website',
  },
};

import { ThemeProvider } from "@/components/theme-provider"

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}

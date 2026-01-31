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
  metadataBase: new URL('https://techlife.service'), // Placeholder, vital for OpenGraph
  openGraph: {
    title: 'TechLife Service',
    description: 'La plataforma definitiva para gestionar tu taller de reparaciones.',
    url: 'https://techlife.service',
    siteName: 'TechLife Service',
    locale: 'es_LA',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}

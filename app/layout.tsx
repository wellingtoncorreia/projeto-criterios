import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
// Ajuste o caminho do import conforme sua estrutura de pastas
import Navbar from "./components/ui/Navbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Sistema de Critérios SENAI",
  description: "Gestão de Avaliação por Competências",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-50 text-gray-900`}
      >
        {/* O componente Navbar é renderizado aqui. Ele decide se aparece ou não. */}
        <Navbar />
        
        {/* Adicionado 'pt-16' para dar espaço ao menu fixo no topo */}
        <main className="min-h-screen">
          {children}
        </main>
      </body>
    </html>
  );
}
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "./components/ui/Navbar";
// [NOVO] Importe o componente de Auto Logout
import AutoLogoutProvider from "./components/auth/AutoLogoutProvider";

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
        {/* [NOVO] Adicione o AutoLogoutProvider aqui. 
            Ele roda a lógica silenciosa de monitoramento. */}
        <AutoLogoutProvider />

        {/* O componente Navbar é renderizado aqui. */}
        <Navbar />
        
        {/* Adicionado 'pt-16' para dar espaço ao menu fixo no topo */}
        <main className="min-h-screen">
          {children}
        </main>
      </body>
    </html>
  );
}
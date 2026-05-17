// frontend/src/app/layout.tsx

import type { Metadata } from "next";
import "./globals.css";
import { Geist } from "next/font/google";
import { Navigation } from "@/components/Navigation";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner"; // Twój komponent do powiadomień

const geist = Geist({ subsets: ['latin'], variable: '--font-sans' });

export const metadata: Metadata = {
    title: "Aplikacja Finansowa",
    description: "Zarządzaj swoim portfelem inwestycyjnym",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="pl">
            <body className={geist.className}>
                <div className="relative flex min-h-screen flex-col">
                    {/* Nasz nowy panel nawigacyjny */}
                    <Navigation />

                    {/* Główna zawartość poszczególnych stron (zakładek) */}
                    <main className="flex-1 container mx-auto px-4 py-8">
                        {children}
                    </main>
                </div>

                {/* Toaster do globalnych powiadomień */}
                <Toaster />
            </body>
        </html>
    );
}
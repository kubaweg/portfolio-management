// frontend/src/app/layout.tsx

import type { Metadata } from "next";
import "./globals.css";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
    title: "Portfolio Manager",
    description: "Zarządzanie aktywami",
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="pl" className={cn("font-sans", geist.variable)}>
            <body className="antialiased">
                {/* Tutaj Next.js wstrzyknie treść z Twoich plików page.tsx */}
                {children}
            </body>
        </html>
    );
}
// frontend/src/app/layout.tsx

import type { Metadata } from "next";
import "./globals.css";

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
        <html lang="pl">
            <body className="antialiased">
                {/* Tutaj Next.js wstrzyknie treść z Twoich plików page.tsx */}
                {children}
            </body>
        </html>
    );
}
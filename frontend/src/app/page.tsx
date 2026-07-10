import React from "react"
import Link from "next/link"
import {
    PlusCircle,
    ArrowRightLeft,
    LayoutDashboard,
    PieChart,
    Settings,
    Wallet
} from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

// Definicja kafelków menu
const navigationItems = [
    {
        title: "Dodaj Transakcję",
        description: "Zarejestruj kupno, sprzedaż lub dywidendę",
        href: "add_transaction", // dostosuj ścieżkę do swojej struktury
        icon: ArrowRightLeft,
        color: "text-blue-600",
        bgColor: "bg-blue-50",
    },
    {
        title: "Dodaj Aktywo",
        description: "Wprowadź nowy instrument do bazy danych",
        href: "add_asset",
        icon: PlusCircle,
        color: "text-green-600",
        bgColor: "bg-green-50",
    },
    {
        title: "Portfel",
        description: "Przeglądaj swoje aktualne pozycje",
        href: "/portfolio",
        icon: Wallet,
        color: "text-purple-600",
        bgColor: "bg-purple-50",
    },
    {
        title: "Analityka",
        description: "Wykresy, zyski i statystyki portfela",
        href: "/analysis",
        icon: PieChart,
        color: "text-orange-600",
        bgColor: "bg-orange-50",
    },
]

export default function HomePage() {
    return (
        <div className="min-h-screen bg-slate-50/50 py-12 px-4">
            <div className="container mx-auto max-w-5xl">

                {/* Nagłówek powitalny */}
                <div className="mb-12 text-center">
                    <div className="inline-flex items-center justify-center p-3 mb-4 bg-white rounded-2xl shadow-sm border border-slate-100">
                        <LayoutDashboard className="h-8 w-8 text-blue-600" />
                    </div>
                    <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 mb-2">
                        System Zarządzania Portfelem
                    </h1>
                    <p className="text-lg text-slate-500">
                        Witaj ponownie! Wybierz akcję, którą chcesz teraz wykonać.
                    </p>
                </div>

                {/* Siatka nawigacji */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {navigationItems.map((item) => (
                        <Link key={item.href} href={item.href} className="group">
                            <Card className="h-full transition-all duration-200 hover:shadow-md hover:border-blue-200 hover:-translate-y-1 active:scale-[0.98]">
                                <CardHeader className="flex flex-row items-center gap-4 space-y-0">
                                    <div className={`p-3 rounded-xl ${item.bgColor} ${item.color} group-hover:scale-110 transition-transform`}>
                                        <item.icon className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-xl group-hover:text-blue-600 transition-colors">
                                            {item.title}
                                        </CardTitle>
                                        <CardDescription className="mt-1">
                                            {item.description}
                                        </CardDescription>
                                    </div>
                                </CardHeader>
                            </Card>
                        </Link>
                    ))}
                </div>

                {/* Sekcja pomocnicza / Stopka */}
                <div className="mt-12 p-6 border border-dashed border-slate-300 rounded-2xl text-center">
                    <p className="text-sm text-slate-400 flex items-center justify-center gap-2">
                        <Settings className="h-4 w-4" /> System operuje w czasie rzeczywistym. Dane są synchronizowane z Twoją bazą.
                    </p>
                </div>
            </div>
        </div>
    )
}
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils"; // Funkcja narzędziowa, którą już masz w projekcie
import { Home, PieChart, PlusCircle, ArrowRightLeft } from "lucide-react"; // Ikony, które zazwyczaj instalują się z shadcn/ui

const navItems = [
    { name: "Dashboard", href: "/", icon: Home },
    { name: "Mój Portfel", href: "/portfolio", icon: PieChart },
    { name: "Dodaj Aktywo", href: "/add_asset", icon: PlusCircle },
    { name: "Dodaj Transakcję", href: "/add_transaction", icon: ArrowRightLeft },
];

export function Navigation() {
    const pathname = usePathname();

    return (
        <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container mx-auto flex h-16 items-center px-4">
                {/* Logo / Tytuł aplikacji */}
                <div className="mr-8 hidden md:flex">
                    <Link href="/" className="flex items-center space-x-2">
                        <span className="font-bold text-lg tracking-tight">FinDash</span>
                    </Link>
                </div>

                {/* Główne linki nawigacyjne */}
                <div className="flex flex-1 items-center space-x-6 text-sm font-medium">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href;

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "flex items-center space-x-2 transition-colors hover:text-foreground/80",
                                    isActive ? "text-foreground" : "text-foreground/60"
                                )}
                            >
                                <Icon className="h-4 w-4" />
                                <span className="hidden sm:inline-block">{item.name}</span>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </nav>
    );
}
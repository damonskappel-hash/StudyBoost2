"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import {
  Brain,
  BookOpen,
  BarChart3,
  Plus,
  Home,
  FileText,
  Settings,
  CreditCard,
  DollarSign
} from "lucide-react"

const navigation = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: Home,
  },
  {
    name: "Subjects",
    href: "/subjects",
    icon: BookOpen,
  },
  {
    name: "Analytics",
    href: "/analytics",
    icon: BarChart3,
  },
  {
    name: "Flashcards",
    href: "/flashcards",
    icon: FileText,
  },
  {
    name: "Pricing & Billing",
    href: "/pricing",
    icon: DollarSign,
  },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="flex h-full w-64 flex-col bg-card border-r border-border">
      {/* Logo */}
      <div className="flex h-16 items-center border-b border-border px-6">
        <Link href="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <Brain className="h-5 w-5 text-primary" />
          </div>
          <span className="text-lg font-semibold text-foreground">StudyBoost</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link key={item.name} href={item.href}>
              <Button
                variant={isActive ? "secondary" : "ghost"}
                size="sm"
                className={cn(
                  "w-full justify-start h-9 px-3 text-sm font-medium",
                  isActive 
                    ? "bg-secondary text-secondary-foreground shadow-sm" 
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                )}
              >
                <item.icon className="mr-3 h-4 w-4" />
                {item.name}
              </Button>
            </Link>
          )
        })}
      </nav>

      {/* Bottom section */}
      <div className="border-t border-border p-4 space-y-3">
        {/* New Note Button */}
        <Link href="/enhance" className="w-full">
          <Button size="sm" className="w-full h-9">
            <Plus className="mr-2 h-4 w-4" />
            New Note
          </Button>
        </Link>

        {/* Theme Toggle */}
        <div className="flex justify-center">
          <ThemeToggle />
        </div>
      </div>
    </div>
  )
}

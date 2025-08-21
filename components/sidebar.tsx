"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { UserButton } from "@clerk/nextjs"
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
    <div className="flex h-full w-64 flex-col bg-card border-r">
      {/* Logo */}
      <div className="flex h-16 items-center border-b px-6">
        <Link href="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
          <Brain className="h-8 w-8 text-blue-600" />
          <span className="text-xl font-bold text-foreground">StudyBoost</span>
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
                className={cn(
                  "w-full justify-start",
                  isActive && "bg-secondary text-secondary-foreground"
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
      <div className="border-t p-4 space-y-3">
        {/* New Note Button */}
        <Link href="/enhance" className="w-full">
          <Button className="w-full">
            <Plus className="mr-2 h-4 w-4" />
            New Note
          </Button>
        </Link>

        {/* Theme Toggle */}
        <div className="flex justify-center">
          <ThemeToggle />
        </div>

        {/* User Button */}
        <div className="flex justify-center">
          <UserButton />
        </div>
      </div>
    </div>
  )
}

"use client"

import { Sidebar } from "@/components/sidebar"
import { UserButton } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import { Brain, Home, BookOpen, BarChart3, FileText, Settings } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

interface AppLayoutProps {
  children: React.ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  const pathname = usePathname()

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
  ]

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="border-b border-border bg-card px-6 py-3">
          <div className="flex items-center justify-between">
            {/* Left side - Navigation */}
            <div className="flex items-center space-x-1">
              {navigation.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link key={item.name} href={item.href}>
                    <Button
                      variant={isActive ? "secondary" : "ghost"}
                      size="sm"
                      className="h-8 px-3 text-sm font-medium"
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      {item.name}
                    </Button>
                  </Link>
                )
              })}
            </div>

            {/* Right side - Account */}
            <div className="flex items-center space-x-3">
              <UserButton 
                appearance={{
                  elements: {
                    userButtonBox: "h-8 w-8",
                    userButtonTrigger: "h-8 w-8 rounded-lg"
                  }
                }}
              />
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}

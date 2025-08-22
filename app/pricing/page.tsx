import { PricingTable } from '@clerk/nextjs'
import { AppLayout } from "@/components/app-layout"

export default function PricingPage() {
  return (
    <AppLayout>
      <div className="p-6">
        <div className="max-w-6xl mx-auto">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-semibold text-foreground mb-2 tracking-tight">Pricing & Plans</h1>
            <p className="text-base text-muted-foreground">
              Choose the perfect plan for your study needs. Upgrade anytime to unlock more features.
            </p>
          </div>

          {/* Clerk Pricing Table */}
          <div className="flex justify-center">
            <PricingTable 
              appearance={{
                elements: {
                  // Card styling
                  card: "bg-card border border-border shadow-sm",
                  cardHeader: "bg-card border-b border-border",
                  cardContent: "bg-card",
                  
                  // Text colors
                  headerTitle: "text-foreground",
                  headerSubtitle: "text-muted-foreground",
                  priceText: "text-foreground",
                  priceSubtext: "text-muted-foreground",
                  featureText: "text-foreground",
                  featureSubtext: "text-muted-foreground",
                  
                  // Button styling
                  formButtonPrimary: "bg-primary text-primary-foreground hover:bg-primary/90",
                  formButtonSecondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
                  
                  // Badge styling
                  badge: "bg-primary/10 text-primary border border-primary/20",
                  
                  // Toggle styling
                  toggle: "bg-muted border-border",
                  toggleActive: "bg-primary border-primary",
                  
                  // Divider styling
                  dividerLine: "bg-border",
                  dividerText: "text-muted-foreground",
                  
                  // Form styling
                  formFieldInput: "bg-background border border-border text-foreground",
                  formFieldLabel: "text-foreground",
                  
                  // Modal styling
                  modalBackdrop: "bg-background/80",
                  modalContent: "bg-card border border-border",
                  modalHeader: "text-foreground",
                  modalBody: "text-muted-foreground",
                }
              }}
              // Add your production plan IDs here
              // Replace these with your actual plan IDs from Clerk dashboard
              // planIds={[
              //   "price_1ABC123...", // Student plan
              //   "price_1DEF456..."  // Pro plan
              // ]}
            />
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
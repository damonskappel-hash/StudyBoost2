import { PricingTable } from '@clerk/nextjs'
import { AppLayout } from "@/components/app-layout"

export default function PricingPage() {
  return (
    <AppLayout>
      <div className="p-8">
        <div className="max-w-6xl mx-auto">
          {/* Page Header */}
          <div className="mb-10">
            <h1 className="text-4xl font-bold text-gray-900 mb-3 tracking-tight">Pricing & Plans</h1>
            <p className="text-xl text-gray-600 font-medium">
              Choose the perfect plan for your study needs. Upgrade anytime to unlock more features.
            </p>
          </div>

          {/* Clerk Pricing Table */}
          <div className="flex justify-center">
            <PricingTable />
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
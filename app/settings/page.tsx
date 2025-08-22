import { AppLayout } from "@/components/app-layout"
import { UserButton } from "@clerk/nextjs"

export default function SettingsPage() {
  return (
    <AppLayout>
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-semibold text-foreground mb-6">Settings</h1>
          
          <div className="space-y-8">
            <div className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-xl font-medium text-foreground mb-4">Account Settings</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Account Management</span>
                  <UserButton />
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-xl font-medium text-foreground mb-4">Subscription</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>Manage your subscription and billing information through your account settings above.</p>
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-xl font-medium text-foreground mb-4">Data & Privacy</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>Your data is securely stored and processed. We use industry-standard encryption to protect your information.</p>
                <p>You can request data deletion or export through your account settings.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}

import { AppLayout } from "@/components/app-layout"

export default function ContactPage() {
  return (
    <AppLayout>
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-semibold text-foreground mb-6">Contact Us</h1>
          
          <div className="space-y-8">
            <div className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-xl font-medium text-foreground mb-4">Get in Touch</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>We'd love to hear from you! Here's how to reach us:</p>
                
                <div className="space-y-3">
                  <div>
                    <h3 className="font-medium text-foreground">Email Support</h3>
                    <p className="text-primary">support@noteboost.app</p>
                  </div>
                  
                  <div>
                    <h3 className="font-medium text-foreground">Business Inquiries</h3>
                    <p className="text-primary">hello@noteboost.app</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-xl font-medium text-foreground mb-4">Response Time</h2>
              <div className="space-y-2 text-muted-foreground">
                <p>• Support emails: Within 24 hours</p>
                <p>• Business inquiries: Within 48 hours</p>
                <p>• Bug reports: Within 12 hours</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}

import { AppLayout } from "@/components/app-layout"

export default function HelpPage() {
  return (
    <AppLayout>
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-semibold text-foreground mb-6">Help & Support</h1>
          
          <div className="space-y-8">
            <div className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-xl font-medium text-foreground mb-4">Getting Started</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>Welcome to NoteBoost! Here's how to get started:</p>
                <ol className="list-decimal list-inside space-y-2 ml-4">
                  <li>Upload your lecture notes or paste text directly</li>
                  <li>Choose your enhancement settings</li>
                  <li>Let AI transform your notes into organized study materials</li>
                  <li>Use AI features to generate summaries, quizzes, and flashcards</li>
                </ol>
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-xl font-medium text-foreground mb-4">Supported File Types</h2>
              <div className="space-y-2 text-muted-foreground">
                <p>• Text files (.txt)</p>
                <p>• Word documents (.docx)</p>
                <p>• Images (JPG, PNG, GIF, BMP, WebP)</p>
                <p>• Audio files (MP3, WAV, M4A, AAC, OGG, WebM)</p>
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-xl font-medium text-foreground mb-4">Need More Help?</h2>
              <div className="space-y-2 text-muted-foreground">
                <p>If you need additional support, please contact us at:</p>
                <p className="text-primary">support@noteboost.app</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}

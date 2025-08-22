import { AppLayout } from "@/components/app-layout"

export default function FAQPage() {
  return (
    <AppLayout>
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-semibold text-foreground mb-6">Frequently Asked Questions</h1>
          
          <div className="space-y-6">
            <div className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-lg font-medium text-foreground mb-3">What is NoteBoost?</h2>
              <p className="text-muted-foreground">
                NoteBoost is an AI-powered note enhancement tool that transforms your lecture notes into organized, 
                comprehensive study materials. It uses advanced AI to add definitions, examples, and structure to your notes.
              </p>
            </div>

            <div className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-lg font-medium text-foreground mb-3">What file types do you support?</h2>
              <p className="text-muted-foreground">
                We support text files (.txt), Word documents (.docx), images (JPG, PNG, GIF, BMP, WebP), 
                and audio files (MP3, WAV, M4A, AAC, OGG, WebM). Images and audio are automatically processed 
                using OCR and transcription.
              </p>
            </div>

            <div className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-lg font-medium text-foreground mb-3">How does the AI enhancement work?</h2>
              <p className="text-muted-foreground">
                Our AI analyzes your notes and adds structure, definitions, examples, and study questions. 
                It can also generate summaries, quizzes, and flashcards to help you study more effectively.
              </p>
            </div>

            <div className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-lg font-medium text-foreground mb-3">What are the different subscription plans?</h2>
              <div className="space-y-2 text-muted-foreground">
                <p><strong>Free:</strong> 5 notes per month, basic enhancement, 10MB file limit</p>
                <p><strong>Student ($4.99/month):</strong> Unlimited notes, advanced features, 50MB file limit</p>
                <p><strong>Pro ($9.99/month):</strong> All features, API access, 100MB file limit</p>
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-lg font-medium text-foreground mb-3">Is my data secure?</h2>
              <p className="text-muted-foreground">
                Yes! We use industry-standard encryption and security practices. Your notes are processed securely 
                and we don't store or share your content with third parties.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}

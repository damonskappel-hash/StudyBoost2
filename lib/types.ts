export interface EnhancementSettings {
  includeDefinitions: boolean;
  generateQuestions: boolean;
  createSummary: boolean;
  addExamples: boolean;
  structureLevel: "basic" | "detailed" | "comprehensive";
  autoGenerateFlashcards?: boolean;
}

export interface Note {
  _id: string;
  userId: string;
  title: string;
  originalContent: string;
  enhancedContent?: string;
  subject?: string;
  fileId?: string;
  fileName?: string;
  fileType?: string;
  enhancementStatus: "pending" | "processing" | "completed" | "failed";
  enhancementSettings: EnhancementSettings;
  processingTime?: number;
  wordCount?: number;
  createdAt: number;
  updatedAt: number;
}

export interface User {
  _id: string;
  clerkUserId: string;
  email: string;
  name?: string;
  subscriptionTier: "free" | "student" | "premium";
  subscriptionStatus: "active" | "cancelled" | "expired";
  monthlyNotesUsed: number;
  resetDate: number;
  createdAt: number;
  updatedAt: number;
}

export interface Subscription {
  _id: string;
  userId: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  tier: "free" | "student" | "premium";
  status: string;
  currentPeriodStart?: number;
  currentPeriodEnd?: number;
  createdAt: number;
  updatedAt: number;
}

export interface UsageLimit {
  canUse: boolean;
  currentUsage: number;
  limit: number;
  tier: "free" | "student" | "premium";
  reason?: string;
}

export interface FileUpload {
  file: File;
  preview?: string;
  content?: string;
}

export interface SubjectOption {
  value: string;
  label: string;
  icon: string;
}

export const SUBJECT_OPTIONS: SubjectOption[] = [
  { value: "math", label: "Mathematics", icon: "🧮" },
  { value: "science", label: "Science", icon: "🔬" },
  { value: "history", label: "History", icon: "📚" },
  { value: "english", label: "English", icon: "📖" },
  { value: "computer-science", label: "Computer Science", icon: "💻" },
  { value: "physics", label: "Physics", icon: "⚛️" },
  { value: "chemistry", label: "Chemistry", icon: "🧪" },
  { value: "biology", label: "Biology", icon: "🧬" },
  { value: "economics", label: "Economics", icon: "💰" },
  { value: "psychology", label: "Psychology", icon: "🧠" },
  { value: "other", label: "Other", icon: "📝" },
];

export const PRICING_TIERS = {
  free: {
    name: "Free",
    price: 0,
    notesPerMonth: 5,
    fileSizeLimit: "10MB",
    features: [
      "Basic note enhancement",
      "Standard processing",
      "Export to PDF",
      "Email support",
    ],
  },
  student: {
    name: "Student",
    price: 4.99,
    notesPerMonth: "Unlimited",
    fileSizeLimit: "50MB",
    features: [
      "All Free features",
      "Advanced AI enhancement",
      "Study questions generation",
      "Definitions & examples",
      "Priority processing",
      "Export to Word & Markdown",
    ],
  },
  premium: {
    name: "Premium",
    price: 9.99,
    notesPerMonth: "Unlimited",
    fileSizeLimit: "100MB",
    features: [
      "All Student features",
      "API access",
      "Custom enhancement prompts",
      "Bulk processing",
      "Advanced analytics",
      "Priority support",
    ],
  },
};

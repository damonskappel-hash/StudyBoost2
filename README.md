# StudyBoost - AI Lecture Note Enhancer

Transform messy student notes into organized, enhanced study materials using AI.

## Features

- 🤖 **AI-Powered Enhancement**: Intelligent analysis and improvement of notes
- 📚 **Smart Organization**: Automatic structuring with clear headings and bullet points
- ❓ **Study Questions**: Generate practice questions to test understanding
- 📖 **Definitions & Examples**: Clear explanations of technical terms
- 📁 **Multiple Formats**: Support for TXT, PDF, DOCX, and images
- 📤 **Export Options**: Download enhanced notes as PDF, Word, or Markdown
- 👥 **User Management**: Secure authentication with Clerk
- 💾 **Cloud Storage**: Reliable data storage with Convex
- 📊 **Usage Tracking**: Monitor your monthly note enhancement usage

## Tech Stack

- **Frontend**: Next.js 14, React 19, TypeScript
- **Styling**: Tailwind CSS, Shadcn/ui components
- **Authentication**: Clerk
- **Database**: Convex
- **AI**: OpenAI GPT-4
- **File Processing**: PDF parsing, OCR for images
- **Deployment**: Vercel (recommended)

## Prerequisites

- Node.js 18+ 
- npm or yarn
- Clerk account (for authentication)
- Convex account (for database)
- OpenAI API key (for AI enhancement)

## Quick Start

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd notes_enhancer
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

Create a `.env.local` file in the root directory:

```env
# Clerk Authentication (already configured)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# Convex Database (already configured)
NEXT_PUBLIC_CONVEX_URL=https://...convex.cloud

# OpenAI API (add this for full functionality)
OPENAI_API_KEY=<YOUR_OPENAI_API_KEY>

# OpenAI Model (optional - defaults to gpt-3.5-turbo for cost-effective testing)
OPENAI_MODEL=gpt-3.5-turbo
# Other options: gpt-4, gpt-4-turbo
```

### 4. Set Up Convex

```bash
# Install Convex CLI globally
npm install -g convex

# Login to Convex
npx convex dev

# This will start the Convex development server and open the dashboard
```

### 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Model Configuration

The application supports multiple OpenAI models with different cost and quality trade-offs:

- **GPT-3.5 Turbo** (default): Fast, cost-effective (~$0.0015/1k tokens)
- **GPT-4**: Higher quality, more expensive (~$0.03/1k tokens)  
- **GPT-4 Turbo**: Best balance (~$0.01/1k tokens)

To switch models, add `OPENAI_MODEL=gpt-4` to your `.env.local` file.

**For Testing**: Use `gpt-3.5-turbo` to keep costs low while developing.
**For Production**: Consider `gpt-4-turbo` for the best quality/cost balance.

## Project Structure

```
notes_enhancer/
├── app/                          # Next.js app directory
│   ├── dashboard/               # User dashboard
│   ├── enhance/                 # Note enhancement pages
│   ├── pricing/                 # Pricing page
│   ├── sign-in/                 # Authentication pages
│   ├── sign-up/
│   └── api/                     # API routes
├── components/                   # React components
│   ├── ui/                      # Shadcn/ui components
│   └── ...
├── convex/                      # Convex database functions
│   ├── schema.ts               # Database schema
│   ├── users.ts                # User management
│   ├── notes.ts                # Note operations
│   └── auth.config.ts          # Auth configuration
├── hooks/                       # Custom React hooks
├── lib/                         # Utility functions
│   ├── openai.ts               # OpenAI integration
│   ├── types.ts                # TypeScript types
│   └── utils.ts                # Utility functions
└── public/                      # Static assets
```

## Key Features Implementation

### 1. Landing Page
- Modern, student-friendly design
- Clear value proposition
- Feature highlights and testimonials
- Call-to-action buttons

### 2. Authentication
- Clerk integration for secure user management
- Social login options (Google, GitHub)
- Protected routes with middleware

### 3. Dashboard
- User statistics and usage tracking
- Recent notes overview
- Quick upload functionality
- Subscription status display

### 4. Note Enhancement
- File upload with drag-and-drop
- Multiple file format support
- Customizable enhancement settings
- Real-time processing status

### 5. Enhanced Note Viewer
- Side-by-side comparison view
- Markdown rendering
- Export and print functionality
- Copy to clipboard

### 6. Pricing Tiers
- Free: 5 notes/month, basic features
- Student: $4.99/month, unlimited notes
- Premium: $9.99/month, advanced features

## Database Schema

### Users Table
- Clerk user ID
- Email and name
- Subscription tier and status
- Monthly usage tracking

### Notes Table
- User relationship
- Original and enhanced content
- File metadata
- Enhancement settings and status
- Processing information

### Subscriptions Table
- User relationship
- Stripe integration (future)
- Billing information

## API Endpoints

### POST /api/enhance-note
Enhances note content using OpenAI API.

**Request Body:**
```json
{
  "noteId": "string",
  "originalContent": "string",
  "subject": "string",
  "enhancementSettings": {
    "includeDefinitions": boolean,
    "generateQuestions": boolean,
    "createSummary": boolean,
    "addExamples": boolean,
    "structureLevel": "basic" | "detailed" | "comprehensive"
  }
}
```

**Response:**
```json
{
  "success": boolean,
  "enhancedContent": "string",
  "processingTime": number,
  "wordCount": number
}
```

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Environment Variables for Production

Make sure to set these in your production environment:

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
NEXT_PUBLIC_CONVEX_URL=https://...convex.cloud
OPENAI_API_KEY=<YOUR_OPENAI_API_KEY>
```

## Development

### Adding New Features

1. **Database Changes**: Update `convex/schema.ts` and run `npx convex dev`
2. **New Pages**: Add to `app/` directory following Next.js 14 conventions
3. **Components**: Create in `components/` directory
4. **API Routes**: Add to `app/api/` directory

### Code Style

- Use TypeScript for all new code
- Follow ESLint configuration
- Use Shadcn/ui components for consistency
- Implement proper error handling
- Add loading states for better UX

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support, email support@studyboost.com or create an issue in the repository.

## Roadmap

- [ ] Mobile app development
- [ ] Collaborative note sharing
- [ ] LMS integration (Canvas, Blackboard)
- [ ] Voice-to-text note taking
- [ ] Advanced subject-specific models
- [ ] Flashcard generation
- [ ] Study schedule recommendations
// Force latest commit deployment
// Force latest deployment

#!/bin/bash
echo "Current API key format:"
grep OPENAI_API_KEY .env.local

echo ""
echo "The API key should be on a single line. Please edit your .env.local file and put the entire API key on one line."
echo "Example format:"
echo "OPENAI_API_KEY=REDACTED"
echo ""
echo "After fixing the .env.local file, run: npx convex env set OPENAI_API_KEY \"your-complete-api-key\""


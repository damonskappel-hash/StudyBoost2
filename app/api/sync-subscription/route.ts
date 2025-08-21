import { auth } from '@clerk/nextjs/server'
import { ConvexHttpClient } from 'convex/browser'
import { api } from '../../../convex/_generated/api'

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!)

export async function POST(req: Request) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return new Response('Unauthorized', { status: 401 })
    }

    // Get user from Clerk to check subscription
    const clerkResponse = await fetch(`https://api.clerk.com/v1/users/${userId}`, {
      headers: {
        'Authorization': `Bearer ${process.env.CLERK_SECRET_KEY}`,
        'Content-Type': 'application/json'
      }
    })

    if (!clerkResponse.ok) {
      throw new Error('Failed to fetch user from Clerk')
    }

    const clerkUser = await clerkResponse.json()
    
    // Check for subscription data in metadata
    const subscriptionTier = 
      clerkUser.public_metadata?.subscription ||
      clerkUser.public_metadata?.plan ||
      clerkUser.private_metadata?.subscription ||
      clerkUser.private_metadata?.plan ||
      'free'

    // Map Clerk subscription to Convex tier
    let convexTier: 'free' | 'student' | 'premium' = 'free'
    
    if (subscriptionTier === 'pro' || subscriptionTier === 'premium') {
      convexTier = 'premium'
    } else if (subscriptionTier === 'student') {
      convexTier = 'student'
    } else {
      convexTier = 'free'
    }

    // Update Convex user subscription
    await convex.mutation(api.users.updateSubscription, {
      clerkUserId: userId,
      tier: convexTier,
      status: 'active'
    })

    return new Response(JSON.stringify({ 
      success: true, 
      tier: convexTier,
      clerkSubscription: subscriptionTier 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Error syncing subscription:', error)
    return new Response(JSON.stringify({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

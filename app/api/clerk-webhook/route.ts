import { Webhook } from 'svix'
import { headers } from 'next/headers'
import { WebhookEvent } from '@clerk/nextjs/server'
import { ConvexHttpClient } from 'convex/browser'
import { api } from '../../../convex/_generated/api'

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!)

export async function POST(req: Request) {
  // Get the headers
  const headerPayload = headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error occured -- no svix headers', {
      status: 400
    })
  }

  // Get the body
  const payload = await req.json()
  const body = JSON.stringify(payload);

  // Create a new Svix instance with your secret.
  const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET || '');

  let evt: WebhookEvent

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent
  } catch (err) {
    console.error('Error verifying webhook:', err);
    return new Response('Error occured', {
      status: 400
    })
  }

  // Handle the webhook
  const eventType = evt.type;
  
  if (eventType === 'user.created') {
    // User was created - create corresponding Convex user
    const { id, email_addresses, first_name, last_name } = evt.data;
    const email = email_addresses?.[0]?.email_address;
    const name = first_name && last_name ? `${first_name} ${last_name}` : first_name || last_name;
    
    if (email) {
      try {
        await convex.mutation(api.users.createUser, {
          clerkUserId: id,
          email,
          name
        });
        console.log('Created Convex user for:', email);
      } catch (error) {
        console.error('Error creating Convex user:', error);
      }
    }
  }
  
  else if (eventType === 'user.updated') {
    // User was updated - update Convex user if needed
    const { id, email_addresses, first_name, last_name } = evt.data;
    const email = email_addresses?.[0]?.email_address;
    const name = first_name && last_name ? `${first_name} ${last_name}` : first_name || last_name;
    
    if (email) {
      try {
        // Update user if they exist
        const existingUser = await convex.query(api.users.getUserByClerkId, { clerkUserId: id });
        if (existingUser) {
          // Update user details if needed
          console.log('User updated:', email);
        }
      } catch (error) {
        console.error('Error updating Convex user:', error);
      }
    }
  }
  
  else if (eventType === 'user.deleted') {
    // User was deleted - handle cleanup if needed
    const { id } = evt.data;
    console.log('User deleted:', id);
    // Note: You might want to mark the user as inactive rather than deleting
  }

  return new Response('', { status: 200 })
}

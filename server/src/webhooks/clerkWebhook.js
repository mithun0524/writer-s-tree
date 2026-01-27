import { Webhook } from 'svix';
import { createOrUpdateUser, deleteUser, updateLastLogin } from '../models/User.js';

export async function clerkWebhookHandler(req, res) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    throw new Error('CLERK_WEBHOOK_SECRET not set');
  }

  // Get the headers
  const svix_id = req.headers['svix-id'];
  const svix_timestamp = req.headers['svix-timestamp'];
  const svix_signature = req.headers['svix-signature'];

  // Verify webhook signature
  const wh = new Webhook(WEBHOOK_SECRET);
  let evt;

  try {
    evt = wh.verify(req.body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    });
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return res.status(400).json({ error: 'Invalid signature' });
  }

  // Handle different event types
  const eventType = evt.type;

  try {
    switch (eventType) {
      case 'user.created':
        await handleUserCreated(evt.data);
        break;

      case 'user.updated':
        await handleUserUpdated(evt.data);
        break;

      case 'user.deleted':
        await handleUserDeleted(evt.data);
        break;

      case 'session.created':
        await handleSessionCreated(evt.data);
        break;

      default:
        console.log(`Unhandled webhook event: ${eventType}`);
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    return res.status(500).json({ error: 'Webhook processing failed' });
  }
}

async function handleUserCreated(data) {
  const userId = data.id;
  const email = data.email_addresses[0]?.email_address;
  const fullName = `${data.first_name || ''} ${data.last_name || ''}`.trim();
  const profileImageUrl = data.profile_image_url;
  const clerkCreatedAt = new Date(data.created_at);

  console.log('Creating user:', userId, email);

  await createOrUpdateUser({
    clerkUserId: userId,
    email,
    fullName,
    profileImageUrl,
    clerkCreatedAt
  });

  console.log('User created successfully:', userId);
}

async function handleUserUpdated(data) {
  const userId = data.id;
  const email = data.email_addresses[0]?.email_address;
  const fullName = `${data.first_name || ''} ${data.last_name || ''}`.trim();
  const profileImageUrl = data.profile_image_url;

  console.log('Updating user:', userId);

  await createOrUpdateUser({
    clerkUserId: userId,
    email,
    fullName,
    profileImageUrl
  });

  console.log('User updated successfully:', userId);
}

async function handleUserDeleted(data) {
  const userId = data.id;

  console.log('Deleting user:', userId);

  await deleteUser(userId);

  console.log('User deleted successfully:', userId);
}

async function handleSessionCreated(data) {
  const userId = data.user_id;

  // Update last login timestamp
  await updateLastLogin(userId);

  console.log('Session created for user:', userId);
}
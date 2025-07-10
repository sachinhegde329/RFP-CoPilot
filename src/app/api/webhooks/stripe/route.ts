
import { type NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { headers as nextHeaders } from 'next/headers';
import { stripe } from '@/lib/stripe';
import { updateTenant } from '@/lib/tenants';
import type { Tenant } from '@/lib/tenant-types';

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = (await nextHeaders()).get('Stripe-Signature') as string;

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.error('Stripe webhook secret is not set.');
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (error: any) {
    return NextResponse.json({ error: `Webhook Error: ${error.message}` }, { status: 400 });
  }

  const session = event.data.object as Stripe.Checkout.Session;

  if (event.type === 'checkout.session.completed') {
    if (!session?.metadata?.tenantId || !session?.metadata?.plan) {
      console.error('Webhook Error: Missing metadata in session', session.id);
      return NextResponse.json({ error: 'Webhook Error: Missing metadata' }, { status: 400 });
    }

    const { tenantId, plan } = session.metadata;

    try {
      await updateTenant(tenantId, {
        plan: plan as Tenant['plan'],
        stripeCustomerId: session.customer as string,
        stripeSubscriptionId: session.subscription as string,
      });

      console.log(`Successfully updated plan for tenant ${tenantId} to ${plan}.`);

    } catch (error: any) {
      console.error(`Error updating tenant plan for tenant ${tenantId}:`, error);
      // Return 200 to Stripe to prevent retries for an error we can't recover from (e.g. bad tenantId)
      return NextResponse.json({ error: 'Error processing webhook internally.' }, { status: 200 });
    }
  }

  return NextResponse.json({ received: true });
}

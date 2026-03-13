import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type CheckoutEventType = Database['public']['Enums']['checkout_event_type'];

export async function trackCheckoutEvent(
  orderId: string,
  eventType: CheckoutEventType,
  metadata?: Record<string, unknown>,
  identifier?: string,
) {
  try {
    await supabase.from('checkout_events').insert([{
      order_id: orderId,
      event_type: eventType,
      metadata: metadata || {},
      identifier: identifier || null,
    }]);
  } catch (err) {
    console.error('Failed to track checkout event:', err);
  }
}

export async function updateLeadStatus(
  orderId: string,
  leadStatus: string,
  lastStep?: string,
  extraFields?: Record<string, unknown>,
) {
  try {
    await supabase.functions.invoke('update-checkout-status', {
      body: {
        action: 'update_lead_status',
        orderId,
        leadStatus,
        lastStep,
        extraFields,
      },
    });
  } catch (err) {
    console.error('Failed to update lead status:', err);
  }
}

export async function markPixCopied(orderId: string) {
  try {
    await supabase.functions.invoke('update-checkout-status', {
      body: { action: 'pix_copied', orderId },
    });
  } catch (err) {
    console.error('Failed to mark pix copied:', err);
  }
}

export async function markAbandoned(orderId: string) {
  try {
    await supabase.functions.invoke('update-checkout-status', {
      body: { action: 'abandoned', orderId },
    });
  } catch (err) {
    console.error('Failed to mark abandoned:', err);
  }
}

export async function markSupportContacted(orderId: string) {
  try {
    await supabase.functions.invoke('update-checkout-status', {
      body: { action: 'support_contacted', orderId },
    });
  } catch (err) {
    console.error('Failed to mark support contacted:', err);
  }
}

export function buildRecoveryWhatsAppUrl(
  whatsappNumber: string,
  phone: string,
  template: string,
  data: {
    product_name?: string;
    order_id?: string;
    amount?: number;
    customer_name?: string;
  },
): string {
  let msg = template;
  msg = msg.replace(/\{\{product_name\}\}/g, data.product_name || '');
  msg = msg.replace(/\{\{order_id\}\}/g, data.order_id || '');
  msg = msg.replace(/\{\{amount\}\}/g, data.amount ? `R$ ${data.amount.toFixed(2)}` : '');
  msg = msg.replace(/\{\{customer_name\}\}/g, data.customer_name || '');
  return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
}

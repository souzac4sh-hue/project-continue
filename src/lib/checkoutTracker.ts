import { supabase } from '@/integrations/supabase/client';
import type { Database, Json } from '@/integrations/supabase/types';

type CheckoutEventType = Database['public']['Enums']['checkout_event_type'];
type LeadStatus = Database['public']['Enums']['lead_status'];

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
  leadStatus: LeadStatus,
  lastStep?: string,
  extraFields?: Record<string, unknown>,
) {
  try {
    const updateData: Record<string, unknown> = {
      lead_status: leadStatus,
    };
    if (lastStep) updateData.last_step = lastStep;
    if (extraFields) Object.assign(updateData, extraFields);

    await supabase
      .from('pix_orders')
      .update(updateData)
      .eq('identifier', orderId);
  } catch (err) {
    console.error('Failed to update lead status:', err);
  }
}

export async function markPixCopied(orderId: string) {
  try {
    await supabase
      .from('pix_orders')
      .update({
        copied_pix: true,
        copied_at: new Date().toISOString(),
        lead_status: 'pix_copied' as LeadStatus,
        last_step: 'pix_copied',
      })
      .eq('identifier', orderId);
    await trackCheckoutEvent(orderId, 'pix_copied');
  } catch (err) {
    console.error('Failed to mark pix copied:', err);
  }
}

export async function markAbandoned(orderId: string) {
  try {
    await supabase
      .from('pix_orders')
      .update({
        lead_status: 'abandoned' as LeadStatus,
        abandoned_at: new Date().toISOString(),
        last_step: 'abandoned',
      })
      .eq('identifier', orderId);
    await trackCheckoutEvent(orderId, 'order_abandoned');
  } catch (err) {
    console.error('Failed to mark abandoned:', err);
  }
}

export async function markSupportContacted(orderId: string) {
  try {
    await supabase
      .from('pix_orders')
      .update({
        support_contacted_at: new Date().toISOString(),
        lead_status: 'support_requested' as LeadStatus,
        last_step: 'support_clicked',
      })
      .eq('identifier', orderId);
    await trackCheckoutEvent(orderId, 'support_clicked');
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

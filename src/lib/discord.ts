import "server-only";

import type { OrderStatus } from "@/lib/orderStatus";

type DiscordField = { name: string; value: string; inline?: boolean };

const NEW_USERS_WEBHOOK = process.env.DISCORD_NEW_USERS_WEBHOOK_URL;
const ORDERS_WEBHOOK = process.env.DISCORD_ORDERS_WEBHOOK_URL;

const ICONS = {
  guest: "👤",
  account: "✨",
  order: "🛍️",
  status: "🔄",
} as const;

function text(value: string | null | undefined, fallback = "-") {
  return value?.trim() || fallback;
}

async function send(webhook: string | undefined, content: string, fields: DiscordField[]) {
  if (!webhook) return;

  try {
    const response = await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "FUJRS Concierge",
        content,
        embeds: [
          {
            color: 0x8b6f47,
            fields,
            timestamp: new Date().toISOString(),
            footer: { text: "FUJRS activity" },
          },
        ],
      }),
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) console.error(`Discord webhook returned ${response.status}.`);
  } catch (error) {
    console.error("Discord webhook failed.", error);
  }
}

export function notifyGuestCreated(input: { id: string; createdAt: string }) {
  return send(NEW_USERS_WEBHOOK, `${ICONS.guest} New guest visitor`, [
    { name: "Visitor ID", value: `\`${input.id}\`` },
    {
      name: "Session started",
      value: `<t:${Math.floor(new Date(input.createdAt).getTime() / 1000)}:F>`,
    },
    { name: "Next step", value: "Browsing as a guest" },
  ]);
}

export function notifyAccountCreated(input: { id: string; name: string; email: string }) {
  return send(NEW_USERS_WEBHOOK, `${ICONS.account} New FUJRS account`, [
    { name: "Customer", value: text(input.name) },
    { name: "Email", value: text(input.email) },
    { name: "User ID", value: `\`${input.id}\`` },
  ]);
}

export function notifyOrderCreated(input: {
  id: string;
  orderNumber: string;
  customer: string;
  email: string;
  totalPaisa: number;
  itemCount: number;
  guest: boolean;
  referralCode: string | null;
}) {
  return send(ORDERS_WEBHOOK, `${ICONS.order} New order ${input.orderNumber}`, [
    { name: "Customer", value: `${text(input.customer)}${input.guest ? " (Guest)" : ""}` },
    { name: "Email", value: text(input.email) },
    { name: "Total", value: `PKR ${(input.totalPaisa / 100).toLocaleString()}`, inline: true },
    { name: "Items", value: String(input.itemCount), inline: true },
    { name: "Referral", value: text(input.referralCode, "Direct"), inline: true },
    { name: "Order ID", value: `\`${input.id}\`` },
  ]);
}

export function notifyOrderStatus(input: {
  id: string;
  orderNumber: string;
  from: OrderStatus;
  to: OrderStatus;
  changedBy: string;
}) {
  return send(ORDERS_WEBHOOK, `${ICONS.status} Order ${input.orderNumber} updated`, [
    { name: "Status", value: `${input.from} -> ${input.to}`, inline: true },
    { name: "Updated by", value: text(input.changedBy), inline: true },
    { name: "Order ID", value: `\`${input.id}\`` },
  ]);
}

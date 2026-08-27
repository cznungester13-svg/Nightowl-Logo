// ==========================================
// NIGHTOWL: EMERGENCY ESCALATION & ALERTS
// ==========================================
const URGENT_KEYWORDS = ["emergency", "urgent", "cancellation", "system down", "asap", "help"];

interface EmergencyAlert {
  isUrgent: boolean;
  customerEmail: string;
  message: string;
  timestamp: string;
}

export async function checkForEmergency(userMessage: string, customerEmail: string): Promise<EmergencyAlert> {
  const isUrgent = URGENT_KEYWORDS.some(keyword => 
    userMessage.toLowerCase().includes(keyword)
  );

  const alertData: EmergencyAlert = {
    isUrgent,
    customerEmail,
    message: userMessage,
    timestamp: new Date().toISOString()
  };

  if (isUrgent) {
    console.log(`🚨 URGENT ALERT TRIGGERED: ${customerEmail}`);
    await triggerEmergencyNotification(alertData);
  }

  return alertData;
}

async function triggerEmergencyNotification(alert: EmergencyAlert) {
  const WEBHOOK_URL = process.env.EMERGENCY_WEBHOOK_URL || "";

  if (!WEBHOOK_URL) {
    console.warn("⚠️ Alert triggered, but EMERGENCY_WEBHOOK_URL is missing in .env");
    return;
  }

  try {
    await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: `🚨 **URGENT NIGHTOWL ALERT**\n**From:** ${alert.customerEmail}\n**Message:** "${alert.message}"\n**Time:** ${alert.timestamp}`
      })
    });
    console.log("✅ Emergency push notification sent to Discord!");
  } catch (error) {
    console.error("❌ Failed to send Discord alert:", error);
  }
}

// ==========================================
// NIGHTOWL: CRM & CALENDAR WEBHOOK SYSTEM
// ==========================================

export interface LeadData {
  name: string;
  email: string;
  phone?: string;
  serviceRequested: string;
  preferredTime?: string;
}

export interface SlotCheckRequest {
  date: string; // Format: YYYY-MM-DD
  timeZone?: string;
}

// 1. CRM Lead Creation Webhook (HubSpot / GoHighLevel / Custom CRM)
export async function createCRMLead(lead: LeadData): Promise<boolean> {
  const CRM_WEBHOOK_URL = process.env.CRM_WEBHOOK_URL || "";

  if (!CRM_WEBHOOK_URL) {
    console.warn("⚠️ CRM Lead Creation: CRM_WEBHOOK_URL is missing in .env");
    return false;
  }

  try {
    const response = await fetch(CRM_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event: "lead.created",
        timestamp: new Date().toISOString(),
        payload: lead
      })
    });

    if (response.ok) {
      console.log(`✅ CRM Lead created successfully for ${lead.email}`);
      return true;
    }
    console.error("❌ CRM Lead creation failed:", await response.text());
    return false;
  } catch (error) {
    console.error("❌ Network error connecting to CRM Webhook:", error);
    return false;
  }
}

// 2. Real-Time Availability Checker (Cal.com / Google Calendar API)
export async function checkAvailableSlots(request: SlotCheckRequest): Promise<string[]> {
  const CALENDAR_API_URL = process.env.CALENDAR_API_URL || "";

  if (!CALENDAR_API_URL) {
    console.warn("⚠️ Slot Check: CALENDAR_API_URL is missing in .env. Returning default availability.");
    return ["09:00 AM", "01:00 PM", "03:30 PM"];
  }

  try {
    const response = await fetch(`${CALENDAR_API_URL}?date=${request.date}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" }
    });

    if (response.ok) {
      const data = await response.json();
      console.log(`✅ Retrieved available slots for ${request.date}`);
      return data.slots || [];
    }
    return [];
  } catch (error) {
    console.error("❌ Failed to fetch calendar slots:", error);
    return [];
  }
}
// ==========================================
// 1. HUMAN-IN-THE-LOOP "HOT HANDOFF" PROTOCOL
// ==========================================

export interface ChatMessage {
  sender: "customer" | "ai" | "system";
  text: string;
  timestamp: string;
}

export async function transferToHuman(
  chatHistory: ChatMessage[], 
  customerInfo: LeadData
): Promise<boolean> {
  const HANDOFF_WEBHOOK_URL = process.env.EMERGENCY_WEBHOOK_URL || "";

  // Compile full transcript into a bulleted summary
  const transcriptSummary = chatHistory
    .map(msg => `• [${msg.sender.toUpperCase()}]: ${msg.text}`)
    .join("\n");

  const handoffPayload = {
    content: `🔥 **HOT HANDOFF REQUIRED**\n` +
      `**Customer:** ${customerInfo.name} (${customerInfo.email}${customerInfo.phone ? ` | ${customerInfo.phone}` : ""})\n` +
      `**Service Requested:** ${customerInfo.serviceRequested}\n` +
      `**Recent Conversation Summary:**\n${transcriptSummary}\n` +
      `📞 **Direct Callback Link:** tel:${customerInfo.phone || "Not Provided"}`
  };

  if (!HANDOFF_WEBHOOK_URL) {
    console.warn("⚠️ Handoff Triggered, but EMERGENCY_WEBHOOK_URL is missing.");
    return false;
  }

  try {
    await fetch(HANDOFF_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(handoffPayload)
    });
    console.log(`✅ Hot Handoff alert sent successfully for ${customerInfo.email}`);
    return true;
  } catch (error) {
    console.error("❌ Failed to complete Hot Handoff:", error);
    return false;
  }
}

// ==========================================
// 2. OPERATIONAL GUARDRAILS & POLICY RULES
// ==========================================

export interface GuardrailConfig {
  maxDiscountPercentage: number;
  allowedServices: string[];
  operatingHours: { start: number; end: number }; // 24-hour clock (e.g., 8 to 18)
}

export const DEFAULT_GUARDRAILS: GuardrailConfig = {
  maxDiscountPercentage: 15,
  allowedServices: ["consultation", "onboarding", "support", "setup"],
  operatingHours: { start: 8, end: 20 }
};

export function validateOffer(
  discountRequested: number, 
  config: GuardrailConfig = DEFAULT_GUARDRAILS
): { approved: boolean; reason?: string } {
  if (discountRequested > config.maxDiscountPercentage) {
    return {
      approved: false,
      reason: `Requested discount of ${discountRequested}% exceeds maximum threshold of ${config.maxDiscountPercentage}%.`
    };
  }
  return { approved: true };
}

export function validateServiceRequest(
  service: string, 
  config: GuardrailConfig = DEFAULT_GUARDRAILS
): { approved: boolean; reason?: string } {
  const isAllowed = config.allowedServices.some(allowed => 
    service.toLowerCase().includes(allowed.toLowerCase())
  );

  if (!isAllowed) {
    return {
      approved: false,
      reason: `Service "${service}" is not in the approved service catalog.`
    };
  }
  return { approved: true };
}

// ==========================================
// 3. MULTI-CHANNEL INBOUND WEBHOOK (TWILIO)
// ==========================================

export interface TwilioInboundSMS {
  From: string;
  Body: string;
  MessageSid: string;
}

export async function processInboundSMS(payload: TwilioInboundSMS): Promise<string> {
  const customerPhone = payload.From;
  const userMessage = payload.Body;

  // Step A: Run through Emergency Escalation Filter
  const alertCheck = await checkForEmergency(userMessage, customerPhone);

  if (alertCheck.isUrgent) {
    // Trigger Hot Handoff immediately for urgent messages
    await transferToHuman(
      [{ sender: "customer", text: userMessage, timestamp: new Date().toISOString() }],
      { name: "SMS User", email: customerPhone, phone: customerPhone, serviceRequested: "Urgent SMS Support" }
    );

    return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Message>Your urgent message has been escalated directly to a team member. Someone will reach out shortly.</Message>
</Response>`;
  }

  // Step B: Standard Auto-Response for General Inquiries
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Message>Thanks for reaching out to NightOwl! We received your message and will update you shortly.</Message>
</Response>`;
}
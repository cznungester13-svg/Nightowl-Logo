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
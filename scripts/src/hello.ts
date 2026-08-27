// ==========================================
// EMERGENCY ESCALATION & ALERT SYSTEM
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

// Simulated Alert Channel (Webhook / Twilio / Email)
async function triggerEmergencyNotification(alert: EmergencyAlert) {
  // Replace this placeholder URL with your actual SMS/Webhook endpoint (e.g., Twilio or Make.com)
  const WEBHOOK_URL = process.env.EMERGENCY_WEBHOOK_URL || "";

  if (!WEBHOOK_URL) {
    console.warn("⚠️ Alert triggered, but EMERGENCY_WEBHOOK_URL is not set.");
    return;
  }

  try {
    await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: `🚨 URGENT NIGHTOWL ALERT\nFrom: ${alert.customerEmail}\nMessage: "${alert.message}"\nTime: ${alert.timestamp}`
      })
    });
    console.log("✅ Emergency alert sent successfully.");
  } catch (error) {
    console.error("❌ Failed to send emergency notification:", error);
  }
}
// ==========================================
// DEV TEST SUITE
// ==========================================
async function runDevTests() {
  console.log("--- Running NightOwl Escalation Tests ---");

  // Test Case 1: Normal Query (Should NOT trigger)
  const test1 = await checkForEmergency("What are your business hours?", "client1@example.com");
  console.log("Test 1 (Normal):", test1.isUrgent === false ? "PASSED ✅" : "FAILED ❌");

  // Test Case 2: Urgent Query (Should trigger)
  const test2 = await checkForEmergency("Our system down! Need urgent assistance asap.", "client2@example.com");
  console.log("Test 2 (Urgent):", test2.isUrgent === true ? "PASSED ✅" : "FAILED ❌");
}

// Uncomment to run automatically during execution:
// runDevTests();
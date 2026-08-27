console.log("Hello from @workspace/scripts");

// ==========================================
// EMERGENCY ESCALATION FILTER (FREE)
// ==========================================
const URGENT_KEYWORDS = ["emergency", "urgent", "cancellation", "system down", "asap", "help"];

function checkForEmergency(userMessage: string, customerEmail: string) {
  const isUrgent = URGENT_KEYWORDS.some(keyword => 
    userMessage.toLowerCase().includes(keyword)
  );

  if (isUrgent) {
    console.log(`🚨 URGENT ALERT: Triggered by ${customerEmail}`);
    return true;
  }
  return false;
}

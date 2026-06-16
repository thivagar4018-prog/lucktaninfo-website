/**
 * Zapier Webhook Configuration
 * ─────────────────────────────
 * Replace each YOUR_ZAPIER_WEBHOOK_URL with your actual Zapier webhook URL.
 * 
 * HOW TO GET THESE URLS:
 * 1. Go to https://zapier.com and create a new Zap
 * 2. Choose "Webhooks by Zapier" as the trigger
 * 3. Select "Catch Hook" as the event
 * 4. Copy the webhook URL and paste it below
 * 5. Test your Zap by submitting the form
 * 6. Add your action (e.g., Google Sheets, Email, Slack, etc.)
 */

const ZAPIER_WEBHOOKS = {
  // Contact form submissions (name, email, subject, message)
  contact: 'YOUR_ZAPIER_WEBHOOK_URL_FOR_CONTACT',

  // Course registration (name, email, phone, course)
  registration: 'YOUR_ZAPIER_WEBHOOK_URL_FOR_REGISTRATION',

  // Newsletter signups (email)
  newsletter: 'YOUR_ZAPIER_WEBHOOK_URL_FOR_NEWSLETTER'
};

/**
 * Send data to Zapier webhook
 * @param {string} webhookType - 'contact', 'registration', or 'newsletter'
 * @param {Object} data - The form data to send
 * @returns {Promise<boolean>} - true if sent successfully
 */
async function sendToZapier(webhookType, data) {
  const url = ZAPIER_WEBHOOKS[webhookType];

  if (!url || url.startsWith('YOUR_ZAPIER')) {
    console.warn(`⚠️ Zapier webhook for "${webhookType}" is not configured. Update js/zapier-config.js`);
    // Return true anyway so forms still "work" during development
    return true;
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      mode: 'no-cors', // Zapier webhooks don't support CORS
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ...data,
        timestamp: new Date().toISOString(),
        source: window.location.hostname
      })
    });

    // With no-cors mode, response is opaque — but data is sent
    return true;
  } catch (error) {
    console.error(`Zapier ${webhookType} webhook error:`, error);
    return false;
  }
}

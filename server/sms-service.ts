import twilio from 'twilio';

// Twilio configuration
const accountSid = process.env.TWILIO_ACCOUNT_SID || '';
const authToken = process.env.TWILIO_AUTH_TOKEN || '';
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER || '';

// Initialize Twilio client
const client = twilio(accountSid, authToken);

/**
 * Send OTP via SMS using Twilio
 */
export async function sendSMSOTP(phone: string, otp: string, purpose: string): Promise<void> {
      try {
            const purposeText = purpose === 'login' ? 'login' : purpose === 'register' ? 'registration' : 'password reset';

            const message = await client.messages.create({
                  body: `Your Digital Governance ${purposeText} OTP is: ${otp}. Valid for 10 minutes. Do not share this code.`,
                  from: twilioPhoneNumber,
                  to: phone,
            });

            console.log(`SMS OTP sent successfully to ${phone}. Message SID: ${message.sid}`);
      } catch (error: any) {
            console.error('Failed to send SMS OTP:', error);
            throw new Error(`Failed to send SMS: ${error.message || 'Unknown error'}`);
      }
}

/**
 * Verify Twilio configuration
 */
export async function verifyTwilioConfig(): Promise<boolean> {
      try {
            if (!accountSid || !authToken || !twilioPhoneNumber) {
                  console.warn('Twilio credentials not configured');
                  return false;
            }

            // Test the connection by fetching account details
            await client.api.accounts(accountSid).fetch();
            console.log('Twilio service is configured and ready');
            return true;
      } catch (error) {
            console.error('Twilio verification failed:', error);
            return false;
      }
}

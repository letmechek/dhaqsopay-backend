import { logger } from './logger.js';

let client;

const initClient = async () => {
  if (client) return client;
  const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN } = process.env;
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
    logger.warn('Twilio credentials not set. SMS will be logged instead of sent.');
    return null;
  }

  const twilioModule = await import('twilio');
  client = twilioModule.default
    ? twilioModule.default(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
    : twilioModule(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
  return client;
};

export const sendVerificationSMS = async ({ to, code }) => {
  const message = `Your DhaqsoPay verification code is ${code}`;
  const twilioClient = await initClient();
  if (!twilioClient) {
    logger.info(`SMS mock -> ${to}: ${message}`);
    return { sid: 'mock-sid' };
  }

  const { TWILIO_FROM_NUMBER } = process.env;
  return twilioClient.messages.create({
    from: TWILIO_FROM_NUMBER,
    to,
    body: message
  });
};

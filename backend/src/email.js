import nodemailer from 'nodemailer';

export async function sendSiteEmail({ to, subject, text }) {
  const user = process.env.SMTP_USER?.trim();
  const password = process.env.SMTP_APP_PASSWORD?.replace(/\s/g, '');
  if (!user || !password) {
    throw new Error('SMTP email settings are not configured.');
  }

  const transport = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: { user, pass: password },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  });

  try {
    await transport.sendMail({
      from: { name: 'Woodenart', address: user },
      to,
      subject,
      text,
    });
  } finally {
    transport.close();
  }
}

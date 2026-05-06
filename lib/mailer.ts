import nodemailer from 'nodemailer';

export async function sendOperativeEmail(config: {
  host: string;
  port: number;
  user: string;
  pass: string;
  to: string;
  subject: string;
  body: string;
  fromName: string;
}) {
  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: Number(config.port) === 465, // true for 465, false for other ports
    auth: {
      user: config.user,
      pass: config.pass,
    },
  });

  const info = await transporter.sendMail({
    from: `"${config.fromName}" <${config.user}>`,
    to: config.to,
    subject: config.subject,
    text: config.body,
    html: config.body.replace(/\n/g, '<br>'),
  });

  return info;
}

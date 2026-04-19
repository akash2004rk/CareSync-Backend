import nodemailer from 'nodemailer';

const sendEmail = async ({ email, subject, message, html }) => {
  // Use Ethereal for testing if no real credentials
  let testAccount = await nodemailer.createTestAccount();

  const transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });

  const mailOptions = {
    from: '"HMS Support" <support@hospital.com>',
    to: email,
    subject: subject,
    text: message,
    html: html,
  };

  const info = await transporter.sendMail(mailOptions);
  console.log('Message sent: %s', info.messageId);
  console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
};

export default sendEmail;

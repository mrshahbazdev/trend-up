const generate = (code, name = null) => {
  const greeting = name ? `Hi ${name}` : 'Hello';
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Email Verification</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .container {
      background-color: #ffffff;
      border-radius: 8px;
      padding: 40px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
    }
    .logo {
      font-size: 28px;
      font-weight: bold;
      color: #4F46E5;
      margin-bottom: 10px;
    }
    .code-container {
      background-color: #F3F4F6;
      border-radius: 8px;
      padding: 30px;
      text-align: center;
      margin: 30px 0;
    }
    .code {
      font-size: 36px;
      font-weight: bold;
      letter-spacing: 8px;
      color: #4F46E5;
      margin: 0;
    }
    .message {
      color: #6B7280;
      font-size: 14px;
      margin-top: 10px;
    }
    .footer {
      text-align: center;
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #E5E7EB;
      color: #9CA3AF;
      font-size: 12px;
    }
    .warning {
      background-color: #FEF3C7;
      border-left: 4px solid #F59E0B;
      padding: 12px;
      margin-top: 20px;
      border-radius: 4px;
      font-size: 14px;
      color: #92400E;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">TrendUpCoin</div>
      <p style="color: #6B7280; margin: 0;">Email Verification</p>
    </div>

    <p>${greeting},</p>
    <p>Thank you for signing up for TrendUpCoin. To complete your registration, please use the verification code below:</p>

    <div class="code-container">
      <div class="code">${code}</div>
      <p class="message">This code will expire in 15 minutes</p>
    </div>

    <p>Enter this code in the verification page to verify your email address.</p>

    <div class="warning">
      <strong>Security Notice:</strong> If you didn't request this code, please ignore this email. Never share your verification code with anyone.
    </div>

    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} TrendUpCoin. All rights reserved.</p>
      <p>This is an automated message, please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>
  `.trim();
};

module.exports = { generate };



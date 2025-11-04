const generate = (resetUrl, token, name = null) => {
  const greeting = name ? `Hi ${name}` : 'Hello';
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Reset</title>
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
    .button {
      display: inline-block;
      padding: 14px 28px;
      background-color: #4F46E5;
      color: #ffffff;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      margin: 20px 0;
    }
    .button:hover {
      background-color: #4338CA;
    }
    .button-container {
      text-align: center;
      margin: 30px 0;
    }
    .token-info {
      background-color: #F3F4F6;
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
      font-size: 14px;
      color: #6B7280;
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
      background-color: #FEE2E2;
      border-left: 4px solid #EF4444;
      padding: 12px;
      margin-top: 20px;
      border-radius: 4px;
      font-size: 14px;
      color: #991B1B;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">TrendUpCoin</div>
      <p style="color: #6B7280; margin: 0;">Password Reset Request</p>
    </div>

    <p>${greeting},</p>
    <p>We received a request to reset your password for your TrendUpCoin account.</p>

    <div class="button-container">
      <a href="${resetUrl}" class="button">Reset Password</a>
    </div>

    <p>If the button above doesn't work, copy and paste this link into your browser:</p>

    <div class="token-info">
      ${resetUrl}
    </div>

    <p style="color: #6B7280; font-size: 14px;">This link will expire in 1 hour for security reasons.</p>

    <div class="warning">
      <strong>Security Notice:</strong> If you didn't request this password reset, please ignore this email and consider changing your password immediately. Your account is safe and no changes have been made.
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



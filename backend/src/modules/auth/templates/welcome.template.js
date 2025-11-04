const generate = (name) => {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to TrendUpCoin</title>
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
      font-size: 32px;
      font-weight: bold;
      color: #4F46E5;
      margin-bottom: 10px;
    }
    .hero {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
      border-radius: 8px;
      text-align: center;
      margin: 20px 0;
    }
    .features {
      display: grid;
      gap: 15px;
      margin: 30px 0;
    }
    .feature {
      padding: 15px;
      background-color: #F9FAFB;
      border-radius: 6px;
      border-left: 3px solid #4F46E5;
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
    .button-container {
      text-align: center;
      margin: 30px 0;
    }
    .footer {
      text-align: center;
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #E5E7EB;
      color: #9CA3AF;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">TrendUpCoin</div>
    </div>

    <div class="hero">
      <h1 style="margin: 0; font-size: 28px;">Welcome, ${name}!</h1>
      <p style="margin: 10px 0 0 0; opacity: 0.9;">Your crypto social journey starts here</p>
    </div>

    <p>We're excited to have you join the TrendUpCoin community!</p>

    <p>You now have access to:</p>

    <div class="features">
      <div class="feature">
        <strong>Social Feed</strong> - Share your crypto insights and connect with traders
      </div>
      <div class="feature">
        <strong>Live Streaming</strong> - Broadcast your crypto analysis in real-time
      </div>
      <div class="feature">
        <strong>Voting System</strong> - Participate in community-driven decisions
      </div>
      <div class="feature">
        <strong>Wallet Integration</strong> - Connect your crypto wallet for seamless interaction
      </div>
    </div>

    <div class="button-container">
      <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/home" class="button">Explore TrendUpCoin</a>
    </div>

    <p style="color: #6B7280; font-size: 14px;">Need help getting started? Check out our guide or reach out to our community support.</p>

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



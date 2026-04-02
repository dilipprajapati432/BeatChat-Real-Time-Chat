export const getEmailTemplate = (title, otp) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: #f4f4f5;
      margin: 0;
      padding: 0;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      width: 100%;
      table-layout: fixed;
      background-color: #f4f4f5;
      padding: 40px 0;
    }
    .main {
      background-color: #ffffff;
      margin: 0 auto;
      width: 100%;
      max-width: 500px;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    }
    .header {
      background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
      padding: 32px 24px;
      text-align: center;
    }
    .header h1 {
      color: #ffffff;
      margin: 0;
      font-size: 26px;
      font-weight: 800;
      letter-spacing: -0.5px;
    }
    .content {
      padding: 40px 32px;
      text-align: center;
    }
    .content p {
      color: #374151;
      font-size: 16px;
      line-height: 24px;
      margin-top: 0;
      margin-bottom: 24px;
      font-weight: 500;
    }
    .otp-container {
      background-color: #f3f4f6;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      padding: 24px;
      margin-bottom: 24px;
    }
    .otp-code {
      font-family: 'Courier New', Courier, monospace;
      letter-spacing: 8px;
      font-size: 36px;
      font-weight: 800;
      color: #6366f1;
      margin: 0;
    }
    .warning {
      font-size: 13px;
      color: #6b7280;
      line-height: 1.5;
      margin: 0;
    }
    .footer {
      padding: 24px;
      text-align: center;
      background-color: #f9fafb;
      border-top: 1px solid #e5e7eb;
    }
    .footer p {
      color: #9ca3af;
      font-size: 12px;
      margin: 0;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="main">
      <div class="header">
        <h1>BeatChat</h1>
      </div>
      <div class="content">
        <p>${title}</p>
        <div class="otp-container">
          <p class="otp-code">${otp}</p>
        </div>
        <p class="warning">This verification code expires in 10 minutes.<br>If you didn't request this code, you can safely ignore this email.</p>
      </div>
      <div class="footer">
        <p>&copy; ${new Date().getFullYear()} BeatChat. All rights reserved.</p>
      </div>
    </div>
  </div>
</body>
</html>
`;

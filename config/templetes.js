export const getEmailTemplate = ({ subject, fullName, message, OTP ,token }) => {
    return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${subject}</title>
    <style>
      body {
        font-family: Arial, sans-serif;
        background-color: #f4f7fa;
        margin: 0;
        padding: 0;
        color: #333;
      }
      .container {
        max-width: 600px;
        margin: 20px auto;
        background: #fff;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        padding: 30px;
      }
      .header {
        text-align: center;
        padding-bottom: 20px;
        border-bottom: 1px solid #eee;
      }
      .header h1 {
        margin: 0;
        font-size: 22px;
        color: #2c3e50;
      }
      .content {
        padding: 20px 0;
        text-align: center;
      }
      .otp-box {
        display: inline-block;
        background: #f0f4ff;
        border: 1px dashed #3b82f6;
        padding: 15px 25px;
        border-radius: 6px;
        font-size: 24px;
        font-weight: bold;
        letter-spacing: 4px;
        color: #3b82f6;
        margin: 20px 0;
      }
        .token-box {
        display: inline-block;
        background: #f0f4ff;
        border: 1px dashed #3b82f6;
        padding: 15px 25px;
        border-radius: 6px;
        font-size: 10px;
        font-weight: bold;
        color: #3b82f6;
        margin: 5px 0;
      }
      .footer {
        margin-top: 30px;
        text-align: center;
        font-size: 12px;
        color: #888;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>${subject}</h1>
      </div>
      <div class="content">
        <p>Hi <b>${fullName}</b>,</p>
        <p>${message}</p>
        ${OTP ? `<div class="otp-box">${OTP}</div>` : ''}
        ${token ? `<div class="token-box">${token}</div>` : ''}
      </div>
      <div class="footer">
        <p>If you did not request this, please ignore this email.</p>
        <p>&copy; ${new Date().getFullYear()} Your Company. All rights reserved.</p>
      </div>
    </div>
  </body>
  </html>
  `;
};

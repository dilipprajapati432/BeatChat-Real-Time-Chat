import { google } from 'googleapis';
import dotenv from 'dotenv';
dotenv.config();

// Create OAuth2 Client overriding standard SMTP execution logic to bypass strict cloud firewalls
const oAuth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'https://developers.google.com/oauthplayground' // Ensure exact match
);

oAuth2Client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });

const sendEmail = async (to, subject, htmlContent, textContent) => {
    try {
        const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });

        // Encode subject line natively to bypass MIME block limitations on complex symbols/emojis
        const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString('base64')}?=`;

        // Manually build an RFC 2822 compliant email message structure for the API endpoint extraction
        const messageParts = [
            `From: "BeatChat App" <${process.env.SENDER_EMAIL}>`,
            `To: ${to}`,
            `Subject: ${utf8Subject}`,
            'MIME-Version: 1.0',
            'Content-Type: text/html; charset=utf-8',
            '',
            htmlContent || textContent
        ];
        
        const rawEmail = messageParts.join('\n');

        // Render API specifically strictly expects safe Base64 URL format (Not standard Base64)
        const encodedEmail = Buffer.from(rawEmail)
            .toString('base64')
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '');

        // Execute asynchronous push payload strictly over standard Port 443 
        const result = await gmail.users.messages.send({
            userId: 'me',
            requestBody: { raw: encodedEmail }
        });

        console.log("✅ Email sent flawlessly via Google API:", result.data.id);

    } catch (error) {
        console.error("❌ Email error details:", error.response?.data || error.message);
        const customError = new Error(`Failed to send email via Google REST: ${error.message}`);
        customError.statusCode = 500;
        throw customError;
    }
};

export default sendEmail;
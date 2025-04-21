const samuhLaganThankYou = (context) => `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #6a1b9a; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Thank You for Your Registration</h1>
        </div>
        <div class="content">
            <p>Dear ${context.userName},</p>
            <p>We have received your Samuh Lagan registration for the ceremony date: ${context.ceremonyDate}.</p>
            <p>Our team will review your application and get back to you shortly.</p>
            <p>You can check the status of your registration by logging into your account.</p>
            <p>Best regards,<br>Wadi Team</p>
        </div>
        <div class="footer">
            <p>This is an automated message. Please do not reply to this email.</p>
        </div>
    </div>
</body>
</html>
`;

const samuhLaganApproval = (context) => `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #6a1b9a; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Registration Approved</h1>
        </div>
        <div class="content">
            <p>Dear ${context.userName},</p>
            <p>We are pleased to inform you that your Samuh Lagan registration for ${context.ceremonyDate} has been approved.</p>
            <p>Please visit the Wadi office to complete your payment and finalize the booking.</p>
            <p>Office Hours: Monday to Friday, 9:00 AM to 5:00 PM</p>
            <p>Best regards,<br>Wadi Team</p>
        </div>
        <div class="footer">
            <p>This is an automated message. Please do not reply to this email.</p>
        </div>
    </div>
</body>
</html>
`;

const samuhLaganConfirmation = (context) => `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #6a1b9a; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Booking Confirmed</h1>
        </div>
        <div class="content">
            <p>Dear ${context.userName},</p>
            <p>Your Samuh Lagan booking for ${context.ceremonyDate} has been confirmed.</p>
            <p>We look forward to hosting your ceremony. If you have any questions, please don't hesitate to contact us.</p>
            <p>Best regards,<br>Wadi Team</p>
        </div>
        <div class="footer">
            <p>This is an automated message. Please do not reply to this email.</p>
        </div>
    </div>
</body>
</html>
`;

const samuhLaganRejection = (context) => `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #6a1b9a; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Registration Update</h1>
        </div>
        <div class="content">
            <p>Dear ${context.userName},</p>
            <p>We regret to inform you that your Samuh Lagan registration could not be processed at this time.</p>
            <p>Reason: ${context.reason}</p>
            <p>If you have any questions or would like to discuss this further, please contact our office.</p>
            <p>Best regards,<br>Wadi Team</p>
        </div>
        <div class="footer">
            <p>This is an automated message. Please do not reply to this email.</p>
        </div>
    </div>
</body>
</html>
`;

module.exports = {
    samuhLaganThankYou,
    samuhLaganApproval,
    samuhLaganConfirmation,
    samuhLaganRejection
}; 
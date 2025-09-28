/**
 * Google Apps Script for Handling Portfolio Contact Form Submissions
 *
 * This script runs when the linked Google Form is submitted.
 * It retrieves the submitted data and sends a confirmation email to the sender.
 *
 * Setup:
 * 1. Create a Google Form (Name, Email, Subject, Message fields).
 * 2. Link the form to a Google Sheet (Responses -> Create Spreadsheet).
 * 3. Open the Sheet, go to Extensions -> Apps Script.
 * 4. Paste this code into the editor, replacing the existing content.
 * 5. **IMPORTANT:** Update the `YOUR_NAME` and `YOUR_PORTFOLIO_NAME` placeholders below.
 * 6. Save the script (File -> Save).
 * 7. Set up the Trigger:
 * - Click the "Triggers" icon (looks like a clock) on the left sidebar.
 * - Click "+ Add Trigger".
 * - Configure the trigger as follows:
 * - Choose which function to run: `sendAutoReply`
 * - Choose which deployment should run: `Head`
 * - Select event source: `From spreadsheet`
 * - Select event type: `On form submit`
 * - Click "Save".
 * - You will likely need to authorize the script to access your spreadsheet data and send emails. Review the permissions and allow if you trust the script.
 */

function sendAutoReply(e) {
  // --- Configuration ---
  const YOUR_NAME = "Shuvam Banerji Seal"; // Replace with your name
  const YOUR_PORTFOLIO_NAME = "Your Portfolio Website"; // Replace with your website name or title
  // --- End Configuration ---

  // Check if the event object 'e' and 'namedValues' exist
  if (!e || !e.namedValues) {
    Logger.log("Event object or namedValues is undefined. Exiting.");
    // Optional: Send an error notification to yourself
    // MailApp.sendEmail("your-email@example.com", "Script Error", "Event object missing in sendAutoReply trigger.");
    return; // Exit if no data
  }

  // Get submitted data using the exact header names from your Google Sheet/Form
  // **Important:** Adjust these names if your form field titles are different!
  const timestamp = e.namedValues['Timestamp'] ? e.namedValues['Timestamp'][0] : 'N/A';
  const senderName = e.namedValues['Name'] ? e.namedValues['Name'][0] : 'N/A';
  const senderEmail = e.namedValues['Email'] ? e.namedValues['Email'][0] : 'N/A';
  const subject = e.namedValues['Subject'] ? e.namedValues['Subject'][0] : 'N/A';
  const message = e.namedValues['Message'] ? e.namedValues['Message'][0] : 'N/A';

  // Validate if senderEmail is available
  if (!senderEmail || senderEmail === 'N/A' || !isValidEmail(senderEmail)) {
    Logger.log("Invalid or missing sender email address. Cannot send auto-reply.");
    return; // Don't proceed if email is invalid
  }

  // --- Email Content ---
  const emailSubject = `Thank You for Contacting ${YOUR_NAME}`;
  const emailBody = `
Hello ${senderName},

Thank you for reaching out through ${YOUR_PORTFOLIO_NAME}!

I have received your message regarding "${subject}" and will get back to you as soon as possible.

For your reference, here's the message you sent:
--------------------------------
${message}
--------------------------------

Best regards,
${YOUR_NAME}
`;

  const emailPlainBody = `Hello ${senderName},\n\nThank you for reaching out through ${YOUR_PORTFOLIO_NAME}!\n\nI have received your message regarding "${subject}" and will get back to you as soon as possible.\n\nFor your reference, here's the message you sent:\n--------------------------------\n${message}\n--------------------------------\n\nBest regards,\n${YOUR_NAME}`;


  // --- Send Email ---
  try {
    MailApp.sendEmail({
      to: senderEmail,
      subject: emailSubject,
      body: emailPlainBody, // Use plain text body for better compatibility
      htmlBody: emailBody,   // Include HTML version
      replyTo: "sbs22ms076@iiserkol.ac.in", // Optional: Set your email as reply-to
      name: YOUR_NAME // Optional: Set the sender name
    });
    Logger.log(`Auto-reply sent successfully to ${senderEmail}`);
  } catch (error) {
    Logger.log(`Error sending email to ${senderEmail}: ${error}`);
    // Optional: Send an error notification to yourself
    // MailApp.sendEmail("your-email@example.com", "Auto-Reply Error", `Failed to send email to ${senderEmail}. Error: ${error}`);
  }
}

// Basic email validation helper function
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

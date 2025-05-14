import nodemailer, { Transporter, SendMailOptions, SentMessageInfo } from 'nodemailer';
import { JobNotificationAnnotationState, JobNotificationAnnotationUpdate } from '../types';

export async function sendNotification(state: JobNotificationAnnotationState):
    Promise<Partial<JobNotificationAnnotationUpdate>> {

    const { email, bestEmployee } = state

    const transporter: Transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD,
        }
    });

    // Email options
    const mailOptions: SendMailOptions = {
        from: process.env.EMAIL_USER,
        to: bestEmployee!.email,
        subject: email.subject,
        text: email.content,
    };

    const result: string = await new Promise((resolve, reject) => {
        // Send the email
        transporter.sendMail(mailOptions, (error: Error | null, info: SentMessageInfo) => {
            if (error) {
                reject("Error sending email: " + error.message)
            } else {
                resolve("Email sent successfully: " + info.response)
            }
        });
    })
    console.log("bbb0", JSON.stringify(state.bestEmployee, null, 2))
    console.log("eeeee", JSON.stringify(mailOptions, null, 2))
    return {
        emailSent: result
    }
}
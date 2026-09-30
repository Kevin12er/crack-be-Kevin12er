import { Injectable } from '@nestjs/common';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
    private readonly resend: Resend;

    constructor() {
        this.resend = new Resend(process.env.RESEND_API_KEY);
    }

    async sendVerificationEmail(email: string, verificationUrl: string) {
        return this.resend.emails.send({
            from: 'LearnBridge <onboarding@resend.dev>',
            to: email,
            subject: 'Verifikasi Email LearnBridge',
            html: `
            <h2>Selamat datang di LearnBridge</h2>
            <p>Silahkan klik tombol dibawah untuk memverifikasi email</p>
            <p>
                <a href="${verificationUrl}">
                Verifikasi Email
                </a>
            </p>
            <p>Link ini digunakan untuk mengaktifkan akun LearnBridge kamu</p>
            `,
        });
    }
}

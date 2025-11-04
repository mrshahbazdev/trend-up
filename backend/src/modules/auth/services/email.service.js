const nodemailer = require('nodemailer');
const config = require('../../../config');
const { logger } = require('../../../core/utils/logger');

class EmailService {
  constructor() {
    this.transporter = null;
    this.initTransporter();
  }

  initTransporter() {
    try {
      this.transporter = nodemailer.createTransport({
        host: config.email.smtp.host,
        port: config.email.smtp.port,
        secure: config.email.smtp.secure,
        service: 'gmail',
        auth: {
          user: config.email.smtp.auth.user,
          pass: config.email.smtp.auth.pass,
        },
      });

      logger.info('Email transporter initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize email transporter:', {
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  async verifyConnection() {
    try {
      await this.transporter.verify();
      logger.info('Email server connection verified');
      return true;
    } catch (error) {
      logger.error('Email server connection failed:', {
        error: error.message,
        stack: error.stack,
      });
      return false;
    }
  }

  async sendEmail({ to, subject, html, text }) {
    try {
      const mailOptions = {
        from: `${config.email.from.name} <${config.email.from.email}>`,
        to,
        subject,
        html,
        text: text || this.stripHtml(html),
      };

      const result = await this.transporter.sendMail(mailOptions);

      logger.info(`Email sent successfully to ${to}`, {
        messageId: result.messageId,
        subject,
      });

      return {
        success: true,
        messageId: result.messageId,
      };
    } catch (error) {
      logger.error(`Failed to send email to ${to}:`, {
        error: error.message,
        stack: error.stack,
        subject,
      });
      throw error;
    }
  }

  async sendVerificationEmail(email, code, name = null) {
    const template = require('../templates/verification-code.template');
    const html = template.generate(code, name);

    return await this.sendEmail({
      to: email,
      subject: 'Verify Your Email - TrendUpCoin',
      html,
    });
  }

  async sendPasswordResetEmail(email, token, name = null) {
    const template = require('../templates/password-reset.template');
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${token}`;
    const html = template.generate(resetUrl, token, name);

    return await this.sendEmail({
      to: email,
      subject: 'Reset Your Password - TrendUpCoin',
      html,
    });
  }

  async sendWelcomeEmail(email, name) {
    const template = require('../templates/welcome.template');
    const html = template.generate(name);

    return await this.sendEmail({
      to: email,
      subject: 'Welcome to TrendUpCoin!',
      html,
    });
  }

  stripHtml(html) {
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }
}

const emailService = new EmailService();

module.exports = emailService;

import nodemailer from "nodemailer";

export class EmailService {
  private transporter: any;
  private from: string;
  private appUrl: string;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: Number(process.env.SMTP_PORT) || 465,
      secure: process.env.SMTP_SECURE === "true" || true,
      auth: {
        user: process.env.SMTP_USER || "barbergagik@gmail.com",
        pass: process.env.SMTP_PASS || "",
      },
    });
    this.from = process.env.SMTP_FROM || '"Gagik Ghambaryan" <barbergagik@gmail.com>';
    this.appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://barbergagik.com";
  }

  private getPremiumTemplate(title: string, subtitle: string, contentHtml: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="color-scheme" content="light dark">
        <meta name="supported-color-schemes" content="light dark">
        <title>${title}</title>
        <style>
          :root {
            color-scheme: light dark;
            supported-color-schemes: light dark;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            background-color: #f4f4f5;
            color: #18181b;
            margin: 0;
            padding: 40px 20px;
          }
          .container {
            background-color: #ffffff;
            border: 1px solid rgba(0,0,0,0.08);
            border-radius: 24px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.05);
            overflow: hidden;
            max-width: 600px;
            margin: 0 auto;
          }
          .header {
            padding: 40px 20px 20px 20px;
            text-align: center;
          }
          .header h1 {
            color: #c5a880;
            font-size: 16px;
            text-transform: uppercase;
            letter-spacing: 5px;
            margin: 0 0 5px 0;
            font-weight: 600;
          }
          .header p {
            color: #71717a;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 3px;
            margin: 0;
          }
          .content {
            padding: 10px 40px 40px 40px;
          }
          .content h2 {
            color: #18181b;
            font-size: 26px;
            font-weight: 300;
            margin: 0 0 10px 0;
            text-align: center;
          }
          .content p.subtitle {
            color: #c5a880;
            font-size: 14px;
            text-align: center;
            margin: 0 0 30px 0;
            font-style: italic;
          }
          .footer {
            padding: 25px 40px;
            background-color: rgba(0,0,0,0.03);
            border-top: 1px solid rgba(0,0,0,0.05);
            text-align: center;
          }
          .footer p {
            color: #71717a;
            font-size: 11px;
            margin: 0;
            letter-spacing: 1px;
          }
          
          /* Dark Mode */
          @media (prefers-color-scheme: dark) {
            body {
              background-color: #000000 !important;
              color: #ffffff !important;
            }
            .container {
              background-color: #141416 !important;
              border: 1px solid rgba(255,255,255,0.1) !important;
              box-shadow: 0 20px 40px rgba(0,0,0,0.8) !important;
            }
            .header p {
              color: #8e8e9c !important;
            }
            .content h2 {
              color: #ffffff !important;
            }
            .footer {
              background-color: rgba(255,255,255,0.03) !important;
              border-top: 1px solid rgba(255,255,255,0.05) !important;
            }
            .footer p {
              color: #8e8e9c !important;
            }
            .card {
              background-color: rgba(197, 168, 128, 0.05) !important;
            }
            .card td {
              border-bottom: 1px solid rgba(255,255,255,0.05) !important;
            }
            .card-text-light {
              color: #8e8e9c !important;
            }
            .card-text-dark {
              color: #ffffff !important;
            }
          }
        </style>
      </head>
      <body>
        <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" class="container">
          <tr>
            <td class="header">
              <h1 style="color: #c5a880;">Gagik Ghambaryan</h1>
              <p>Bespoke Barber</p>
            </td>
          </tr>
          <tr>
            <td class="content">
              <h2>${title}</h2>
              <p class="subtitle">${subtitle}</p>
              ${contentHtml}
            </td>
          </tr>
          <tr>
            <td class="footer">
              <p>&copy; ${new Date().getFullYear()} BARBER GAGIK GHAMBARYAN.<br>ALL RIGHTS RESERVED.</p>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;
  }

  async sendConfirmation(to: string, bookingDetails: any) {
    if (!to.includes("@")) return false;

    const { date, startTime, endTime, services, locale, bookingNumber } = bookingDetails;
    
    const i18n = {
      hy: {
        title: "Ամրագրումը Հաստատված է",
        subtitle: "Սպասում ենք Ձեզ նշված ժամին",
        date: "Ամսաթիվ",
        time: "Ժամ",
        service: "Ծառայություն",
        ref: "Ամրագրման համար"
      },
      ru: {
        title: "Запись Подтверждена",
        subtitle: "Ждем вас в назначенное время",
        date: "Дата",
        time: "Время",
        service: "Услуга",
        ref: "Номер записи"
      },
      en: {
        title: "Booking Confirmed",
        subtitle: "We look forward to seeing you",
        date: "Date",
        time: "Time",
        service: "Service",
        ref: "Booking Ref"
      }
    };

    const dict = i18n[locale as keyof typeof i18n] || i18n.hy;

    const contentHtml = `
      <div class="card" style="background-color: rgba(197, 168, 128, 0.1); border: 1px solid rgba(197, 168, 128, 0.3); border-radius: 12px; padding: 25px; margin: 0 auto; width: 100%; box-sizing: border-box;">
        <table width="100%" cellpadding="0" cellspacing="0" style="margin: 0; padding: 0;">
          <tr>
            <td style="padding-bottom: 15px; border-bottom: 1px solid rgba(0,0,0,0.05);">
              <span class="card-text-light" style="font-size: 11px; color: #71717a; text-transform: uppercase; letter-spacing: 1px;">${dict.date}</span><br>
              <span class="card-text-dark" style="font-size: 16px; color: #18181b; font-weight: 500;">${date}</span>
            </td>
          </tr>
          <tr>
            <td style="padding: 15px 0; border-bottom: 1px solid rgba(0,0,0,0.05);">
              <span class="card-text-light" style="font-size: 11px; color: #71717a; text-transform: uppercase; letter-spacing: 1px;">${dict.time}</span><br>
              <span style="font-size: 18px; color: #c5a880; font-weight: 600;">${startTime} - ${endTime}</span>
            </td>
          </tr>
          <tr>
            <td style="padding: 15px 0; border-bottom: 1px solid rgba(0,0,0,0.05);">
              <span class="card-text-light" style="font-size: 11px; color: #71717a; text-transform: uppercase; letter-spacing: 1px;">${dict.service}</span><br>
              <span class="card-text-dark" style="font-size: 15px; color: #18181b; line-height: 1.5;">${services}</span>
            </td>
          </tr>
          <tr>
            <td style="padding-top: 15px;">
              <span class="card-text-light" style="font-size: 11px; color: #71717a; text-transform: uppercase; letter-spacing: 1px;">${dict.ref}</span><br>
              <span class="card-text-dark" style="font-size: 13px; color: #18181b; font-family: monospace;">${bookingNumber}</span>
            </td>
          </tr>
        </table>
      </div>
    `;

    const html = this.getPremiumTemplate(dict.title, dict.subtitle, contentHtml);

    try {
      await this.transporter.sendMail({
        from: this.from,
        to,
        subject: dict.title + " | Gagik Ghambaryan",
        text: `${dict.title}\n\n${dict.subtitle}\n\n${dict.date}: ${date}\n${dict.time}: ${startTime} - ${endTime}\n${dict.service}: ${services}\n${dict.ref}: ${bookingNumber}`,
        html,
      });
      return true;
    } catch (e) {
      console.error("Confirmation email error:", e);
      return false;
    }
  }

  async sendReminder(to: string, bookingDetails: any) {
    if (!to.includes("@")) return false;

    const { startTime, locale } = bookingDetails;
    
    const i18n = {
      hy: {
        title: "Հիշեցում",
        subtitle: `Ձեր այցին մնացել է ~20 րոպե (${startTime})`,
        text: "Խնդրում ենք չուշանալ, որպեսզի մենք կարողանանք լիարժեք սպասարկել Ձեզ:"
      },
      ru: {
        title: "Напоминание",
        subtitle: `До вашего визита осталось ~20 минут (${startTime})`,
        text: "Пожалуйста, не опаздывайте, чтобы мы могли предоставить вам полноценную услугу."
      },
      en: {
        title: "Reminder",
        subtitle: `Your appointment is in ~20 mins (${startTime})`,
        text: "Please arrive on time so we can provide you with the full experience."
      }
    };

    const dict = i18n[locale as keyof typeof i18n] || i18n.hy;

    const contentHtml = `
      <div style="background: rgba(197, 168, 128, 0.05); border-radius: 16px; padding: 25px; border: 1px solid rgba(197, 168, 128, 0.2); text-align: center;">
        <p style="font-size: 16px; color: #ffffff; line-height: 1.6; margin: 0;">
          ${dict.text}
        </p>
      </div>
    `;

    const html = this.getPremiumTemplate(dict.title, dict.subtitle, contentHtml);

    try {
      await this.transporter.sendMail({
        from: this.from,
        to,
        subject: dict.title + " | Gagik Ghambaryan",
        html,
      });
      return true;
    } catch (e) {
      console.error("Reminder email error:", e);
      return false;
    }
  }

  async sendVerification(to: string, code: string, locale: string = "hy") {
    if (!to.includes("@")) return false;
    
    const i18n = {
      hy: {
        title: "Հաստատման Կոդ",
        subtitle: "Ձեր գրանցման հաստատման կոդը",
        text: "Խնդրում ենք մուտքագրել այս կոդը հաստատելու համար (վավեր է 10 րոպե)."
      },
      ru: {
        title: "Код Подтверждения",
        subtitle: "Код для подтверждения вашей записи",
        text: "Пожалуйста, введите этот код для подтверждения (действителен 10 минут)."
      },
      en: {
        title: "Verification Code",
        subtitle: "Your booking verification code",
        text: "Please enter this code to confirm your appointment (valid for 10 minutes)."
      }
    };

    const dict = i18n[locale as keyof typeof i18n] || i18n.hy;

    const contentHtml = `
      <div style="background-color: rgba(197, 168, 128, 0.1); border: 1px solid rgba(197, 168, 128, 0.3); border-radius: 12px; padding: 25px; margin: 0 auto; width: fit-content; text-align: center;">
        <p class="card-text-light" style="font-size: 14px; line-height: 1.6; margin: 0 0 15px 0; color: #71717a;">${dict.text}</p>
        <span style="font-size: 36px; font-weight: 700; color: #c5a880; letter-spacing: 12px; font-family: monospace;">${code}</span>
      </div>
    `;

    const html = this.getPremiumTemplate(dict.title, dict.subtitle, contentHtml);

    try {
      await this.transporter.sendMail({
        from: this.from,
        to,
        subject: dict.title + " | Gagik Ghambaryan",
        text: `${dict.title}\n\n${dict.subtitle}\n\n${dict.text}\n\nCODE: ${code}`,
        html,
      });
      return true;
    } catch (e) {
      console.error("Verification email error:", e);
      return false;
    }
  }
}

export const emailService = new EmailService();

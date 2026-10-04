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
    const portraitUrl = `${this.appUrl}/images/gagik-barber.jpg`;

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${title}</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #000000; color: #ffffff; margin: 0; padding: 40px 20px;">
        <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 0 auto;">
          <tr>
            <td align="center" style="padding-bottom: 30px;">
              <!-- Premium Light Glass Container -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background: linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%); border: 1px solid rgba(255,255,255,0.1); border-radius: 24px; box-shadow: 0 30px 60px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.1); overflow: hidden;">
                
                <!-- Header with Portrait -->
                <tr>
                  <td align="center" style="position: relative; padding: 40px 20px 20px 20px;">
                    <div style="background: linear-gradient(180deg, rgba(197, 168, 128, 0.15) 0%, rgba(0,0,0,0) 100%); position: absolute; top: 0; left: 0; right: 0; height: 150px; z-index: 1;"></div>
                    <img src="${portraitUrl}" alt="Gagik Ghambaryan" style="width: 100px; height: 100px; border-radius: 50%; object-fit: cover; border: 2px solid #c5a880; box-shadow: 0 0 30px rgba(197, 168, 128, 0.3); position: relative; z-index: 2;" />
                    <h1 style="color: #c5a880; font-size: 16px; text-transform: uppercase; letter-spacing: 5px; margin: 25px 0 5px 0; font-weight: 600; position: relative; z-index: 2;">Gagik Ghambaryan</h1>
                    <p style="color: #8e8e9c; font-size: 11px; text-transform: uppercase; letter-spacing: 3px; margin: 0; position: relative; z-index: 2;">Bespoke Barber</p>
                  </td>
                </tr>

                <!-- Content Area -->
                <tr>
                  <td style="padding: 10px 40px 40px 40px;">
                    <h2 style="color: #ffffff; font-size: 26px; font-weight: 300; margin: 0 0 10px 0; text-align: center;">${title}</h2>
                    <p style="color: #c5a880; font-size: 14px; text-align: center; margin: 0 0 30px 0; font-style: italic;">${subtitle}</p>
                    
                    ${contentHtml}
                    
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td align="center" style="padding: 25px 40px; background: rgba(0,0,0,0.3); border-top: 1px solid rgba(255,255,255,0.05);">
                    <p style="color: #8e8e9c; font-size: 11px; margin: 0; letter-spacing: 1px;">&copy; ${new Date().getFullYear()} BARBER GAGIK GHAMBARYAN.<br>ALL RIGHTS RESERVED.</p>
                  </td>
                </tr>
              </table>
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

    const contentHtml = \`
      <div style="background: rgba(0,0,0,0.2); border-radius: 16px; padding: 25px; border: 1px solid rgba(197, 168, 128, 0.15);">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding-bottom: 15px; border-bottom: 1px solid rgba(255,255,255,0.05);">
              <span style="font-size: 11px; color: #8e8e9c; text-transform: uppercase; letter-spacing: 1px;">\${dict.date}</span><br>
              <span style="font-size: 16px; color: #ffffff; font-weight: 500;">\${date}</span>
            </td>
          </tr>
          <tr>
            <td style="padding: 15px 0; border-bottom: 1px solid rgba(255,255,255,0.05);">
              <span style="font-size: 11px; color: #8e8e9c; text-transform: uppercase; letter-spacing: 1px;">\${dict.time}</span><br>
              <span style="font-size: 18px; color: #c5a880; font-weight: 600;">\${startTime} - \${endTime}</span>
            </td>
          </tr>
          <tr>
            <td style="padding: 15px 0; border-bottom: 1px solid rgba(255,255,255,0.05);">
              <span style="font-size: 11px; color: #8e8e9c; text-transform: uppercase; letter-spacing: 1px;">\${dict.service}</span><br>
              <span style="font-size: 15px; color: #ffffff; line-height: 1.5;">\${services}</span>
            </td>
          </tr>
          <tr>
            <td style="padding-top: 15px;">
              <span style="font-size: 11px; color: #8e8e9c; text-transform: uppercase; letter-spacing: 1px;">\${dict.ref}</span><br>
              <span style="font-size: 13px; color: #ffffff; font-family: monospace;">\${bookingNumber}</span>
            </td>
          </tr>
        </table>
      </div>
    \`;

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
        subtitle: \`Ձեր այցին մնացել է ~20 րոպե (\${startTime})\`,
        text: "Խնդրում ենք չուշանալ, որպեսզի մենք կարողանանք լիարժեք սպասարկել Ձեզ:"
      },
      ru: {
        title: "Напоминание",
        subtitle: \`До вашего визита осталось ~20 минут (\${startTime})\`,
        text: "Пожалуйста, не опаздывайте, чтобы мы могли предоставить вам полноценную услугу."
      },
      en: {
        title: "Reminder",
        subtitle: \`Your appointment is in ~20 mins (\${startTime})\`,
        text: "Please arrive on time so we can provide you with the full experience."
      }
    };

    const dict = i18n[locale as keyof typeof i18n] || i18n.hy;

    const contentHtml = \`
      <div style="background: rgba(197, 168, 128, 0.05); border-radius: 16px; padding: 25px; border: 1px solid rgba(197, 168, 128, 0.2); text-align: center;">
        <p style="font-size: 16px; color: #ffffff; line-height: 1.6; margin: 0;">
          \${dict.text}
        </p>
      </div>
    \`;

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
}

export const emailService = new EmailService();

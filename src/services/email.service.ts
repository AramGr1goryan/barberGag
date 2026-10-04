import nodemailer from "nodemailer";

const GOLD = "#1e3a5f"; // navy accent (light); silver in dark mode

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

  /**
   * Glassmorphism email shell. Light/dark follows the device theme.
   * Only two tones: neutral (white/black glass) + gold accent.
   */
  private getPremiumTemplate(title: string, subtitle: string, contentHtml: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="color-scheme" content="only light">
        <meta name="supported-color-schemes" content="only light">
        <title>${title}</title>
        <style>
          :root { color-scheme: only light; supported-color-schemes: only light; }
          body {
            margin: 0; padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            background-color: #eef2f7;
            color: #18181b;
            -webkit-font-smoothing: antialiased;
          }
          .bg {
            background-color: #eef2f7;
            background-image: radial-gradient(circle at 15% 0%, rgba(30,58,95,0.10) 0%, rgba(0,0,0,0) 45%),
                              radial-gradient(circle at 90% 100%, rgba(30,58,95,0.08) 0%, rgba(0,0,0,0) 50%);
            padding: 48px 16px;
          }
          .glass {
            max-width: 520px; margin: 0 auto;
            background-color: #ffffff;
            background-image: linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(248,250,252,0.94) 100%);
            border: 1px solid rgba(15,23,42,0.08);
            border-radius: 28px;
            -webkit-backdrop-filter: blur(24px); backdrop-filter: blur(24px);
            overflow: hidden;
          }
          .tile {
            background-color: #f8fafc;
            background-image: linear-gradient(#f8fafc, #f8fafc);
            border: 1px solid rgba(15,23,42,0.08);
            border-radius: 18px;
          }
          .muted { color: #475569; }
          .strong { color: #0f172a; }
          .line { border-bottom: 1px solid rgba(24,24,27,0.06); }
          .divider { height: 1px; background-image: linear-gradient(90deg, rgba(0,0,0,0), ${GOLD}, rgba(0,0,0,0)); }
          .btn { background-color: #1e3a5f; color: #ffffff !important; }


          @media (max-width: 480px) {
            .pad { padding-left: 24px !important; padding-right: 24px !important; }
          }
        </style>
      </head>
      <body>
        <div class="bg">
          <table role="presentation" align="center" border="0" cellpadding="0" cellspacing="0" width="100%" class="glass">
            <tr>
              <td class="pad" style="padding: 44px 40px 8px 40px; text-align: center;">
                <div class="accent" style="display: inline-block; width: 46px; height: 46px; line-height: 46px; border-radius: 50%; border: 1px solid ${GOLD}; color: ${GOLD}; font-size: 18px; font-family: Georgia, 'Times New Roman', serif;">G</div>
                <p class="accent" style="margin: 16px 0 2px 0; color: ${GOLD}; font-size: 12px; letter-spacing: 6px; text-transform: uppercase; font-weight: 600;">Gagik Ghambaryan</p>
                <p class="muted" style="margin: 0; font-size: 10px; letter-spacing: 4px; text-transform: uppercase;">Bespoke Barber</p>
              </td>
            </tr>
            <tr>
              <td class="pad" style="padding: 28px 40px 0 40px;"><div class="divider" style="height: 1px; font-size: 0; line-height: 0;">&nbsp;</div></td>
            </tr>
            <tr>
              <td class="pad" style="padding: 28px 40px 40px 40px;">
                <h1 class="strong" style="margin: 0 0 8px 0; font-size: 24px; font-weight: 300; text-align: center; letter-spacing: 0.5px;">${title}</h1>
                <p class="muted" style="margin: 0 0 28px 0; font-size: 14px; text-align: center;">${subtitle}</p>
                ${contentHtml}
              </td>
            </tr>
            <tr>
              <td class="pad" style="padding: 0 40px 32px 40px; text-align: center;">
                <p class="muted" style="margin: 0; font-size: 10px; letter-spacing: 2px; text-transform: uppercase;">&copy; ${new Date().getFullYear()} Barber Gagik Ghambaryan</p>
              </td>
            </tr>
          </table>
        </div>
      </body>
      </html>
    `;
  }

  private row(label: string, value: string, opts: { accent?: boolean; mono?: boolean; last?: boolean } = {}) {
    const valueStyle = opts.accent
      ? `font-size: 18px; color: ${GOLD}; font-weight: 600;`
      : `font-size: 15px; line-height: 1.5; font-weight: 500;${opts.mono ? " font-family: monospace; letter-spacing: 1px;" : ""}`;
    return `
      <tr>
        <td class="${opts.last ? "" : "line"}" style="padding: 14px 0;">
          <span class="muted" style="font-size: 10px; text-transform: uppercase; letter-spacing: 2px;">${label}</span><br>
          <span class="${opts.accent ? "accent" : "strong"}" style="${valueStyle}">${value}</span>
        </td>
      </tr>`;
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
        ref: "Ամրագրման համար",
        cta: "Այցելել կայք",
      },
      ru: {
        title: "Запись Подтверждена",
        subtitle: "Ждем вас в назначенное время",
        date: "Дата",
        time: "Время",
        service: "Услуга",
        ref: "Номер записи",
        cta: "Перейти на сайт",
      },
      en: {
        title: "Booking Confirmed",
        subtitle: "We look forward to seeing you",
        date: "Date",
        time: "Time",
        service: "Service",
        ref: "Booking Ref",
        cta: "Visit website",
      },
    };

    const dict = i18n[locale as keyof typeof i18n] || i18n.hy;

    const contentHtml = `
      <div class="tile" style="padding: 8px 24px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          ${this.row(dict.date, date)}
          ${this.row(dict.time, `${startTime} – ${endTime}`, { accent: true })}
          ${this.row(dict.service, services)}
          ${this.row(dict.ref, bookingNumber, { mono: true, last: true })}
        </table>
      </div>
      <div style="text-align: center; margin-top: 28px;">
        <a href="${this.appUrl}" class="btn" style="display: inline-block; padding: 13px 32px; border-radius: 999px; font-size: 12px; letter-spacing: 2px; text-transform: uppercase; text-decoration: none; font-weight: 600; background-color: #1e3a5f; color: #ffffff;">${dict.cta}</a>
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

  
  async sendReminder(to: string, bookingDetails: any, type: "2h" | "1h" | "20m" = "20m") {
    if (!to.includes("@")) return false;

    const { startTime, locale } = bookingDetails;

    const templates = {
      hy: {
        "2h": { subtitle: `Ձեր այցին մնացել է ~2 ժամ (${startTime})`, text: `Խնդրում ենք չուշանալ...` },
        "1h": { subtitle: `Ձեր այցին մնացել է ~1 ժամ (${startTime})`, text: `Խնդրում ենք չուշանալ...` },
        "20m": { subtitle: `Ձեր այցին մնացել է ~20 րոպե (${startTime})`, text: `Խնդրում ենք չուշանալ, որպեսզի մենք կարողանանք լիարժեք սպասարկել Ձեզ:` },
        title: "Հիշեցում"
      },
      ru: {
        "2h": { subtitle: `До вашего визита осталось ~2 часа (${startTime})`, text: `Пожалуйста, не опаздывайте...` },
        "1h": { subtitle: `До вашего визита остался ~1 час (${startTime})`, text: `Пожалуйста, не опаздывайте...` },
        "20m": { subtitle: `До вашего визита осталось ~20 минут (${startTime})`, text: `Пожалуйста, не опаздывайте, чтобы мы могли предоставить вам полноценную услугу.` },
        title: "Напоминание"
      },
      en: {
        "2h": { subtitle: `Your appointment is in ~2 hours (${startTime})`, text: `Please arrive on time...` },
        "1h": { subtitle: `Your appointment is in ~1 hour (${startTime})`, text: `Please arrive on time...` },
        "20m": { subtitle: `Your appointment is in ~20 mins (${startTime})`, text: `Please arrive on time so we can provide you with the full experience.` },
        title: "Reminder"
      }
    };

    const dict = templates[locale as keyof typeof templates] || templates.hy;
    const { subtitle, text } = dict[type];
    const title = dict.title;

    const contentHtml = `
      <div class="tile" style="padding: 24px; text-align: center;">
        <p class="accent" style="margin: 0 0 6px 0; font-size: 28px; font-weight: 600; color: ${GOLD}; letter-spacing: 2px;">${startTime}</p>
        <p class="strong" style="margin: 0; font-size: 15px; line-height: 1.6;">${text}</p>
      </div>
    `;

    const html = this.getPremiumTemplate(title, subtitle, contentHtml);

    try {
      await this.transporter.sendMail({
        from: this.from,
        to,
        subject: title + " | Gagik Ghambaryan",
        text: `${title}\n\n${subtitle}\n\n${text}`,
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
        text: "Մուտքագրեք այս կոդը հաստատելու համար։ Վավեր է 10 րոպե։",
      },
      ru: {
        title: "Код Подтверждения",
        subtitle: "Код для подтверждения вашей записи",
        text: "Введите этот код для подтверждения. Действителен 10 минут.",
      },
      en: {
        title: "Verification Code",
        subtitle: "Your booking verification code",
        text: "Enter this code to confirm your appointment. Valid for 10 minutes.",
      },
    };

    const dict = i18n[locale as keyof typeof i18n] || i18n.hy;

    const contentHtml = `
      <div class="tile" style="padding: 28px 20px; text-align: center;">
        <span class="accent" style="display: inline-block; font-size: 34px; font-weight: 600; color: ${GOLD}; letter-spacing: 14px; padding-left: 14px; font-family: 'SF Mono', Menlo, Consolas, monospace;">${code}</span>
      </div>
      <p class="muted" style="margin: 20px 0 0 0; font-size: 13px; line-height: 1.6; text-align: center;">${dict.text}</p>
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

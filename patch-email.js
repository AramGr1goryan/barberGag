const fs = require('fs');

const emailServicePath = 'c:/barber/src/services/email.service.ts';
let code = fs.readFileSync(emailServicePath, 'utf8');

const newReminderFn = `
  async sendReminder(to: string, bookingDetails: any, type: "2h" | "1h" | "20m" = "20m") {
    if (!to.includes("@")) return false;

    const { startTime, locale } = bookingDetails;

    const templates = {
      hy: {
        "2h": { subtitle: \`Ձեր այցին մնացել է ~2 ժամ (\${startTime})\`, text: \`Խնդրում ենք չուշանալ...\` },
        "1h": { subtitle: \`Ձեր այցին մնացել է ~1 ժամ (\${startTime})\`, text: \`Խնդրում ենք չուշանալ...\` },
        "20m": { subtitle: \`Ձեր այցին մնացել է ~20 րոպե (\${startTime})\`, text: \`Խնդրում ենք չուշանալ, որպեսզի մենք կարողանանք լիարժեք սպասարկել Ձեզ:\` },
        title: "Հիշեցում"
      },
      ru: {
        "2h": { subtitle: \`До вашего визита осталось ~2 часа (\${startTime})\`, text: \`Пожалуйста, не опаздывайте...\` },
        "1h": { subtitle: \`До вашего визита остался ~1 час (\${startTime})\`, text: \`Пожалуйста, не опаздывайте...\` },
        "20m": { subtitle: \`До вашего визита осталось ~20 минут (\${startTime})\`, text: \`Пожалуйста, не опаздывайте, чтобы мы могли предоставить вам полноценную услугу.\` },
        title: "Напоминание"
      },
      en: {
        "2h": { subtitle: \`Your appointment is in ~2 hours (\${startTime})\`, text: \`Please arrive on time...\` },
        "1h": { subtitle: \`Your appointment is in ~1 hour (\${startTime})\`, text: \`Please arrive on time...\` },
        "20m": { subtitle: \`Your appointment is in ~20 mins (\${startTime})\`, text: \`Please arrive on time so we can provide you with the full experience.\` },
        title: "Reminder"
      }
    };

    const dict = templates[locale as keyof typeof templates] || templates.hy;
    const { subtitle, text } = dict[type];
    const title = dict.title;

    const contentHtml = \`
      <div class="tile" style="padding: 24px; text-align: center;">
        <p class="accent" style="margin: 0 0 6px 0; font-size: 28px; font-weight: 600; color: \${GOLD}; letter-spacing: 2px;">\${startTime}</p>
        <p class="strong" style="margin: 0; font-size: 15px; line-height: 1.6;">\${text}</p>
      </div>
    \`;

    const html = this.getPremiumTemplate(title, subtitle, contentHtml);

    try {
      await this.transporter.sendMail({
        from: this.from,
        to,
        subject: title + " | Gagik Ghambaryan",
        text: \`\${title}\\n\\n\${subtitle}\\n\\n\${text}\`,
        html,
      });
      return true;
    } catch (e) {
      console.error("Reminder email error:", e);
      return false;
    }
  }
`;

code = code.replace(/async sendReminder\([\s\S]*?catch \(e\) {[\s\S]*?return false;\s*}\s*}/, newReminderFn);

fs.writeFileSync(emailServicePath, code);
console.log("Patched email.service.ts");

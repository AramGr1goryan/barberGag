const nodemailer = require("nodemailer");

async function test() {
  const userEmail = "illuzann@gmail.com";
  let envFrom = "Gagik Ghambaryan"; // User's bad config
  
  if (envFrom && !envFrom.includes("@")) {
    envFrom = `"${envFrom.replace(/"/g, '')}" <${userEmail}>`;
  }
  
  const from = envFrom || `"Gagik Ghambaryan" <${userEmail}>`;
  console.log("FROM HEADER WILL BE:", from);
  
  // Test match logic
  const match = from.match(/<(.+)>/)?.[1] || from;
  console.log("UNSUBSCRIBE EMAIL:", match);
}
test();

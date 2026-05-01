import cron from "node-cron";
import GymBill from "../models/GymBill.js";
import {
  sendBirthdayMail,
  sendAnniversaryMail
} from "../utils/mailer.js";

cron.schedule("0 9 * * *", async () => {
  console.log("🎯 Running Wishes Job");

  const today = new Date();
  const day = today.getDate();
  const month = today.getMonth() + 1;

  const users = await GymBill.find();

  for (let user of users) {
    const dob = new Date(user.dateOfBirth);
    const ann = new Date(user.anniversary);

    if (
      dob &&
      dob.getDate() === day &&
      dob.getMonth() + 1 === month
    ) {
      await sendBirthdayMail(user.email, user.client);
    }

    if (
      ann &&
      ann.getDate() === day &&
      ann.getMonth() + 1 === month
    ) {
      await sendAnniversaryMail(user.email, user.client);
    }
  }
});
import { config } from "dotenv";
import * as express from "express";
import * as bodyParser from "body-parser";
import { Reminder } from "./domain";
import { isVerified } from "./Verify";
import * as schedule from "node-schedule";
import { pickUser } from "./UserPicker";
import ReminderRepo from './ReminderRepo';
import {sendSlackReminder} from "./ReminderGenerator";

class App {
  public express;
  private reminderRepo: ReminderRepo = new ReminderRepo();
  
  constructor() {
    this.express = express();
    config();
    this.registerParsers();
    this.mountRoutes();
    this.scheduleReminders();
  }
  
  private registerParsers() {
    this.express.use(
      bodyParser.urlencoded({ verify: this.rawBodyBuffer, extended: true })
    );
    this.express.use(bodyParser.json({ verify: this.rawBodyBuffer }));
  }

  private rawBodyBuffer = (req, res, buf, encoding) => {
    if (buf && buf.length) {
      req.rawBody = buf.toString(encoding || "utf8");
    }
  };

  private scheduleReminders(): void {
    const cronRule = process.env.SCHEDULE_CRON;
    if (cronRule) {
      this.scheduleJob(cronRule);
    } else {
      const rule = new schedule.RecurrenceRule();
      // Run only during weekdays
      rule.dayOfWeek = new schedule.Range(1, 5);
      rule.hour = process.env.SCHEDULE_HOUR;
      rule.minute = process.env.SCHEDULE_MINUTE;
      this.scheduleJob(rule);
    }
  }

  private scheduleJob(rule) {
    schedule.scheduleJob(rule, () => {
      this.reminderRepo
      .query()
      .then(
        res => res.forEach(r => this.generateSlackReminder(r))
      )
    });
  }
  
  private generateSlackReminder = (reminder: Reminder) => {
    const channelName = process.env.SLACK_CHANNEL;
    console.log(`reminder to pick user from ${JSON.stringify(reminder)}`);
    const reminderToUpdate = pickUser(reminder);
    this.reminderRepo.update(reminderToUpdate);
    sendSlackReminder(reminderToUpdate, channelName);
  };

  private mountRoutes(): void {
    const router = express.Router();
    router.get("/", (req, res) => {
      res.json({
        message:
          "This is taskmaster. In order to assign a task use following syntax: /assignTo task to @user every weekday."
      });
    });
    router.post("/command", (req, res) => {
      if (isVerified) {
        res.json({
          request: req.rawBody
        });
      } else {
        res.sendStatus(404);
      }
    });

    this.express.use("/", router);
  }
}

export default new App().express;

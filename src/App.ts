import { config } from "dotenv";
import * as express from "express";
import * as reminderData from "./data/reminder.json";
import * as bodyParser from "body-parser";
import axios, { AxiosPromise } from "axios";
import SlackApi from './SlackApi';
import { Reminder } from "./domain";
import * as qs from "querystring";
import { isVerified } from "./Verify";
import * as schedule from "node-schedule";
import { pickUser } from "./UserPicker";

class App {
  public express;
  private slackApi: SlackApi;
  private reminders: Reminder[] = [];

  constructor() {
    this.express = express();
    config();
    this.registerParsers();
    this.mountRoutes();
    this.initializeReminderCache();
    this.scheduleReminders();
    this.slackApi = new SlackApi();
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

  private scheduleReminders() : void {
    const rule = new schedule.RecurrenceRule();
    rule.hour = process.env.SCHEDULE_HOUR;
    rule.minute = process.env.SCHEDULE_MINUTE;
    schedule.scheduleJob("*/2 * * * *", () => {
      this.reminders.forEach(r => this.generateSlackReminder(r));
    });
  }

  private initializeReminderCache(): void {
    let i = 0;
    while (reminderData[i] !== undefined) {
      let reminder = {
        task: (<any>reminderData[i]).task,
        hour: (<any>reminderData[i]).hour,
        minute: (<any>reminderData[i]).minute,
        users: [],
        lastPicked: [],
        assigneeCount: (<any>reminderData[i]).assigneeCount
      };
      this.reminders.push(reminder);
      i++;
    }
    console.log(`reminders are ${JSON.stringify(this.reminders)}`);
  }

  private generateSlackReminder = (reminder: Reminder) => {
    const channelName = process.env.SLACK_CHANNEL;
    console.log(`Getting channel data ${channelName}`);
    this.slackApi.getChannelInfo(channelName)
      .then(response => {
        console.log(`${JSON.stringify(response.data)}`);
        const users: string[] = (<any>response.data).channel.members;
        reminder.users = users;
        const pickedUsers = pickUser(reminder);
        let userMention = null;
        pickedUsers.map(
          user => userMention += "<@" + users + ">"
        )
        this.slackApi.sendSlackMessage(channelName, userMention + " " + reminder.task)
            .then(response => {
              console.log(`reminder call result ${JSON.stringify(response.data)}`);
            })
            .catch(error => {
              console.log(`reminder call error ${error}`);
            });
        
      })
      .catch(error => {
        console.error(`problem while retrieving channel info ${error}`);
      });
  }

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

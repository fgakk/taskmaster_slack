import { config } from "dotenv";
import * as express from "express";
import * as reminderData from "./data/reminder.json";
import * as bodyParser from "body-parser";
import axios, { AxiosPromise } from "axios";
import CommandParser from "./CommandParser";
import { Reminder } from "./domain";
import * as qs from "querystring";
import { isVerified } from "./Verify";
import * as schedule from "node-schedule";
import { pickUser } from "./UserPicker";

const apiUrl = "https://slack.com/api";

class App {
  public express;
  private commandParser: CommandParser;
  private reminders: Reminder[] = [];

  constructor() {
    this.express = express();
    config();
    this.registerParsers();
    this.mountRoutes();
    this.initializeReminderCache();
    this.scheduleReminders();
    this.commandParser = new CommandParser();
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
    const rule = new schedule.RecurrenceRule();
    rule.hour = process.env.SCHEDULE_HOUR;
    rule.minute = process.env.SCHEDULE_MINUTE;
    schedule.scheduleJob(rule, () => {
      this.reminders.forEach(r => this.generateSlackReminder(r));
    });
  }

  private initializeReminderCache(): void {
    let i = 0;
    while (reminderData[i] !== undefined) {
      let reminder = {
        task: (<any>reminderData[i]).task,
        time: (<any>reminderData[i]).time,
        users: [],
        lastPicked: []
      };
      this.reminders.push(reminder);
      i++;
    }
    console.log(`reminders are ${JSON.stringify(this.reminders)}`);
  }

  private generateSlackReminder(reminder: Reminder): void {
    const channelName = process.env.SLACK_CHANNEL;
    console.log(`Getting channel data ${channelName}`);
    this.getChannelInfo(channelName)
      .then(response => {
        console.log(`${JSON.stringify(response.data)}`);
        const users: string[] = (<any>response.data).channel.members;
        reminder.users = users;
        const pickedUsers = pickUser(reminder);
        
        pickedUsers.forEach(user => {
          this.sendSlackReminder(
            process.env.SLACK_ACCESS_TOKEN,
            reminder.task,
            reminder.time,
            user
          )
            .then(response => {
              console.log(`reminder call result ${JSON.stringify(response.data)}`);
            })
            .catch(error => {
              console.log(`reminder call error ${error}`);
            });
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
    router.post("/remind", (req, res) => {
      if (isVerified) {
        const { token, text } = req.body;
        const reminder = this.commandParser.parseRemindCommmand(req.body.text);

        const rule = new schedule.RecurrenceRule();
        rule.minute = 1;

        schedule.scheduleJob(rule, () => {
          const users = [];
          const pickedUsers = pickUser(reminder);
          const reminderRequests: AxiosPromise[] = [];

          pickedUsers.forEach(user => {
            reminderRequests.push(
              this.sendSlackReminder(
                process.env.SLACK_ACCESS_TOKEN,
                reminder.task,
                reminder.time,
                user
              )
            );
          });

          Promise.all(reminderRequests)
            .then(result => {
              res.send("Reminder(s) are set.");
            })
            .catch(error => {
              console.log(error);
              res.sendStatus(500);
            });
        });
        res.sendStatus(200);
      } else {
        res.sendStatus(404);
      }
    });
    this.express.use("/", router);
  }

  private sendSlackReminder(token, text, time, user): AxiosPromise {
    const request = { token, text, time, user };
    return axios.post(`${apiUrl}/reminders.add`, qs.stringify(request));
  }

  private getChannelInfo(channel): AxiosPromise {
    const token = process.env.SLACK_ACCESS_TOKEN;
    const request = { token, channel };
    return axios.get(`${apiUrl}/channels.info?${qs.stringify(request)}`);
  }
}

export default new App().express;

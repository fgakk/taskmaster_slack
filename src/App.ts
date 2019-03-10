import { config } from "dotenv";
import * as express from "express";
import * as bodyParser from "body-parser";
import SlackApi from "./SlackApi";
import { Reminder } from "./domain";
import { isVerified } from "./Verify";
import * as schedule from "node-schedule";
import { pickUser } from "./UserPicker";
import ReminderRepo from './ReminderRepo';

class App {
  public express;
  private slackApi: SlackApi = new SlackApi();
  private reminderRepo: ReminderRepo = new ReminderRepo();
  private reminders: Reminder[] = [];

  constructor() {
    this.express = express();
    config();
    this.registerParsers();
    this.mountRoutes();
    this.fillReminders();
    this.scheduleReminders();
  }
  
  private fillReminders() {
 
    this.reminderRepo
    .query()
    .then(res => {
      this.reminders = res;
      console.log(`reminders are ${JSON.stringify(this.reminders)}`
      );}
    )
    .catch(e => console.error(e.stack))
    
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
    const cronRule = process.env.SCHEDULE_CRON
    if (cronRule) {
      schedule.scheduleJob(cronRule, () => {
        this.reminders.forEach(r => this.generateSlackReminder(r));
      });
    } else {
      const rule = new schedule.RecurrenceRule();
      // Run only during weekdays
      rule.dayOfWeek = new schedule.Range(1, 5);
      rule.hour = process.env.SCHEDULE_HOUR;
      rule.minute = process.env.SCHEDULE_MINUTE;
      schedule.scheduleJob(rule, () => {
      this.reminders.forEach(r => this.generateSlackReminder(r));
    });
    }
  }
  
  private generateSlackReminder = (reminder: Reminder) => {
    const channelName = process.env.SLACK_CHANNEL;
    console.log(`Getting channel data ${channelName}`);
    this.slackApi
      .getChannelInfo(channelName, JSON.parse(process.env.SLACK_CHANNEL_PRIVATE))
      .then(response => {
        console.log(`${JSON.stringify(response.data)}`);
        
        const users: string[] = JSON.parse(process.env.SLACK_CHANNEL_PRIVATE) === true ? 
        (<any>response.data).group.members : 
        (<any>response.data).channel.members;

        reminder.users = users;
        console.log(`reminder to pick user from ${JSON.stringify(reminder)}`)
        const reminderToUpdate = pickUser(reminder);
        //this.reminderRepo.update(reminderToUpdate);
        let userMention = "";
        reminderToUpdate.assigned.map(user => (userMention += " <@" + user + ">"));
        this.slackApi
          .sendSlackMessage(channelName, userMention + " " + reminder.task)
          .then(response => {
            console.log(
              `reminder call result ${JSON.stringify(response.data)}`
            );
          })
          .catch(error => {
            console.log(`reminder call error ${error}`);
          });
      })
      .catch(error => {
        console.error(`problem while retrieving channel info ${error}`);
      });
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

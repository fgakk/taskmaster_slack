import { config } from "dotenv";
import * as express from "express";
import * as bodyParser from "body-parser";
import axios, { AxiosPromise } from "axios";
import CommanParser from "./CommandParser";
import * as qs from "querystring";
import { isVerified } from "./Verify";

const apiUrl = "https://slack.com/api";
const reminderApi = apiUrl + "/reaminder.add";
const webHookUrl = process.env.SLACK_WEB_HOOK_URL

class App {
  public express;
  private commandParser: CommanParser;

  constructor() {
    this.express = express();
    config();
    this.registerParsers();
    this.mountRoutes();
    this.commandParser = new CommanParser();
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
        console.log(text);
        const remindSomeone = this.commandParser.parseRemindCommmand(
          req.body.text
        );
        const reminderRequests: AxiosPromise[] = [];
        remindSomeone.users.forEach(user => {
          reminderRequests.push(
            this.sendSlackReminder(
              process.env.SLACK_ACCESS_TOKEN,
              remindSomeone.task,
              remindSomeone.time,
              user
            )
          );
        });
        Promise.all(reminderRequests)
          .then((result) => {
            res.send('Reminder(s) are set.');
          })
          .catch((error) => {
            console.log(error);
            res.sendStatus(500);
          });
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
}

export default new App().express;

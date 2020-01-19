import {Reminder} from "./domain";
import SlackApi from "./SlackApi";

const slackApi: SlackApi = new SlackApi();

export const sendSlackReminder = (reminder: Reminder, channelName: string) : void => {
    console.log(`reminder to pick user from ${JSON.stringify(reminder)}`);
    let userMention = "";
    reminder.assigned.map(user => (userMention += " <@" + user + ">"));
    slackApi
        .sendSlackMessage(channelName, userMention + " " + reminder.task)
        .then(response => {
            console.log(
                `reminder call result ${JSON.stringify(response.data)}`
            );
        })
        .catch(error => {
            console.log(error);
            const message = "Failed to call slack api for sending task as messsage";
            throw new Error(error);
        });
};

import * as aws  from 'aws-sdk';
import {parseReminders, toCSVString, ReadableString} from './helper';
import {sendSlackReminder} from "../ReminderGenerator";
import {pickUser} from "../UserPicker";

console.log('Loading function');

const s3 = new aws.S3({ apiVersion: '2006-03-01' });

export const handler = async (event, context) => {
    //console.log('Received event:', JSON.stringify(event, null, 2));

    // Get the object from the event and show its content type
    const bucket = event.Records[0].s3.bucket.name;
    const key = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, ' '));
    const downloadParams = {
        Bucket: bucket,
        Key: key,
    };
    try {
        const { Body } = await s3.getObject(downloadParams).promise();
        const remindersAsString = Body.toString('utf-8');
        const reminders = parseReminders(remindersAsString);
        const channelName = process.env.SLACK_CHANNEL;
        const updatedReminders = reminders.map(reminder => {
            const reminderToUpdate = pickUser(reminder);
            //sendSlackReminder(reminderToUpdate, channelName);
            return toCSVString(reminderToUpdate);
        });
        const stream = new ReadableString(updatedReminders.toString())
        const uploadParams = {Bucket: downloadParams.Bucket, Key: downloadParams.Key, Body: stream};
        s3.upload (uploadParams, function (err, data) {
            if (err) {
                console.log("Error", err);
                const message = "Failed to update reminder";
                throw new Error(message);
            } if (data) {
                console.log("Upload Success", data.Location);
            }
        });
    } catch (err) {
        console.log(err);
        const message = `Error getting object ${key} from bucket ${bucket}. Make sure they exist and your bucket is in the same region as this function.`;
        console.log(message);
        throw new Error(message);
    }
};

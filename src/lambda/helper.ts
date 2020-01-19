import {Reminder} from "../domain";
import { Readable } from 'stream'

export const parseReminders = (str: string) : Reminder[] => {
    const lines = str.split("\n"); // First split lines
    lines.map((line, index, array) =>{
        let columns = line.split(",");
        let reminder = <Reminder>{};
        reminder.remainingUsers = JSON.parse(columns[0]);
        reminder.assigneeCount = parseInt(columns[1]);
        reminder.task = columns[2];
        reminder.users = JSON.parse(columns[3]);
        return reminder;
    });


    return new Array<Reminder>();
};

export const toCSVString = (reminder: Reminder) => {
    return reminder.remainingUsers + "," + reminder.assigneeCount + "," + reminder.task + "," + reminder.users;
};

export class ReadableString extends Readable {
    private sent = false;

    constructor(private str: string) {
        super();
    }

    _read() {
        if (!this.sent) {
            this.push(Buffer.from(this.str));
            this.sent = true
        }
        else {
            this.push(null)
        }
    }
}

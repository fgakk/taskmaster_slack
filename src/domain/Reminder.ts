interface Reminder {
    users: string[];
    lastPicked: string[];
    task: string;
    hour: number
    minute: number,
    assigneeCount: number
}
export {Reminder}
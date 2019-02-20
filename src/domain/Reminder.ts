interface Reminder {
    users: string[];
    usersToBePicked: string[];
    task: string;
    hour: number
    minute: number,
    assigneeCount: number
}
export {Reminder}
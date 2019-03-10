interface Reminder {
    id: number,
    users: string[];
    remainingUsers: string[];
    task: string;
    assigneeCount: number
}
export {Reminder}
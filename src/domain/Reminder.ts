interface Reminder {
    id: number,
    users: string[];
    assigned: string[];
    remainingUsers: string[];
    task: string;
    assigneeCount: number
}
export {Reminder}
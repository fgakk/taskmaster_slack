class CommandParser {

    public parseRemindCommmand(commandText: string): RemindSomeone {
        const firstIndex = commandText.indexOf('[');
        const lastIndex = commandText.indexOf(']', firstIndex + 1)
        const task = commandText.substring(firstIndex + 1, lastIndex);
        const time = commandText.substring(lastIndex+2);
        const users = this.parseUsers(commandText.substring(0, firstIndex));
        return { users, task, time };
    }

    private parseUsers(rawStr: string) {
        const rawUsers = rawStr.split(' ')
        let result = []
        rawUsers.forEach(element => {
            result.push(this.parseUser(element))
        });
        return result;
    }

    private parseUser(rawUser: string): string {
        const firstIndex = rawUser.indexOf("@");
        const lastIndex = rawUser.indexOf("|");
        return rawUser.substring(firstIndex + 1, lastIndex);
    }
}

interface RemindSomeone {
    users: string[];
    task: string;
    time: string // natural language description
}

export default CommandParser;
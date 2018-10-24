import { Reminder } from "./domain";

let lastPicked = []; // in memory storage of picked users

const pickUser = (reminder: Reminder): string[] => {
  const assigned: string[] = [];
  for (let i = 0; i < reminder.assigneeCount; i++) {
    // cleanup lastPicked if it is full
    if (reminder.users.length == reminder.lastPicked.length) {
      lastPicked = [];
    }

    const filtered = reminder.users.filter(
      user => lastPicked.indexOf(user) == -1
    );

    const picked: string = uniqueRandPerson(filtered);

    assigned.push(picked);
    lastPicked.push(picked);
  }

  reminder.lastPicked = lastPicked
  return assigned;
};

const uniqueRandPerson = (arr): string => {
  const e = Math.floor(Math.random() * arr.length);

  return arr[e];
};

export { pickUser };

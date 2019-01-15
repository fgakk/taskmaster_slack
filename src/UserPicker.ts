import { Reminder } from "./domain";

const pickUser = (reminder: Reminder): string[] => {
  const assigned: string[] = [];
  const { assigneeCount, users } = reminder
  let {lastPicked} = reminder
  for (let i = 0; i < assigneeCount; i++) {
    // cleanup lastPicked if it is full
    if (users.length == lastPicked.length + (assigneeCount - 1)) {
      lastPicked = [];
    }

    const filtered = users.filter(user => lastPicked.indexOf(user) == -1);
    const picked: string = uniqueRandPerson(filtered);

    assigned.push(picked);
    lastPicked.push(picked);
  }
  
  
  return assigned;
};

const uniqueRandPerson = (arr): string => {
  const e = Math.floor(Math.random() * arr.length);

  return arr[e];
};

export { pickUser };

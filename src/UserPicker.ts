import { Reminder } from "./domain";

const pickUser = (reminder: Reminder): string[] => {
  
  const { assigneeCount, users } = reminder
  let { remainingUsers } = reminder

  // If there are no users to be picked set initialize it by first shuffling channel users
  if (remainingUsers === undefined || remainingUsers.length == 0) {
    const shuffledUsers: string[] = shuffle(users);
    console.log(`shuffled users ${shuffledUsers}`)
    const filledUsers: string[] = addToEnd(shuffledUsers, assigneeCount);
    console.log(`filledUsers users ${filledUsers}`)
    remainingUsers = filledUsers.slice();
  }
  
  // Then for assigment take from the usersToBePicked according to assignedCount
  const assigned: string[] = remainingUsers.slice(0, assigneeCount)
  console.log(`assigned users ${assigned}`)
  reminder.remainingUsers = remainingUsers.slice(assigneeCount)
  console.log(`usersTobePicked ${reminder.remainingUsers}`)

  return assigned;
};

const shuffle = (array: string[]): string[] => {
  const shuffled = array.slice();
  let counter = shuffled.length;

  // While there are elements in the array
  while (counter > 0) {
      // Pick a random index
      let index = Math.floor(Math.random() * counter);

      // Decrease counter by 1
      counter--;

      // And swap the last element with it
      let temp = shuffled[counter];
      shuffled[counter] = shuffled[index];
      shuffled[index] = temp;
  }

  return shuffled;
}

const addToEnd = (users: string[], pickCount: number): string[] => {
  
  if (users.length % pickCount == 0) {
    return users.slice();
  }
  else {
    // if there are odd number of users add the first user to the end
    return users.concat(users.slice(0, pickCount - (users.length % pickCount)))
  }
}


const uniqueRandPerson = (arr): string => {
  const e = Math.floor(Math.random() * arr.length);

  return arr[e];
};

export { pickUser };

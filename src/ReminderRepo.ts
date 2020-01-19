import { Pool } from "pg";
import { Reminder } from "./domain";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: true
});

// the pool with emit an error on behalf of any idle clients
// it contains if a backend error or network partition happens
pool.on("error", (err, client) => {
  console.error("Unexpected error on idle client", err);
});

class ReminderRepo {
  public async query() {
    const client = await pool.connect();
    try {
      const res = await client.query(
        "SELECT id, users, remaining_users, assignee_count, task from reminders"
      );
      return res.rows.map(
        (val, idx, arr) => {
          let reminder = <Reminder>{};
          reminder.assigneeCount = val['assignee_count'];
          reminder.remainingUsers = JSON.parse(val['remaining_users']);
          reminder.id = val['id'];
          reminder.task = val['task'];
          reminder.users = JSON.parse(val['users']);
          return reminder;
        }
      );
    } finally {
      client.release();
    }
  }

  public async update(reminder: Reminder) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const params = [JSON.stringify(reminder.remainingUsers), reminder.id];
      await client.query(
        "UPDATE reminders set remaining_users=$1 where id=$2",
        params
      );
      await client.query("COMMIT");
    } catch (e) {
      await client.query("ROLLBACK");
    } finally {
      client.release();
    }
  }
}
export default ReminderRepo;

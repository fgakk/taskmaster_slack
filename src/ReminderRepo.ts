import { Pool, QueryResult, PoolClient } from "pg";
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
        "SELECT id, remaining_users, assign_count from reminders"
      );
      return res;
    } finally {
      client.release();
    }
  }

  public async update(id: number, reminder: Reminder) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const params = [reminder.remainingUsers, id];
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

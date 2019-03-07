import { Client, QueryResult } from 'pg';
import { Reminder } from './domain';

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: true,
});

class ReminderRepo {
  public init() {
    client.connect();
  }

  public query(): Promise<QueryResult> {
    return client.query('SELECT id, remaining_users, assign_count from reminders')    
  }

  public update(id: number, reminder: Reminder) {
    client.query('BEGIN', (err) => {
      if(err) {
        this.rollback(err)
        return
      }
      const params = [reminder.usersToBePicked, id]
      client.query('UPDATE reminders set remaining_users=$1 where id=$2', params, (err, res) => {
        if(err) {
          this.rollback(err)
          return
        }
        client.query('COMMIT', (err) => {
          if(err) {
            console.error('Error committing transaction', err.stack)
          }
        })
      })
    })
    
  }
  public shutdown() {
    client.end()
  }

  private rollback(err) {
    client.query('ROLLBACK', (err) => {
      if (err) {
        console.error('Error rolling back client', err.stack)
      }
    })

    return !!err
  }
}


client.query('SELECT table_schema,table_name FROM information_schema.tables;', (err, res) => {
  if (err) throw err;
  for (let row of res.rows) {
    console.log(JSON.stringify(row));
  }
  client.end();
});

export default ReminderRepo;
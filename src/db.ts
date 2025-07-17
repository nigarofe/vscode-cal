import * as sqlite3 from 'sqlite3';
import * as path from 'path';
import { CREATE_TABLES_SQL } from "./db_sql_queries";

const dbPath = path.resolve(__dirname, "../src/db.db");

export function initializeDatabase() {
    const db = new sqlite3.Database(dbPath, (err) => {
        if (err) {
            console.error(`Error opening the SQLite database at ${dbPath}`, err.message);
        }
        else {
            console.log(`Connected to the SQLite database at ${dbPath}`);
        }
    });
    db.serialize(() => {
        db.exec(CREATE_TABLES_SQL);
    });
    return db;
}

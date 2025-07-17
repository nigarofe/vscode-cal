const sqlite3 = require('sqlite3').verbose();
    const db = new sqlite3.Database('src/db.db');

    db.serialize(() => {
      db.all("PRAGMA table_info(questions)", (err, columns) => {
        if (err) {
          console.error(err.message);
        }
        console.log(columns);
      });
    });

    db.close();
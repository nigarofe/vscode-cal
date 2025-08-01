export const GET_QUESTIONS_SQL = `
    SELECT
  q.*,
  COALESCE(
    json_group_array(a.code ORDER BY a.attempt_datetime), '[]' ) AS code_vec_json,
  COALESCE(
    json_group_array(a.attempt_datetime ORDER BY a.attempt_datetime), '[]' ) AS date_vec_json
    FROM questions AS q
    LEFT JOIN attempts AS a
    ON a.question_number = q.question_number
    GROUP BY q.question_number
  `;
export const CREATE_QUESTION_SQL = `
    INSERT INTO questions (discipline, source, description, proposition, step_by_step, answer, tags)
    VALUES (?, ?, ?, ?, ?, ?, ?)
`;
export const UPDATE_QUESTION_SQL = `
    UPDATE questions
    SET discipline = ?, source = ?, description = ?, proposition = ?, step_by_step = ?, answer = ?, tags = ?
    WHERE question_number = ?
`;
export const INSERT_ATTEMPT_SQL = `
    INSERT INTO attempts (question_number, code)
    VALUES (?, ?)
`;
export const CREATE_TABLES_SQL = `
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS questions (
      question_number INTEGER PRIMARY KEY AUTOINCREMENT,
      discipline      TEXT    NOT NULL,
      source          TEXT    NOT NULL,
      description     TEXT    NOT NULL,
      proposition     TEXT    NOT NULL,
      step_by_step    TEXT,
      answer          TEXT    NOT NULL,
      tags            TEXT    NOT NULL
    );

    CREATE TABLE IF NOT EXISTS attempts (
      id               INTEGER PRIMARY KEY AUTOINCREMENT,
      question_number  INTEGER NOT NULL,
      code             INTEGER NOT NULL,
      attempt_datetime     DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (question_number)
        REFERENCES questions(question_number)
        ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS premises (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      name            TEXT    NOT NULL,
      content         TEXT    NOT NULL
    );

    CREATE TABLE IF NOT EXISTS curated_views_for_premises (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      premise_id      INTEGER NOT NULL,
      view_name       TEXT    NOT NULL,
      FOREIGN KEY (premise_id)
        REFERENCES premises(id)
        ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS view_premises (
      view_id         INTEGER NOT NULL,
      premise_id      INTEGER NOT NULL,
      display_order   INTEGER NOT NULL,
      PRIMARY KEY (view_id, premise_id), -- Ensures a premise can't be in the same view twice
      FOREIGN KEY (view_id) REFERENCES views(id) ON DELETE CASCADE,
      FOREIGN KEY (premise_id) REFERENCES premises(id) ON DELETE CASCADE
    );
`;

export const GET_QUESTION_BY_NUMBER_SQL = `
    SELECT
  q.*,
  COALESCE(
    json_group_array(a.code ORDER BY a.attempt_datetime), '[]' ) AS code_vec_json,
  COALESCE(
    json_group_array(a.attempt_datetime ORDER BY a.attempt_datetime), '[]' ) AS date_vec_json
    FROM questions AS q
    LEFT JOIN attempts AS a
    ON a.question_number = q.question_number
    WHERE q.question_number = ?
    GROUP BY q.question_number
`;

export const GET_MAX_QUESTION_NUMBER_SQL = `
    SELECT MAX(question_number) as max_number FROM questions
`;
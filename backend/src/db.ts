import mysql from 'mysql2/promise';

export const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || 'localhost',
  port: parseInt(process.env.MYSQL_PORT || '3306', 10),
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || 'root',
  database: process.env.MYSQL_DATABASE || 'notebook_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

export async function initDb() {
  const connection = await pool.getConnection();
  try {
    await connection.query(`
      CREATE TABLE IF NOT EXISTS notebooks (
        id VARCHAR(255) PRIMARY KEY,
        data JSON NOT NULL
      )
    `);

    // Inicia com um caderno padrão caso o banco esteja vazio
    const [rows]: any = await connection.query('SELECT COUNT(*) as count FROM notebooks');
    if (rows[0].count === 0) {
      const defaultNotebook = {
        id: "notebook-default",
        name: "Página 1",
        updatedAt: new Date().toISOString(),
        style: {
          paperType: "lined",
          textColor: "#1a1a1a",
          font: "handwriting-caveat"
        },
        items: []
      };
      await connection.query(
        'INSERT INTO notebooks (id, data) VALUES (?, ?)',
        ["notebook-default", JSON.stringify(defaultNotebook)]
      );
    }
    console.log("MySQL Database initialized!");
  } catch (error) {
    console.error("Error initializing database:", error);
  } finally {
    connection.release();
  }
}

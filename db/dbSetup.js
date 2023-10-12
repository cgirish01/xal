const pool = require('./index');

async function createTables() {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255),
                email VARCHAR(255) UNIQUE,
                password_hash VARCHAR(255),
                metamask_wallet_address VARCHAR(255) UNIQUE
            );
        `);
        console.log("Tables created successfully");

    // Creating processes table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS processes (
        id SERIAL PRIMARY KEY,
        description TEXT,
        created_by_user_id INTEGER REFERENCES users(id)
      );
    `);
        console.log('Processes table created successfully');
        

    // Creating sign_offs table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS sign_offs (
        id SERIAL PRIMARY KEY,
        process_id INTEGER REFERENCES processes(id),
        user_id INTEGER REFERENCES users(id),
        comment TEXT,
        picture_path TEXT,
        can_see_comments BOOLEAN DEFAULT FALSE,
        signed_off BOOLEAN DEFAULT FALSE
      );
    `);
        console.log('Sign-offs table created successfully');

     await pool.query(`
      CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id),
    process_id INT REFERENCES processes(id),
    message TEXT,
    status TEXT CHECK (status IN ('read', 'unread'))
);
    `);
        console.log('notification table created successfully');
        
    } catch (error) {
        console.error("Error setting up the database:", error);
    }
}

module.exports = {
    createTables
};
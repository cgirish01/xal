const express = require('express');
const pool = require('../db');

const router = express.Router();


function ensureAuthenticated(req, res, next) {
    if (!req.session || !req.session.user) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
}
router.use(ensureAuthenticated);

// router.get('/users', async (req, res) => {
//     try {
//         const users = await pool.query('SELECT id, name FROM users');
//         res.json(users.rows);
//     } catch (err) {
//         res.status(500).json({ error: err.message });
//     }
// });

router.get('/users', async (req, res) => {
    try {
        const users = await pool.query('SELECT id, name FROM users WHERE id <> $1', [req.session.user.id]);
        res.json(users.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/', async (req, res) => {
    try {
        console.log(req.user);
        const processes = await pool.query('SELECT * FROM processes WHERE user_id = $1', [req.session.user.id]);
        res.json(processes.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
router.post('/', async (req, res) => {
    try {
        console.log("reached hereeeeeeee");
        const { users, description } = req.body;
        console.log(req.session.user)
        const newProcess = await pool.query(
            'INSERT INTO processes (description, created_by_user_id) VALUES ($1, $2) RETURNING id',
            // 'INSERT INTO processes (description) VALUES ($1) RETURNING id',
            [description, req.session.user.id] // Assuming you've set req.user after login
            // [description]
        );

        const processId = newProcess.rows[0].id;

        // Loop through users and insert them in the sign_offs table
        for (let i = 0; i < users.length; i++) {
            await pool.query(
                'INSERT INTO sign_offs (process_id, user_id) VALUES ($1, $2)',
                [processId, users[i]]
            );
        }

        res.json({ message: "Process created successfully!" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Add more routes related to processes as needed...




module.exports = router;

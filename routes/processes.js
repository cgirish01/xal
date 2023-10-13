const express = require('express');
const pool = require('../db');
const multer = require('multer');
const path = require('path');
const nodemailer = require('nodemailer');
const router = express.Router();
const sharp = require('sharp');
require('dotenv').config();


// Middleware to check if the user is authenticated
function ensureAuthenticated(req, res, next) {
    if (!req.session || !req.session.user) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
}
router.use(ensureAuthenticated);

router.get('/isAuthenticated', (req, res) => {
    if (req.session && req.session.user) {
        res.json({ isAuthenticated: true });
    } else {
        res.json({ isAuthenticated: false });
    }
});

router.get('/users', async (req, res) => {
    try {
        const users = await pool.query('SELECT id, name FROM users WHERE id <> $1', [req.session.user.id]);
        res.json(users.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    },
    tls: {
        rejectUnauthorized: false
    }
});

// Function to send emails to users
const sendEmailToUsers = async (userEmails, subject, text, processInfo) => {
  let mailOptions = {
    from: 'lori.homenick88@ethereal.email',
    to: userEmails.join(','),
    subject: subject,
    text: `${text}: ${processInfo}`
  };
  
  console.log(mailOptions);

  try {
    let info = await transporter.sendMail(mailOptions);
    console.log(`Emails sent: ${info.response}`);
  } catch (error) {
    console.error(`Error sending email: ${error}`);
  }
}


// Set up storage with multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// Endpoint to upload an signature
router.post('/uploadImage', upload.single('image'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded.' });
    }

    // Resizing logic
    const resizedImagePath = `./uploads/resized-${req.file.filename}`;
    try {
        await sharp(req.file.path)
            .resize(30, 30) // Resize to 3cm x 3cm (assuming 10px per cm)
            .toFile(resizedImagePath);

        // Optional: If you want to delete the original image after resizing
        // fs.unlinkSync(req.file.path);

        res.json({ path: resizedImagePath });
    } catch (error) {
        res.status(500).json({ error: "Error resizing the image." });
    }
});

// Endpoint to get all processes
router.get('/', async (req, res) => {
    try {
        console.log(req.session.user);
        console.log("reached here");
        const processes = await pool.query('SELECT * FROM processes WHERE created_by_user_id = $1', [req.session.user.id]);
        console.log(processes.rows);
        res.json(processes.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Endpoint to create a new process
router.post('/', async (req, res) => {
    try {
        console.log("reached hereeeeeeee");
        const { users, description } = req.body;
        console.log(req.session.user)
        const newProcess = await pool.query(
            'INSERT INTO processes (description, created_by_user_id) VALUES ($1, $2) RETURNING id',
            [description, req.session.user.id] 
        );
        console.log("process updated");

        const processId = newProcess.rows[0].id;

        // Loop through users and insert them in the sign_offs table
        for (let i = 0; i < users.length; i++) {
            console.log([processId, users[i].id, users[i].canSeeComments]);
            await pool.query(
                // 'INSERT INTO sign_offs (process_id, user_id) VALUES ($1, $2)',
                // [processId, users[i]]
                'INSERT INTO sign_offs (process_id, user_id, can_see_comments) VALUES ($1, $2, $3)',
                [processId, users[i].id, users[i].canSeeComments]
            );
        }
        console.log("users updated", [users]);
        const userIds = users.map(user => user.id);
        const userEmailsResults = await pool.query('SELECT email FROM users WHERE id = ANY($1)', [userIds]);
        const userEmails = userEmailsResults.rows.map(row => row.email);
        console.log("emails seent");
        // Send emails
        sendEmailToUsers(userEmails, "process crated", "new process has been created " ,description);

        res.json({ message: "Process created successfully!" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// Endpoint to get processes created by the current user
router.get('/createdByMe', async (req, res) => {
    try {
        const processes = await pool.query(
            'SELECT * FROM processes WHERE created_by_user_id = $1',
            [req.session.user.id]
        );
        
        const processesWithSignoffs = [];

        for (let process of processes.rows) {
            const signOffsResult = await pool.query(
                `SELECT u.name AS userName, s.comment, s.picture_path 
                 FROM sign_offs s 
                 JOIN users u ON s.user_id = u.id 
                 WHERE s.process_id = $1`,
                [process.id]
            );
            // console.log(signOffsResult.rows);

            processesWithSignoffs.push({
                ...process,
                signOffs: signOffsResult.rows
            });
        }
        // console.log("created by me");
        // console.log(processesWithSignoffs);
        res.json(processesWithSignoffs);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Endpoint to get processes that need signoff by the current user
router.get('/needsSignoff', async (req, res) => {
    try {
        const processesResults = await pool.query(`
            SELECT p.* ,s.can_see_comments 
            FROM processes p 
            JOIN sign_offs s ON p.id = s.process_id 
            WHERE s.user_id = $1 AND s.signed_off = FALSE
        `, [req.session.user.id]);

        const processes = processesResults.rows;
        for(let process of processes) {
            if (process.can_see_comments) {
                const usersResults = await pool.query(`
                    SELECT u.name, s.comment, s.picture_path 
                    FROM users u 
                    JOIN sign_offs s ON u.id = s.user_id 
                    WHERE s.process_id = $1
                `, [process.id]);
                process.users = usersResults.rows;
            } else {
                // If the user cannot see comments, just fetch names and pictures without comments.
                const usersResults = await pool.query(`
                    SELECT u.name, s.picture_path 
                    FROM users u 
                    JOIN sign_offs s ON u.id = s.user_id 
                    WHERE s.process_id = $1
                `, [process.id]);
                process.users = usersResults.rows.map(user => ({ ...user, comment: 'Hidden' }));
            }
        }


        // console.log("need signoff");
        // console.log(processes);
        res.json(processes);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Endpoint to sign off on a process (when a user signs off any process)
router.post('/signoff', async (req, res) => {
    try {
        const { processId, comment, picturePath } = req.body;
        const userId = req.session.user.id;
        const userNameResult = await pool.query(
            'SELECT name FROM users WHERE id = $1', 
            [userId]
        );
        const userName = userNameResult.rows[0].name;

        // Retrieve the process name based on the processId
        const processNameResult = await pool.query(
            'SELECT description,created_by_user_id FROM processes WHERE id = $1', 
            [processId]
        );
        const processName = processNameResult.rows[0].description;
        const createdByUserId = processNameResult.rows[0].created_by_user_id;


        await pool.query(
            'UPDATE sign_offs SET comment=$1, picture_path=$2, signed_off=TRUE WHERE process_id=$3 AND user_id=$4',
            [comment, picturePath, processId, userId]
        );
        await pool.query(`
        INSERT INTO notifications(user_id, process_id, message, status)
        VALUES($1, $2, $3, 'unread')
    `, [createdByUserId, processId, `${userName} has signed off on process ${processName}.`]);

    // Check all sign-offs
    const signOffsResults = await pool.query(`
        SELECT * FROM sign_offs WHERE process_id = $1
    `, [processId]);
        
    const creatorEmailsResults = await pool.query('SELECT email FROM users WHERE id = $1', [createdByUserId]);
    const completionEmail = creatorEmailsResults.rows.map(row => row.email);
    console.log("emails seent");
    // Send emails
    

    if(signOffsResults.rows.every(row => row.signed_off)) {
        // Send email to all parties. Use your email sending logic here.
        // console.log("All signed off");

        sendEmailToUsers(completionEmail, "everyone signed of", "everyone signed off for process" ,processName);
        
        await pool.query(`
            INSERT INTO notifications(user_id, process_id, message, status)
            VALUES($1, $2, $3, 'unread')
        `, [createdByUserId, processId, `Everyone has signed off on your process, ${processName}.`]);
    }

        res.json({ message: "Signoff updated successfully!" });
    } catch (err) {
        console.error("Error in /signoff:", err);
        res.status(500).json({ error: err.message });
    }
});

// Endpoint to get notifications for the current user
router.get('/notifications', async (req, res) => {
    console.log('started');
    const notifications = await pool.query(`
        SELECT * FROM notifications WHERE user_id = $1 AND status = 'unread'
    `, [req.session.user.id]);
    // console.log('hello',req.session.user.id,notifications.rows);
    res.json(notifications.rows);
});

// Endpoint to mark a notification as read
router.post('/notifications/mark-as-read', async (req, res) => {
    const { notificationId } = req.body;
    await pool.query(`
        UPDATE notifications SET status = 'read' WHERE id = $1
    `, [notificationId]);
    res.json({ message: 'Notification marked as read' });
});

// endpoint to get processes previously signed off by you
router.get('/signedOffByYou', async (req, res) => {
   try {
        const processesResults = await pool.query(`
            SELECT p.* ,s.can_see_comments 
            FROM processes p 
            JOIN sign_offs s ON p.id = s.process_id 
            WHERE s.user_id = $1 AND s.signed_off = TRUE
        `, [req.session.user.id]);

        const processes = processesResults.rows;
        for(let process of processes) {
            if (process.can_see_comments) {
                const usersResults = await pool.query(`
                    SELECT u.name, s.comment, s.picture_path 
                    FROM users u 
                    JOIN sign_offs s ON u.id = s.user_id 
                    WHERE s.process_id = $1
                `, [process.id]);
                process.users = usersResults.rows;
            } else {
                // If the user cannot see comments, just fetch names and pictures without comments.
                const usersResults = await pool.query(`
                    SELECT u.name, s.picture_path 
                    FROM users u 
                    JOIN sign_offs s ON u.id = s.user_id 
                    WHERE s.process_id = $1
                `, [process.id]);
                process.users = usersResults.rows.map(user => ({ ...user, comment: 'Hidden' }));
            }
        }


        res.json(processes);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Endpoint to check if user has a wallet address connected
router.get('/checkWalletStatus/', async (req, res) => {
    try {
        const { userId } = req.body;
        console.log("result before");
        const result = await pool.query('SELECT metamask_wallet_address FROM users WHERE id = $1', [userId]);
        console.log("result",result.rows);
        if (result.rows.length) {
            const address = result.rows[0].metamask_wallet_address;
            res.send({ hasWallet: Boolean(address) });
        } else {
            res.status(404).send({ error: "User not found" });
        }
    } catch (error) {
        console.error(error);
        res.status(500).send({ error: 'Internal server error' });
    }
});

// Endpoint to Update Wallet Address:
router.post('/updateWallet', async (req, res) => {
    const { walletAddress } = req.body;
    console.log(req.session.user.id, walletAddress)
    try {
        await pool.query('UPDATE users SET metamask_wallet_address = $1 WHERE id = $2', [walletAddress, req.session.user.id]);
        res.send({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).send({ error: 'Internal server error' });
    }
});

// Endpoint to logout
router.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if(err) {
            return res.status(500).json({error: 'Failed to end session.'});
        }

        res.clearCookie('session-name'); // Replace 'session-name' with the name you use for your cookie
        res.status(200).send('Logged out');
    });
});




module.exports = router;

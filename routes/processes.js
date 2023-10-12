const express = require('express');
const pool = require('../db');
const multer = require('multer');
const path = require('path');
const nodemailer = require('nodemailer');
const router = express.Router();
const sharp = require('sharp');


function ensureAuthenticated(req, res, next) {
    if (!req.session || !req.session.user) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
}
router.use(ensureAuthenticated);

router.get('/users', async (req, res) => {
    try {
        const users = await pool.query('SELECT id, name FROM users WHERE id <> $1', [req.session.user.id]);
        res.json(users.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
const transporter = nodemailer.createTransport({
    host: 'smtp.rediffmail.com',
    port: 2525,
    secure: false,  // use SSL
    auth: {
        user: 'shadowx158@rediffmail.com',
        pass: 'Devil#123'
    },
    tls: {
        rejectUnauthorized: false
    }
});

const sendEmailToUsers = async (userEmails, processInfo) => {
  let mailOptions = {
    from: 'shadowx158@rediffmail.com',
    to: userEmails.join(','),
    subject: 'New Process Created',
    text: `A new process has been created: ${processInfo}`
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
// router.post('/uploadImage', upload.single('image'), (req, res) => {
//   if (!req.file) {
//     return res.status(400).json({ error: 'No file uploaded.' });
//   }

//   res.json({ path: req.file.path });
// });
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
        // sendEmailToUsers(userEmails, description);

        res.json({ message: "Process created successfully!" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/signoff/:processId', upload.single('processImage'), async (req, res) => {
    try {
        const processId = req.params.processId;
        const comment = req.body.comment;
        const imageFile = req.file.filename;  // This gets the filename saved by multer
        
        // Store comment and imageFile in your database against the processId and userId
        // For simplicity, we assume a sign_offs table which has a column for comment and image

        await pool.query(
            'UPDATE sign_offs SET comment = $1, image = $2 WHERE process_id = $3 AND user_id = $4',
            [comment, imageFile, processId, req.session.user.id]
        );

        res.json({ message: "Signed off successfully!" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// router.get('/createdByMe', async (req, res) => {
//     try {
//         // console.log("reached created by me");
//         // console.log(req.session.user);
//         const processes = await pool.query('SELECT * FROM processes WHERE created_by_user_id = $1', [req.session.user.id]);
//         console.log(processes.rows);
//         res.json(processes.rows);
//     } catch (err) {
//         res.status(500).json({ error: err.message });
//     }
// });

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

router.post('/signoff', async (req, res) => {
    try {
        const { processId, comment, picturePath } = req.body;
        const userId = req.session.user.id;

        await pool.query(
            'UPDATE sign_offs SET comment=$1, picture_path=$2, signed_off=TRUE WHERE process_id=$3 AND user_id=$4',
            [comment, picturePath, processId, userId]
        );

        res.json({ message: "Signoff updated successfully!" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// router.get('/signedOffByYou', async (req, res) => {
//     try {
//         // Fetch processes that the user has signed off, but the entire process isn't completed
//         const processesResults = await pool.query(`
//             SELECT p.*
//             FROM processes p 
//             JOIN sign_offs s1 ON p.id = s1.process_id 
//             WHERE s1.user_id = $1 AND s1.signed_off = TRUE
//             AND EXISTS (
//                 SELECT 1 FROM sign_offs s2 
//                 WHERE s2.process_id = p.id AND s2.signed_off = FALSE
//             )
//         `, [req.session.user.id]);

//         const processes = processesResults.rows;
//         for(let process of processes) {
//             const usersResults = await pool.query(`
//                 SELECT u.name, s.comment, s.picture_path, s.can_see_comments
//                 FROM users u 
//                 JOIN sign_offs s ON u.id = s.user_id 
//                 WHERE s.process_id = $1
//             `, [process.id]);

//             // Decide if the comment should be shown or hidden based on `can_see_comments`
//             process.users = usersResults.rows.map(user => {
//                 return {
//                     ...user,
//                     comment: user.can_see_comments ? user.comment : 'Hidden'
//                 };
//             });
//         }
        
//         res.json(processes);
//     } catch (err) {
//         res.status(500).json({ error: err.message });
//     }
// });
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


module.exports = router;

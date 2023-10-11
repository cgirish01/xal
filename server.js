const express = require('express');
const userRoutes = require('./routes/users');
const processRoutes = require('./routes/processes');
const session = require('express-session');

const app = express();
const { createTables } = require('./db/dbSetup');
createTables();
app.use(session({
    secret: 'aVeryDifficultToGuessKey12345',  // Choose a strong secret key
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Use { secure: true } for production if using HTTPS
}));
app.use(express.json());
app.use('/api/users', userRoutes);
app.use(express.static('public'));
app.use('/api/processes', processRoutes);

app.listen(3000, () => {
    console.log('Server started on http://localhost:3000');
});

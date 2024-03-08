import express, { Request, Response } from "express";
import userRoutes from "./users/routes"
import client from "./db";

const app = express();

client.query(`
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255),
    address VARCHAR(255),
    pfp_url VARCHAR(255),
    cover_picture_url VARCHAR(255),
    description TEXT
)
`, (err, res) => {
    if (err) throw err;
});

client.query(`
CREATE TABLE levels (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    total INTEGER,
    language INTEGER,
    socials INTEGER,
    meditation INTEGER,
    code INTEGER,
    sport INTEGER
);
`, (err, res) => {
    if (err) throw err;
});

app.use('/users', userRoutes);

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
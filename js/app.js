const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Database Connection with SSL for Supabase
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

// Check if student exists
app.get('/api/check-status/:enrollNo', async (req, res) => {
    try {
        const { enrollNo } = req.params;
        const result = await pool.query(
            'SELECT name, student_class FROM students WHERE enrollment_no = $1', 
            [enrollNo]
        );

        if (result.rows.length > 0) {
            res.json({ 
                verified: true, 
                studentName: result.rows[0].name,
                studentClass: result.rows[0].student_class 
            });
        } else {
            res.json({ verified: false });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Database error" });
    }
});

// Verify email and enrollment match
app.post('/api/verify-email', async (req, res) => {
    const { enrollNo, email } = req.body;
    try {
        const result = await pool.query(
            'SELECT * FROM students WHERE enrollment_no = $1 AND email = $2',
            [enrollNo, email]
        );

        if (result.rows.length > 0) {
            res.json({ success: true });
        } else {
            res.json({ success: false, message: "Email does not match our records." });
        }
    } catch (err) {
        res.status(500).json({ error: "Server error" });
    }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

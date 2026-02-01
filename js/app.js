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

// 1. Check if student exists
app.get('/api/check-status/:enrollment_no', async (req, res) => {
    try {
        const { enrollment_no } = req.params; // Using enrollment_no from URL
        
        const result = await pool.query(
            // FIXED: Added 'section' and changed 'name' to 'student_name' to match your Excel headers
            'SELECT student_name, student_class, section FROM students WHERE enrollment_no = $1', 
            [enrollment_no] // FIXED: Changed from enrollNo to enrollment_no
        );

        if (result.rows.length > 0) {
            res.json({ 
                verified: true, 
                studentName: result.rows[0].student_name,
                studentClass: result.rows[0].student_class,
                section: result.rows[0].section // Now sending section to the frontend
            });
        } else {
            res.json({ verified: false });
        }
    } catch (err) {
        console.error("Database Error:", err);
        res.status(500).json({ error: "Database error" });
    }
});

// 2. Verify email and enrollment match
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
        console.error("Server Error:", err);
        res.status(500).json({ error: "Server error" });
    }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

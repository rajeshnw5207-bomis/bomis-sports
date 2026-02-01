const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

// FIXED: Using 'enrollment_no' to match your database exactly
app.get('/api/check-status/:enrollment_no', async (req, res) => {
    try {
        const { enrollment_no } = req.params; 
        const result = await pool.query(
            'SELECT student_name, student_class, section FROM students WHERE enrollment_no = $1', 
            [enrollment_no] 
        );

        if (result.rows.length > 0) {
            res.json({ 
                verified: true, 
                studentName: result.rows[0].student_name,
                studentClass: result.rows[0].student_class,
                section: result.rows[0].section
            });
        } else {
            res.json({ verified: false });
        }
    } catch (err) {
        console.error("Query Error:", err);
        res.status(500).json({ error: "Database error" });
    }
});

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
            res.json({ success: false });
        }
    } catch (err) {
        res.status(500).json({ error: "Server error" });
    }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

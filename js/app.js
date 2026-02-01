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

// 1. Route to check enrollment status
app.get('/api/check-status/:enrollment_no', async (req, res) => {
    try {
        const { enrollment_no } = req.params; 
        const result = await pool.query(
            // FIXED: Changed 'students' to 'bomis_db' to match your Supabase table
            'SELECT student_name, student_class, section FROM bomis_db WHERE enrollment_no = $1', 
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

// 2. Route to verify email match
app.post('/api/verify-email', async (req, res) => {
    // FIXED: Corrected spelling to enrollment_no
    const { enrollment_no, email } = req.body;
    try {
        const result = await pool.query(
            // FIXED: Changed 'students' to 'bomis_db'
            'SELECT * FROM bomis_db WHERE enrollment_no = $1 AND email = $2',
            [enrollment_no, email]
        );
        if (result.rows.length > 0) {
            res.json({ success: true });
        } else {
            res.json({ success: false });
        }
    } catch (err) {
        console.error("Email Verify Error:", err);
        res.status(500).json({ error: "Server error" });
    }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

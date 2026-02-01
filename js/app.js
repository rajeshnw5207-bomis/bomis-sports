const { Resend } = require('resend'); 
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
require('dotenv').config();

const resend = new Resend(process.env.RESEND_API_KEY);
const app = express();

app.use(cors());
app.use(express.json());

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

// Check Enrollment Status
app.get('/api/check-status/:enrollment_no', async (req, res) => {
    try {
        const { enrollment_no } = req.params; 
        const result = await pool.query(
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
        console.error("Database Error:", err);
        res.status(500).json({ error: "Database error" });
    }
});

// Verify Email and Send OTP
app.post('/api/verify-email', async (req, res) => {
    const { enrollment_no, email } = req.body;
    try {
        const result = await pool.query(
            'SELECT student_name FROM bomis_db WHERE enrollment_no = $1 AND TRIM(LOWER(email)) = TRIM(LOWER($2))',
            [enrollment_no, email]
        );

        if (result.rows.length > 0) {
            const otp = Math.floor(100000 + Math.random() * 900000);
            const studentName = result.rows[0].student_name;

            // Log attempt
            console.log(`Sending OTP to: ${email}`);

            const { data, error } = await resend.emails.send({
                from: 'BOMIS Sports <noreply@bomis-lbnagar.com>',
                to: email,
                subject: 'Your Sports Selection OTP',
                html: `<p>Hello ${studentName}, your verification code is <strong>${otp}</strong>.</p>`
            });

            if (error) {
                console.error("Resend Error:", error);
                return res.status(400).json({ success: false, message: "Email delivery failed" });
            }

            res.json({ success: true, otp: otp }); 
        } else {
            res.json({ success: false, message: "Email or Enrollment mismatch" });
        }
    } catch (err) {
        console.error("Server Error:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));



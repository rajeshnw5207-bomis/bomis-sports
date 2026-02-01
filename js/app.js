const { Resend } = require('resend'); 
const resend = new Resend(process.env.RESEND_API_KEY);
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

// FIXED: Table name is 'bomis_db', columns match your Supabase screenshot
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
app.post('/api/verify-email', async (req, res) => {
    const { enrollment_no, email } = req.body; //
    try {
        // Check if the enrollment number and email match in your database
        const result = await pool.query(
            'SELECT student_name FROM bomis_db WHERE enrollment_no = $1 AND email = $2', //
            [enrollment_no, email]
        );

        if (result.rows.length > 0) {
            // 1. Generate a random 6-digit OTP
            const otp = Math.floor(100000 + Math.random() * 900000);
            const studentName = result.rows[0].student_name;

            // 2. Send the REAL email to the student
            await resend.emails.send({
                from: 'BOMIS Sports <onboarding@resend.dev>',
                to: email,
                subject: 'Your Sports Selection OTP',
                html: `<p>Hello ${studentName}, your verification code is <strong>${otp}</strong>.</p>`
            });

            // 3. Send the OTP back to your login.html so it can check the user's input
            res.json({ success: true, otp: otp }); 
        } else {
            res.json({ success: false }); //
        }
    } catch (err) {
        console.error("Email Error:", err);
        res.status(500).json({ error: "Server error" }); //
    }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));


const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());

// Database Connection
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

// Setup Nodemailer with your Google Workspace Account
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'rajesh.j@bomis-lbnagar.com',
        pass: 'tmuz msvd pixk bhcm' // MUST BE THE 16-DIGIT APP PASSWORD
    }
});

// 1. Enrollment Check Route
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

// 2. Email Verification & OTP Route
app.post('/api/verify-email', async (req, res) => {
    const { enrollment_no, email } = req.body;
    
    try {
        // Triple-checked: Using TRIM and LOWER to ensure matching works perfectly
        const result = await pool.query(
            'SELECT student_name FROM bomis_db WHERE enrollment_no = $1 AND TRIM(LOWER(email)) = TRIM(LOWER($2))',
            [enrollment_no, email]
        );

        if (result.rows.length > 0) {
            const otp = Math.floor(100000 + Math.random() * 900000);
            const studentName = result.rows[0].student_name;

            const mailOptions = {
                from: '"BOMIS Sports" <rajesh.j@bomis-lbnagar.com>',
                to: email.trim().toLowerCase(),
                subject: 'Your Sports Selection OTP',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #FF9100; padding: 20px;">
                        <h2 style="color: #FF9100; text-align: center;">BOMIS Sports Selection</h2>
                        <p>Hello <strong>${studentName}</strong>,</p>
                        <p>Your verification code is:</p>
                        <div style="text-align: center; font-size: 32px; font-weight: bold; background: #fdf2e9; padding: 15px; border-radius: 5px; color: #002347;">
                            ${otp}
                        </div>
                        <p style="margin-top: 20px;">Please enter this code on the selection page to proceed.</p>
                    </div>
                `
            };

            await transporter.sendMail(mailOptions);
            res.json({ success: true, otp: otp }); 

        } else {
            // Mismatch found in DB
            res.status(400).json({ success: false, message: "Email mismatch. Please use registered email." });
        }
    } catch (err) {
        console.error("Nodemailer Error:", err);
        res.status(500).json({ success: false, error: "System error. Email failed to send." });
    }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));


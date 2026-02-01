const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();

// 1. UPDATED CORS: Explicitly allowing your GitHub Pages site
app.use(cors({
    origin: 'https://rajeshnw5207-bomis.github.io',
    methods: ['GET', 'POST'],
    credentials: true
}));

app.use(express.json());

// Database Connection
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

// 2. UPDATED NODEMAILER: Using Port 587 for better cloud compatibility
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // Use false for 587 (it will use STARTTLS)
    auth: {
        user: 'rajesh.j@bomis-lbnagar.com',
        pass: 'tmuz msvd pixk bhcm' 
    },
    tls: {
        rejectUnauthorized: false // Helps avoid handshake errors on cloud servers
    }
});

// 1. Enrollment Check Route
app.get('/api/check-status/:enrollment_no', async (req, res) => {
    try {
        const enrollNo = req.params.enrollment_no.trim().toUpperCase();
        const result = await pool.query(
            'SELECT student_name, student_class, section FROM bomis_db WHERE enrollment_no = $1', 
            [enrollNo] 
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
        res.status(500).json({ error: "Database connection error." });
    }
});

// 2. Email Verification & OTP Route
app.post('/api/verify-email', async (req, res) => {
    const { enrollment_no, email } = req.body;
    
    try {
        const enrollNo = enrollment_no.trim().toUpperCase();
        const studentEmail = email.trim().toLowerCase();

        // Matching both Enrollment AND Email
        const result = await pool.query(
            'SELECT student_name FROM bomis_db WHERE enrollment_no = $1 AND TRIM(LOWER(email)) = $2',
            [enrollNo, studentEmail]
        );

        if (result.rows.length > 0) {
            const otp = Math.floor(100000 + Math.random() * 900000);
            const studentName = result.rows[0].student_name;

            const mailOptions = {
                from: '"BOMIS Sports" <rajesh.j@bomis-lbnagar.com>',
                to: studentEmail,
                subject: 'Your Sports Selection OTP',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 2px solid #FF9100; padding: 20px; border-radius: 10px;">
                        <h2 style="color: #FF9100; text-align: center;">BOMIS Sports Selection</h2>
                        <p>Hello <strong>${studentName}</strong>,</p>
                        <p>Your verification code is:</p>
                        <div style="text-align: center; font-size: 36px; font-weight: bold; background: #fdf2e9; padding: 20px; border-radius: 8px; color: #002347; letter-spacing: 5px;">
                            ${otp}
                        </div>
                        <p style="margin-top: 20px; color: #666; font-size: 14px; text-align: center;">Enter this on the website to proceed.</p>
                    </div>
                `
            };

            await transporter.sendMail(mailOptions);
            console.log(`Email sent successfully to ${studentEmail}`);
            res.json({ success: true, otp: otp }); 

        } else {
            res.status(400).json({ success: false, message: "Email mismatch. Use your registered school email." });
        }
    } catch (err) {
        console.error("System Error details:", err);
        res.status(500).json({ success: false, error: "The server could not send the email. Please try again." });
    }
});

// Binding to 0.0.0.0 is critical for Render to detect the port
const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => console.log(`Backend Active on Port ${PORT}`));

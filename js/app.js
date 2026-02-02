require('dotenv').config(); 
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const nodemailer = require('nodemailer');

const app = express();

// Bypass ngrok browser warning for the frontend
app.use((req, res, next) => {
    res.setHeader('ngrok-skip-browser-warning', 'true');
    next();
});

app.use(cors());
app.use(express.json());

// Database Connection
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

// Email Setup using App Password
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'bomis.sports2026@gmail.com', 
        pass: 'jeumkfeffaefxmmc'       
    }
});

// 1. Verify Enrollment (The Primary Gatekeeper)
app.get('/api/check-status/:enrollNo', async (req, res) => {
    try {
        const { enrollNo } = req.params;
        const result = await pool.query('SELECT * FROM bomis_db WHERE enrollment_no = $1', [enrollNo.trim().toUpperCase()]);
        
        if (result.rows.length > 0) {
            const student = result.rows[0];
            
            // If alreadyDone is TRUE, we block them immediately at login
            if (student.selection_status === true) {
                console.log(`🚫 Blocked Login: ${enrollNo} has already submitted.`);
                return res.json({ 
                    verified: true, 
                    alreadyDone: true, 
                    message: "Selection already recorded for this student." 
                });
            }

            // If not submitted, proceed normally
            res.json({ 
                verified: true, 
                alreadyDone: false,
                studentName: student.student_name,
                studentClass: student.student_class
            });
        } else {
            res.json({ verified: false, message: "Enrollment not found." });
        }
    } catch (err) { 
        res.status(500).json({ error: "DB Connection Failed" }); 
    }
});

// 2. Send OTP
app.post('/api/verify-email', async (req, res) => {
    try {
        const { enrollNo, email } = req.body;
        if (!enrollNo || !email) return res.status(400).json({ success: false });

        const result = await pool.query(
            'SELECT * FROM bomis_db WHERE enrollment_no = $1 AND LOWER(email) = LOWER($2)', 
            [enrollNo.toUpperCase(), email.trim()]
        );
        
        if (result.rows.length > 0) {
            const otp = Math.floor(100000 + Math.random() * 900000);
            await transporter.sendMail({
                from: '"BOMIS Sports" <bomis.sports2026@gmail.com>', 
                to: email.trim(),
                subject: 'BOMIS Sports Selection OTP',
                text: `Your OTP is: ${otp}`
            });
            console.log(`✅ OTP ${otp} sent to ${email}`);
            res.json({ success: true, otp: otp, studentClass: result.rows[0].student_class });
        } else {
            res.json({ success: false, message: "Email mismatch." });
        }
    } catch (err) {
        console.error("❌ Mail Error:", err.message);
        res.status(500).json({ error: "Mail/Server Error" });
    }
});

// 3. Live Counts
app.get('/api/live-counts/:studentClass', async (req, res) => {
    try {
        const { studentClass } = req.params;
        const result = await pool.query(`
            SELECT 
                COUNT(*) FILTER (WHERE indoor_selection = 'Chess') as chess,
                COUNT(*) FILTER (WHERE indoor_selection = 'Table Tennis') as tt,
                COUNT(*) FILTER (WHERE outdoor_selection = 'Cricket') as cricket,
                COUNT(*) FILTER (WHERE outdoor_selection = 'Football') as football
            FROM bomis_db WHERE student_class = $1`, [studentClass]);
        
        const counts = result.rows[0];
        res.json({
            chess: parseInt(counts.chess || 0),
            tt: parseInt(counts.tt || 0),
            cricket: parseInt(counts.cricket || 0),
            football: parseInt(counts.football || 0)
        });
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch counts" });
    }
});

// 4. Submit Selection (Safety Lock Added)
app.post('/api/submit-selection', async (req, res) => {
    const { enrollNo, indoor, outdoor } = req.body;
    try {
        // FINAL CHECK: Ensure they didn't somehow bypass the login filter
        const check = await pool.query('SELECT selection_status FROM bomis_db WHERE enrollment_no = $1', [enrollNo.toUpperCase()]);
        
        if (check.rows.length > 0 && check.rows[0].selection_status === true) {
            return res.status(400).json({ success: false, message: "Selection already recorded." });
        }

        await pool.query(
            'UPDATE bomis_db SET indoor_selection = $1, outdoor_selection = $2, selection_status = TRUE WHERE enrollment_no = $3',
            [indoor, outdoor, enrollNo.toUpperCase()]
        );
        console.log(`🎯 Selection saved for ${enrollNo}`);
        res.json({ success: true });
    } catch (err) {
        console.error("❌ Submission Error:", err.message);
        res.status(500).json({ success: false, message: "Database update failed." });
    }
});

app.listen(3000, () => { 
    console.log('✅ Server running on 3000');
});

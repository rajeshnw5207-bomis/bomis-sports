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

// ROUTE: Check student status and enrollment
app.get('/api/check-status/:enrollment_no', async (req, res) => {
    try {
        const enrollNo = req.params.enrollment_no.trim().toUpperCase();
        const result = await pool.query(
            'SELECT student_name, indoor_selection FROM bomis_db WHERE enrollment_no = $1', 
            [enrollNo]
        );
        if (result.rows.length > 0) {
            const alreadyDone = result.rows[0].indoor_selection !== null;
            res.json({ verified: true, studentName: result.rows[0].student_name, alreadyDone });
        } else {
            res.json({ verified: false });
        }
    } catch (err) { res.status(500).json({ error: "DB Error" }); }
});

// ROUTE: Live Dashboard Counts
app.get('/api/live-counts', async (req, res) => {
    try {
        const query = `
            SELECT 
                COUNT(*) FILTER (WHERE indoor_selection = 'Chess') as chess,
                COUNT(*) FILTER (WHERE indoor_selection = 'Table Tennis') as tt,
                COUNT(*) FILTER (WHERE outdoor_selection = 'Cricket') as cricket,
                COUNT(*) FILTER (WHERE outdoor_selection = 'Football') as football
            FROM bomis_db;
        `;
        const result = await pool.query(query);
        res.json({
            chess: parseInt(result.rows[0].chess || 0),
            tt: parseInt(result.rows[0].tt || 0),
            cricket: parseInt(result.rows[0].cricket || 0),
            football: parseInt(result.rows[0].football || 0)
        });
    } catch (err) { res.status(500).json({ error: "DB Error" }); }
});

// ROUTE: Save sports selection
app.post('/api/save-selection', async (req, res) => {
    const { enrollment_no, indoor_game, outdoor_game } = req.body;
    try {
        await pool.query(
            'UPDATE bomis_db SET indoor_selection = $1, outdoor_selection = $2, selection_time = NOW() WHERE enrollment_no = $3',
            [indoor_game, outdoor_game, enrollment_no]
        );
        res.json({ success: true });
    } catch (err) { res.status(500).json({ success: false }); }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Server live on ${PORT}`));

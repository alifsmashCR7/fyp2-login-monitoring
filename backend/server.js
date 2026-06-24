const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
const db = require('./database');

const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = 'fyp_secret_key_123';

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: 'Forbidden' });
        req.user = user;
        next();
    });
};

const calculateRisk = (user, currentIp, currentDevice, currentLocation) => {
    return new Promise((resolve, reject) => {
        let riskScore = 0;
        let rulesTriggered = [];
        let riskLevel = 'Normal';

        db.get(`SELECT * FROM banned_ips WHERE ip_address = ?`, [currentIp], (err, bannedRow) => {
            if (err) return reject(err);

            if (bannedRow) {
                riskScore += 100;
                rulesTriggered.push('Banned IP Address');
            }

            if (user.reg_ip && user.reg_ip !== currentIp) {
                riskScore += 20;
                rulesTriggered.push('Different IP from Registration');
            }

            if (user.reg_location && user.reg_location !== currentLocation) {
                riskScore += 20;
                rulesTriggered.push('Different Location from Registration');
            }

            if (user.reg_device && user.reg_device !== currentDevice) {
                riskScore += 20;
                rulesTriggered.push('Unrecognized Device/Browser');
            }

            try {
                const dateStr = new Date().toLocaleString("en-US", { timeZone: 'Asia/Kuala_Lumpur', hour: 'numeric', hour12: false });
                const currentLocalHour = parseInt(dateStr, 10);

                if (currentLocalHour >= 1 && currentLocalHour <= 5) {
                    riskScore += 20;
                    rulesTriggered.push('Unusual Time (GMT+8)');
                }
            } catch (e) { }

            db.get(
                `SELECT COUNT(*) as failCount FROM login_logs WHERE user_id = ? AND status = 'Failed' AND login_time >= datetime('now', '-15 minutes')`,
                [user.id],
                (err, fails) => {
                    if (err) return reject(err);

                    if (fails && fails.failCount >= 3) {
                        riskScore += 40;
                        rulesTriggered.push('Multiple Failed Attempts');
                    }

                    if (riskScore >= 70) riskLevel = 'High Risk';
                    else if (riskScore >= 30) riskLevel = 'Suspicious';

                    resolve({
                        score: riskScore,
                        level: riskLevel,
                        rules: JSON.stringify(rulesTriggered)
                    });
                }
            );
        });
    });
};

app.post('/api/register', async (req, res) => {
    const { username, email, password, location } = req.body;
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
    const device = req.headers['user-agent'] || 'Unknown Browser';
    const regLocation = location || 'Kajang, Malaysia';
    const regTimezone = 'Asia/Kuala_Lumpur';

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        db.run(
            `INSERT INTO users (username, email, password, reg_ip, reg_location, reg_timezone, reg_device) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [username, email, hashedPassword, ip, regLocation, regTimezone, device],
            function (err) {
                if (err) return res.status(400).json({ error: 'Username or email already exists' });
                res.status(201).json({ message: 'User registered successfully', userId: this.lastID });
            }
        );
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/login', (req, res) => {
    const { email, password, location } = req.body;
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
    const device = req.headers['user-agent'] || 'Unknown Browser';
    const currentLocation = location || 'Kajang, Malaysia';

    db.get(`SELECT * FROM users WHERE email = ?`, [email], async (err, user) => {
        if (err) return res.status(500).json({ error: 'Server error' });
        if (!user) return res.status(401).json({ error: 'Invalid credentials' });

        if (user.is_locked === 1) {
            db.run(`INSERT INTO login_logs (user_id, ip_address, device, location, status, risk_level, risk_score, rules_triggered) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [user.id, ip, device, currentLocation, 'Failed (Locked)', 'High Risk', 100, '["Attempted login on locked account"]']);
            return res.status(403).json({ error: 'Account has been locked by Administrator.' });
        }

        const validPassword = await bcrypt.compare(password, user.password);

        if (!validPassword) {
            db.run(`INSERT INTO login_logs (user_id, ip_address, device, location, status, risk_level, risk_score, rules_triggered) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [user.id, ip, device, currentLocation, 'Failed', 'Normal', 0, '[]']);
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        if (user.is_two_factor_enabled) {
            return res.json({ requires2FA: true, userId: user.id });
        }

        try {
            const riskData = await calculateRisk(user, ip, device, currentLocation);
            db.run(`INSERT INTO login_logs (user_id, ip_address, device, location, status, risk_level, risk_score, rules_triggered) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [user.id, ip, device, currentLocation, 'Success', riskData.level, riskData.score, riskData.rules],
                function (err) {
                    if (err) return res.status(500).json({ error: 'Error logging login' });
                    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1h' });
                    res.json({ token, user: { id: user.id, username: user.username, role: user.role, is_two_factor_enabled: user.is_two_factor_enabled } });
                }
            );
        } catch (error) {
            res.status(500).json({ error: 'Risk calculation failed' });
        }
    });
});

app.post('/api/login/verify-2fa', (req, res) => {
    const { userId, token: twoFactorCode, location } = req.body;
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
    const device = req.headers['user-agent'] || 'Unknown Browser';
    const currentLocation = location || 'Kajang, Malaysia';

    db.get(`SELECT * FROM users WHERE id = ?`, [userId], async (err, user) => {
        if (err || !user) return res.status(500).json({ error: 'Server error' });

        if (user.is_locked === 1) {
            return res.status(403).json({ error: 'Account has been locked by Administrator.' });
        }

        const isValid = speakeasy.totp.verify({
            secret: user.two_factor_secret,
            encoding: 'base32',
            token: twoFactorCode
        });

        if (!isValid) {
            db.run(`INSERT INTO login_logs (user_id, ip_address, device, location, status, risk_level, risk_score, rules_triggered) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [user.id, ip, device, currentLocation, 'Failed (Invalid 2FA)', 'Normal', 0, '[]']);
            return res.status(401).json({ error: 'Invalid 2FA Code' });
        }

        try {
            const riskData = await calculateRisk(user, ip, device, currentLocation);
            db.run(`INSERT INTO login_logs (user_id, ip_address, device, location, status, risk_level, risk_score, rules_triggered) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [user.id, ip, device, currentLocation, 'Success', riskData.level, riskData.score, riskData.rules],
                function (err) {
                    if (err) return res.status(500).json({ error: 'Error logging login' });
                    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1h' });
                    res.json({ token, user: { id: user.id, username: user.username, role: user.role, is_two_factor_enabled: user.is_two_factor_enabled } });
                }
            );
        } catch (error) {
            res.status(500).json({ error: 'Risk calculation failed' });
        }
    });
});

app.get('/api/2fa/setup', authenticateToken, async (req, res) => {
    db.get(`SELECT email FROM users WHERE id = ?`, [req.user.id], async (err, user) => {
        if (err || !user) return res.status(500).json({ error: 'User not found' });

        const secret = speakeasy.generateSecret({
            name: `StudentWebTest (${user.email})`
        });

        try {
            const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url);
            res.json({ secret: secret.base32, qrCodeUrl });
        } catch (error) {
            res.status(500).json({ error: 'Failed to generate QR code' });
        }
    });
});

app.post('/api/2fa/enable', authenticateToken, (req, res) => {
    const { token, secret } = req.body;

    const isValid = speakeasy.totp.verify({
        secret: secret,
        encoding: 'base32',
        token: token
    });

    if (isValid) {
        db.run(`UPDATE users SET two_factor_secret = ?, is_two_factor_enabled = 1 WHERE id = ?`, [secret, req.user.id], (err) => {
            if (err) return res.status(500).json({ error: 'Database error' });
            res.json({ success: true });
        });
    } else {
        res.status(400).json({ error: 'Invalid verification code' });
    }
});

app.post('/api/2fa/disable', authenticateToken, (req, res) => {
    db.run(`UPDATE users SET two_factor_secret = NULL, is_two_factor_enabled = 0 WHERE id = ?`, [req.user.id], (err) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.json({ success: true });
    });
});

app.get('/api/logs/student', authenticateToken, (req, res) => {
    db.all(`SELECT * FROM login_logs WHERE user_id = ? ORDER BY id DESC LIMIT 10`, [req.user.id], (err, rows) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.json(rows);
    });
});

app.get('/api/student/portal-data', authenticateToken, (req, res) => {
    db.all(`SELECT * FROM announcements ORDER BY date DESC LIMIT 5`, [], (err, announcements) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        
        db.all(`SELECT * FROM courses`, [], (err, courses) => {
            if (err) return res.status(500).json({ error: 'Database error' });
            res.json({ announcements, courses });
        });
    });
});

app.get('/api/admin/logs', (req, res) => {
    db.all(`SELECT login_logs.*, users.username, users.email, users.reg_ip, users.reg_location, users.reg_device FROM login_logs JOIN users ON login_logs.user_id = users.id ORDER BY login_logs.id DESC`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.json(rows);
    });
});

app.get('/api/admin/users', (req, res) => {
    db.all(`SELECT id, username, email, reg_ip, reg_location, reg_device, is_locked FROM users`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.json(rows);
    });
});

app.post('/api/admin/lock-user', (req, res) => {
    const { username } = req.body;
    db.run(`UPDATE users SET is_locked = 1 WHERE username = ?`, [username], function (err) {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.json({ success: true });
    });
});

app.post('/api/admin/unlock-user', (req, res) => {
    const { username } = req.body;
    db.run(`UPDATE users SET is_locked = 0 WHERE username = ?`, [username], function (err) {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.json({ success: true });
    });
});

app.post('/api/admin/resolve-alert', (req, res) => {
    const { logId } = req.body;
    db.run(`DELETE FROM login_logs WHERE id = ?`, [logId], function (err) {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.json({ success: true });
    });
});

app.post('/api/debug/inject-log', (req, res) => {
    const { userId, ipAddress, device, location, status, riskLevel, riskScore, rulesTriggered, customTime } = req.body;
    const time = customTime ? new Date(customTime).toISOString() : new Date().toISOString();

    db.run(`INSERT INTO login_logs (user_id, ip_address, device, location, status, risk_level, risk_score, rules_triggered, login_time) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [userId, ipAddress, device, location, status, riskLevel, riskScore, JSON.stringify(rulesTriggered), time],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true, logId: this.lastID });
        }
    );
});

app.post('/api/debug/add-user', async (req, res) => {
    const randomNum = Math.floor(Math.random() * 10000);
    const username = `temp_user_${randomNum}`;
    const email = `temp${randomNum}@example.test`;
    const ip = '192.168.1.100';
    const device = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';
    const location = 'Kajang, Malaysia';
    const regTimezone = 'Asia/Kuala_Lumpur';

    try {
        const hashedPassword = await bcrypt.hash('password123', 10);
        db.run(
            `INSERT INTO users (username, email, password, reg_ip, reg_location, reg_timezone, reg_device) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [username, email, hashedPassword, ip, location, regTimezone, device],
            function (err) {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ success: true, id: this.lastID, username, email });
            }
        );
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.delete('/api/debug/clear-logs', (req, res) => {
    db.run(`DELETE FROM login_logs`, [], (err) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.json({ success: true });
    });
});

const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Backend server running on port ${PORT}`);
});
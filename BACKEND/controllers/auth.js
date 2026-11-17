const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const userFilePath = path.join(__dirname, "../data/users.json");

function safeEqual(a, b)
{
    const hashA = crypto.createHash('sha256').update(String(a)).digest();
    const hashB = crypto.createHash('sha256').update(String(b)).digest();

    return crypto.timingSafeEqual(hashA, hashB);
}

exports.Auth = async (req, res, next) =>
{
    try
    {
        let users = JSON.parse(await fs.readFile(userFilePath, 'utf8'));
        let sent = req.get('x-auth');

        if (users[0] && sent && safeEqual(users[0].password, sent))
        {
            return next();
        }
        return res.status(401).json({success: false, message: "Acceso no autorizado"});
    } catch (err)
    {
        return res.status(500).json({success: false, message: err.message});
    }
}
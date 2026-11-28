const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const multer = require('multer');

const UPLOAD_DIR = path.join(__dirname, '../../assets/products');
fs.mkdirSync(UPLOAD_DIR, {recursive: true});

const EXT = {'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/gif': '.gif'};

const upload = multer
({
    storage: multer.diskStorage
    ({
        destination: (req, file, cb) => cb(null, UPLOAD_DIR),
        filename: (req, file, cb) => cb(null, crypto.randomUUID() + EXT[file.mimetype])
    }),
    limits: {fileSize: 5 * 1024 * 1024},
    fileFilter: (req, file, cb) =>
    {
        if (EXT[file.mimetype]) return cb(null, true);
        cb(new Error('Solo se permiten imágenes JPG, PNG, WebP o GIF'));
    }
}).single('image');

module.exports = (req, res, next) => upload(req, res, (err) =>
{
    if (!err) return next();
    const message = err.code === 'LIMIT_FILE_SIZE' ? 'La imagen no puede pesar más de 5 MB' : err.message;
    res.status(400).json({success: false, message});
});

module.exports.UPLOAD_DIR = UPLOAD_DIR;
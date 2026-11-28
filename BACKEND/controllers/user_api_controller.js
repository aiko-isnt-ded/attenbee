const User = require('../models/user');
const bcrypt = require('bcrypt');

exports.changeUserPassword = async (req, res) =>
{
    try
    {
        const {current_password, new_password, confirm_password} = req.body;

        if (!new_password || new_password.length < 4 || new_password.length > 72)
        {
            return res.status(400).json({success: false, message: "La contraseña no es válida"});
        }

        if (new_password !== confirm_password)
        {
            return res.status(400).json({success: false, message: "Las contraseñas nuevas no son iguales"});
        }

        const user = await User.findOne();
        if (!user)
        {
            return res.status(404).json({success: false, message: "Usuario no encontrado"});
        }

        const matches = await bcrypt.compare(String(current_password || ''), user.password);
        if (!matches)
        {
            return res.status(401).json({success: false, message: "La contraseña actual es incorrecta"});
        }

        user.password = await bcrypt.hash(new_password, 10);
        await user.save();   

        return res.status(200).json({success: true, message: "Actualización exitosa!"});
    } catch (err)
    {
        return res.status(500).json({success: false, message: err.message});
    }
};

exports.loginUser = async (req, res) =>
{
    try
    {
        const {password} = req.body;

        const user = await User.findOne();
        if (!user)
        {
            return res.status(404).json({success: false, message: "Usuario no encontrado"});
        }

        const matches = await bcrypt.compare(String(password || ''), user.password);
        if (!matches)
        {
            return res.status(401).json({success: false, message: "Contraseña incorrecta!"});
        }

        return res.status(200).json({success: true, message: "Sesión iniciada exitosamente"});
    } catch (err)
    {
        return res.status(500).json({success: false, message: err.message});
    }
};

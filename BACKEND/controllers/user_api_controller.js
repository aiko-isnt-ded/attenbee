const fs = require('fs').promises;
const path = require('path');

const userFilePath = path.join(__dirname, "../data/users.json");

async function readUsers()
{
    let data = await fs.readFile(userFilePath, 'utf8');
    return JSON.parse(data);
}

async function writeUsers(users)
{
    await fs.writeFile(userFilePath, JSON.stringify(users, null, 2), 'utf8');
}

exports.changeUserPassword = async (req, res) =>
{
    try
    {
        const {current_password, new_password, confirm_password} = req.body;

        if (!new_password || new_password.length < 4)
        {
            return res.status(400).json({success:false, message: "La contraseña no es válida"});
        }

        if (new_password !== confirm_password)
        {
            return res.status(400).json({success:false, message: "Las contraseñas nuevas no son iguales"});
        }

        let users = await readUsers();

        let user = users[0];

        if (!user)
        {
            return res.status(404).json({success:false, message: "Usuario no encontrado"});
        }

        if (user.password !== current_password)
        {
            return res.status(401).json({success:false, message: "La contraseña actual es incorrecta"});
        }

        user.password = new_password;
        user.updatedAt = new Date().toISOString();

        await writeUsers(users);

        return res.status(200).json
        ({
            success: true,
            message: "Actualización exitosa!"
        });
    } catch (err)
    {
        return res.status(500).json({success: false, message:err.message});
    }
}

exports.loginUser = async (req, res) =>
{
    try
    {
        let {password} = req.body;
        let users = await readUsers();
        let user = users[0];

        if (!user)
        {
            return res.status(404).json({success: false, message: "Usuario no encontrado"});
        }

        if (user.password !== password)
        {
            return res.status(401).json({success: false, message: "Contraseña incorrecta!"});
        }

        return res.status(200).json({success: true, message: "Sesión iniciada exitosamente"});
    } catch (err)
    {
        return res.status(500).json({success: false, message: err.message});
    }
}

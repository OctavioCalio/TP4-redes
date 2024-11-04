const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const conectarDB = require('./db');
const Usuario = require('./usuarios/usuarios');
const path = require('path');


dotenv.config({ path: path.join(__dirname, '../.env') });
conectarDB();


const app = express();
const PORT = process.env.PORT || 3004;

app.use(cors());
app.use(express.json());

//ruta de registro
app.post('/registro', async (req, res) => {
    try {
        const {nombre, email, password} = req.body;
        const usuario = new Usuario({
            nombre,
            email,
            password
        });
        await usuario.save();
        
        const token = jwt.sign(
            { id: usuario._id, nombre: usuario.nombre },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.status(201).json({
            mensaje: 'Usuario creado exitosamente',
            token
        });
    } catch (error){
        res.status(500).json({
            error: error.message
        });
    }
});

//ruta logion

app.post('/login', async (req, res) => {
    console.log('Recibida petición de login: ', req.body);
    try {
        const { email, password } = req.body;
        console.log('Buscando usuario con email:', email);
        const usuario = await Usuario.findOne({ email, password });
        console.log('Usuario encontrado:', usuario);
        
        if (!usuario) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        const token = jwt.sign(
            { id: usuario._id, nombre: usuario.nombre },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );
        return res.json({ token });
        
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Index corriendo en el puerto ${PORT}`);
})
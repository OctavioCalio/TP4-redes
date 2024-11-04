const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware'); 
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const app = express();
app.use(express.json());
const PORT = process.env.PORT || 3000;

//Middleware jwt

const verificarToken = (req, res, next) => {
    console.log('Headers recibidos:', req.headers);
    const token = req.headers['authorization'];
    if (!token) {
        console.log('No se encontró token');
        return res.status(401).json({
            error: 'Token no proporcionado'
        });
    }
    try {
        const decoded = jwt.verify(token.split(' ')[1], process.env.JWT_SECRET);
        req.usuario = decoded;
        console.log('Token decodificado:', decoded);
        next();
    } catch (error) {
        console.log('Error al verificar token:', error.message);
        return res.status(401).json({ error: 'Token inválido' })
    }
};

//rutas publicas. Iban a ser con http-proxy-middleware, pero me estaban dando problemas

app.post('/index/login', async (req, res) => {
    try {
        const response = await fetch('http://localhost:3004/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(req.body)
        });
        
        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.log('Error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/index/registro', async (req, res) => {
    try {
        const response = await fetch('http://localhost:3004/registro', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(req.body)
        });
        
        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.log('Error:', error);
        res.status(500).json({ error: error.message });
    }
});

//rutas protegidas

app.use('/lugares', verificarToken, (req, res, next) => {
    console.log('Petición interceptada lugares:', req.url);
    next();
}, createProxyMiddleware({
    target: 'http://localhost:3002/lugares',
    changeOrigin: true,
    logLevel: 'debug'
}));
app.use('/distancia', verificarToken, (req, res) => {
    const url = `http://localhost:3001/distancia${req.url}`;
    console.log('Redirigiendo a:', url);

    fetch(url)
        .then(response => response.json())
        .then(data => res.json(data))
        .catch(error => res.status(500).json({ error: error.message }));

    //tuve que usar una redirección directa. El proxy middleware por algún motivo no manejaba bien las rutas (o yo no supe configurarlo)
    //el middleware podría haber modificado la estructura de la url cuando hacía la redirección.
    //como acá tuve que mandar un array en la url, eso podría haberlo roto. En los otros endpoints, las url son más simples        
});
app.post('/ia', verificarToken, async (req, res) => {
    //Con esto obtengo el id del usuario:
    const decoded = jwt.verify(req.headers['authorization'].split(' ')[1], process.env.JWT_SECRET);
    
    try {
        //esto prepara los datos para enviar a la IA
        const bodyData = {
            pregunta: req.body.pregunta,
            ubicacion: req.body.ubicacion,
            userId: decoded.id
        };
          
       //realiza la petición al servicio de la ia usando fetch
        const response = await fetch(`http://localhost:${process.env.PORT_IA}/consulta`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(bodyData)
        });
        //obtiene y envía la respuesta	    
        const data = await response.text(); // Cambiamos a text() para ver el contenido raw  
        res.send(data);
    } catch (error) {
        console.log('Error detallado:', error);
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => {
    console.log('Gateway corriendo en el puerto', PORT);
})
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const { Client } = require('@googlemaps/google-maps-services-js'); //La implementación de client debe ser con mayúscula
const path = require('path');
dotenv.config({ path: path.join(__dirname, '../.env') });
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const mapsClient = new Client({
 key: process.env.GOOGLE_MAPS_API_KEY
});

app.use(cors());
app.use(express.json());



//Verficar el servicio:

app.get('/salud', (req, res) => {
    res.json({
        estado: 'Servicio de ubicación funcionando'
    })
})

//obtener distancia entre dos puntos: 

app.get('/distancia', async (req, res) => {
    
    console.log('Solicitud de distancia recibida');
    const origen = '-32.396450, -63.244248';
    const { lugares } = req.query;

    try {

         const lugaresArray = JSON.parse(lugares);
         const destinations = lugaresArray.map(lugar=>`${lugar.geometry.location.lat},${lugar.geometry.location.lng}`)


        const response = await mapsClient.distancematrix({
            params: {
                origins: [origen],
                destinations: destinations,
                key: process.env.GOOGLE_MAPS_API_KEY
            }
        });

        const distancias = {};
        lugaresArray.forEach((lugar, index) => {
            distancias[lugar.place_id] = response.data.rows[0].elements[index].distance.text;
        });


        res.json({
           
           distancias
            // distancia: response.data.rows[0].elements[0].distance.text,
           // duracion: response.data.rows[0].elements[0].duration.text
        });

    } catch (error) {
        console.log('Error detallado: ', error)
        res.status(500).json({
            error: error.message
        });
    }


})

app.listen(PORT, () => {
    console.log(`Servidor de ubicación corriendo en el puerto ${PORT}`);
})
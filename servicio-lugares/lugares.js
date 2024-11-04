const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const { Client } = require('@googlemaps/google-maps-services-js');
dotenv.config({ path: path.join(__dirname, '../.env') });


const app = express();
const PORT = process.env.PORT_PLACES || 3002;
const mapsClient = new Client({
    key: process.env.GOOGLE_MAPS_API_KEY
});

app.use(cors());
app.use(express.json());

//obbtener lugares

app.get('/lugares', async (req, res) => {
    const { busqueda, location } = req.query;
    const ubicacionDefault = '-32.396450, -63.244248'; //Leibnitz por defecto


    try {
        const response = await mapsClient.placesNearby({
            params: {
                location: location || ubicacionDefault,
                radius: 2000,
                keyword: busqueda || 'restaurante',
                key: process.env.GOOGLE_MAPS_API_KEY
            }
        })
        res.json(response.data.results);
    } catch (error) {
        console.log('Error detallado: ', error)
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor de lugares corriendo en el puerto ${PORT}`);
})

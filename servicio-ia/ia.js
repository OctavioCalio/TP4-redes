const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const { CohereClient } = require('cohere-ai');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });


const cohere = new CohereClient({
    token: process.env.CO_API_KEY,
});

const app = express();
const PORT = process.env.PORT || 3003;

app.use(cors());
app.use(express.json());

//procesar consulta

app.post('/consulta', async (req, res) => {
    const { pregunta, ubicacion, userId} = req.body;
    
    try {
        // 1. Obtener lugares
        const lugaresResponse = await fetch(`http://localhost:3002/lugares?busqueda=${encodeURI(pregunta)}&location=${ubicacion}`);
        const lugares = await lugaresResponse.json();
        if (lugares.length === 0) {
            return res.status(404).json({ error: 'No se encontraron lugares que coincidan con tu búsqueda.' });
        }

        // 2. Obtener distancias
        const lugaresParaDistancia = lugares.map(lugar => ({
            place_id: lugar.place_id,
            geometry: lugar.geometry
        }));
        
        const distanciasResponse = await fetch(`http://localhost:3001/distancia?lugares=${JSON.stringify(lugaresParaDistancia)}`);
        const distancias = await distanciasResponse.json();

        // 3. Combinar datos
        const lugaresResumidos = lugares.map(lugar => ({
            nombre: lugar.name,
            valoracion: lugar.rating,
            reseñas: lugar.user_ratings_total,
            abierto: lugar.opening_hours?.open_now,
            direccion: lugar.vicinity,
            distancia: distancias.distancias[lugar.place_id]
        }));
        

        //prompt para cohere

        const prompt = `
        [INSTRUCCIONES]
      Tenés que responder solo en español.
      Tenés que responder de forma breve.
    
      mostrá un máximo de 3 lugares.
    

      Pregunta: "${pregunta}"
      Datos: ${JSON.stringify(lugaresResumidos)}

      Formato de respuesta:

      Estos son los mejores lugares en base a las valoraciones, ubicación y distancia:

      ==================
       NOMBRE: [NOMBRE]
      • Valoración: [X.X]/5
      • Reseñas: [número] opiniones
      • Estado: [Abierto/Cerrado]
      • Ubicación: [dirección]
      • Distancia: [X.X] km
      ==================
    
      FIN DE LA RESPUESTA

      `;

        //Consultar a cohere

        const response = await cohere.generate({
            model: 'command',
            prompt: prompt,
            max_tokens: 300,
            temperature: 0.0,
            stop_sequence: "FIN DE LA RESPUESTA"
        });

        res.send(response.generations[0].text);

    } catch (error) {
        console.log('Error detallado: ', error)
        res.status(500).json({
            error: error.message
        })
    }

});

app.listen(PORT, () => {
    console.log(`Servidor de IA corriendo en el puerto ${PORT}`);
})
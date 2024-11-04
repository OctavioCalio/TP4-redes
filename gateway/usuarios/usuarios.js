const mongoose = require('mongoose');

const usuarioSchema = new mongoose.Schema({
    nombre: String,
    email: {
        type: String,
        unique: true,
        required: true
    },
    password: {
        type: String,
        required: true
    }
});

module.exports = mongoose.model('Usuario', usuarioSchema);
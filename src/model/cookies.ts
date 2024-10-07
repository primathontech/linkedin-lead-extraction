// import mongoose from 'mongoose'
const mongoose = require('mongoose');

const Schema = mongoose.Schema;


const CookiesStoreSchema = new Schema({
    cookie: { type: String, required: true },
    profileUrn: { type: String, required: true },
});

const CookiesStoreModel = mongoose.model('CookiesStoreModel', CookiesStoreSchema);

// module.exports = CookiesStoreModel;
export default CookiesStoreModel;



const mongoose = require("mongoose")
const Schema = mongoose.Schema

// Create Schema
const ProductSchema = new Schema({
    blockchainId: {
        type: Number
    },
    name: {
        type: String
    },
    category: {
        type: String
    },
    ipfsImageHash: {
        type: String
    },
    ipfsDescHash: {
        type: String
    },
    createdAt: {
        type: Number
    },
    price: {
        type: Number
    },
    condition: {
        type: Number
    }
})

module.exports = Product = mongoose.model("products", ProductSchema)
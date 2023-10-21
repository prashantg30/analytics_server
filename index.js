const express = require('express');
const app = express();
const cors = require('cors');
const body_parser = require('body-parser');
const { router } = require('./router/router.js');
require("dotenv").config();
const conn = require('./config/db.config');

app.use(cors());
app.use(body_parser.json());
app.use(body_parser.urlencoded({ extended: true }));
app.use(router);
app.listen(process.env.APP_PORT, () => {
    console.log(`App running on port ${process.env.APP_PORT}`)
    // console.log = function(){}
})
const path = require('path');

require('dotenv').config({
    path: path.join(__dirname, `../.env.${process.env.NODE_ENV || 'development'}`)
});

require('babel-core/register');
require('./server');

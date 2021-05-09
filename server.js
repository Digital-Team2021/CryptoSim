'use strict';
//app depandancies
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const superagent = require('superagent');
const pg = require('pg');
const methodOverride = require('method-override');
//app setup
const server = express();
server.use(cors());
server.use(express.static('public'));
server.set('view engine', 'ejs');
const PORT = process.env.PORT || 4500;
const client = new pg.Client(process.env.DATABASE_URL);
server.use(express.urlencoded({ extended: true }));
server.use(methodOverride('_method'));



server.get('/', (req, res) => {


  res.render('pages/index');

});


///root
server.listen(PORT, () => {
  console.log(`listening on port ${PORT}`);
});

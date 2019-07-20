'use strict';

// in glitch environment, you don't need dotenv but you need one on your own
require('dotenv').config();

const assert      = require('assert');
const express     = require('express');
const bodyParser  = require('body-parser');
const fccTesting  = require('./freeCodeCamp/fcctesting.js');
const session     = require('express-session');
const routes      = require('./routes.js');
const auth        = require('./auth.js');
const MongoClient = require('mongodb').MongoClient;


const app = express();

fccTesting(app); //For FCC testing purposes

app.use('/public', express.static(process.cwd() + '/public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.set('view engine', 'pug')



// for mongo 3.0+, connect passes client instead of db 
MongoClient.connect(process.env.DATABASE, {useNewUrlParser: true }, (err, client) => { 
    // if(err) {
    //     console.log('Database error: ' + err);
    // } else {
        assert.equal(null, err);
        console.log('Successful database connection');
        
        const db = client.db(process.env.DB_NAME);
        
        // run external auth and routes passing app and db
        auth(app, db);
        routes(app, db);

        app.listen(process.env.PORT || 3000, () => {
          console.log("Listening on port " + process.env.PORT);
        });  
});

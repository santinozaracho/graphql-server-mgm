
const functions = require('firebase-functions');

const admin = require('firebase-admin');

const express = require('express');

const { ApolloServer } = require('apollo-server-express');

const cors = require('cors');

const compression = require('compression');

const schema = require('./schema');


//const bodyParser = require('body-parser');

const appExpress = express();

//Initialize Google Cloud
//admin.initializeApp();

//Middlewares

//appExpress.use(bodyParser.json());

//appExpress.use(bodyParser.urlencoded({extended:false}));

appExpress.use(compression());

//CORS
appExpress.use('*', cors({origin:true}) );

const server = new ApolloServer({
    schema,
    introsprection: true,
    playground: true
});

server.applyMiddleware({ app:appExpress })


//Enrutamiento Medicamentos..
//server.get('/graphql', "hola");

//Port 
appExpress.set('port', process.env.PORT || 4000 );

//Listen
appExpress.listen( appExpress.get('port'), () => { console.log("La API se Incio...", appExpress.get('port')) });

//Exports
exports.appExpress = functions.https.onRequest(appExpress);
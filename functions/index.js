
const functions = require('firebase-functions');

const admin = require('firebase-admin');

const express = require('express');

const { ApolloServer } = require('apollo-server-express');

const cors = require('cors');

const compression = require('compression');

const schema = require('./schema');

//const context = require('./database.js');

//Imports
//const admin = require('firebase-admin');

//Initialize Google Cloud
var serviceAccount = require("./serviceAccount.json");

admin.initializeApp({ credential: admin.credential.cert(serviceAccount), databaseURL: "https://modulogestionmedicamentos.firebaseio.com"});


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
    context: async () => ({
        dbMedicines: await admin.firestore().collection('medicamentos'),
        dbAssignments: await admin.firestore().collection('asignaciones')
    }),
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
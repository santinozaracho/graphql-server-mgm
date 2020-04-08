
//Google Service Account
var serviceAccount = require("./serviceAccount.json");

//Imports
const functions = require('firebase-functions');

const admin = require('firebase-admin');

const express = require('express');

const { ApolloServer } = require('apollo-server-express');

const bodyParser = require('body-parser');

const cors = require('cors');

const DataLoader = require('dataloader');

const schema = require('./graphql/schema');

//const resolvers = require('./graphql/resolvers');

//const context = require('./database.js');

//Initialize Google Cloud
admin.initializeApp({ credential: admin.credential.cert(serviceAccount), databaseURL: "https://modulogestionmedicamentos.firebaseio.com"});

//Initialize Express.js Server
const appGraphQL = express();

//Middlewares and CORS
appGraphQL.use(bodyParser.json());

appGraphQL.use(bodyParser.urlencoded({extended:false}));

appGraphQL.use( cors() );

//DataLoaders


//Initialize ApolloServer
const server = new ApolloServer({
    schema,
    dataSources: () => ({
          dbMedicines: admin.firestore().collection('medicamentos'),
          dbAssignments: admin.firestore().collection('asignaciones'),
          dbMedics: admin.firestore().collection('medicos')
        }),
    //context: () => ({ }),
    playground:true,
    introspection:true
});

//Join Express.js server with Apollo GraphQL Server
server.applyMiddleware({ app:appGraphQL, path:'/' })


//Port 
appGraphQL.set('port', process.env.PORT || 4000 );

//Listen
appGraphQL.listen( appGraphQL.get('port'), () => { console.log("La API se Incio...", appGraphQL.get('port')) });

//Exports to Google Cloud Functions
exports.appGraphQL = functions.https.onRequest(appGraphQL);
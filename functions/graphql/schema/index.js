
require('graphql-import-node');

const { makeExecutableSchema } = require('graphql-tools')

const typeDefs = require('./schema.graphql');

const resolvers = require('../resolvers');

module.exports = makeExecutableSchema({ typeDefs, resolvers });

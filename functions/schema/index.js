
require('graphql-import-node');

const { GraphQLSchema } = require('graphql')

const { makeExecutableSchema } = require('graphql-tools')

const typeDefs = require('./schema.graphql');

const resolvers = require('./resolvers');

module.exports = makeExecutableSchema({
  typeDefs,
  resolvers
})

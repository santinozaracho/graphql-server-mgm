const { IResolvers } = require('graphql-tools');
const { getMedicines } = require('./database.js')


module.exports = {
  
    Query: {
      async medicines() {await getMedicines()}
    }
  };
  
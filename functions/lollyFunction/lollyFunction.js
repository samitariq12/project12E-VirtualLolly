const { ApolloServer, gql } = require('apollo-server-lambda')

const faunadb = require('faunadb')
const q = faunadb.query;
const axios = require("axios");

require('dotenv').config();

const typeDefs = gql`
  type Query {
    getAllLollies: [Lolly]
  }
  type Lolly {
    recipientName: String!
    message: String!
    sender: String!
    flavourTop: String!
    flavourMid: String!
    flavourBottom: String!
    lollyPath: String!
  }
  type Mutation {
    createLolly (recipientName: String!, message: String!,sender: String!, flavourTop: String!,flavourMid: String!,flavourBottom: String!, lollyPath: String!) : Lolly
  }
`


const resolvers = {
  Query: {
    getAllLollies: async () => {
      const client = new faunadb.Client({secret: process.env.GATSBY_FAUNADB_SECRET})
      var result = await client.query(
        q.Map(
          q.Paginate(q.Match(q.Index("allLollies"))),
          q.Lambda((x) => q.Get(x))
        )
      );
      let x = [];
      result.data.map((curr) => {
        x.push(curr.data);
      });

      return x;
    },
  },
  Mutation: {
    createLolly: async (_, args) =>{
      console.log(args)
      const client = new faunadb.Client({secret: process.env.GATSBY_FAUNADB_SECRET})

      const result = await client.query(
        q.Create(q.Collection("Lolly"), {
          data: args
        })
      )

      axios
      .post("https://api.netlify.com/build_hooks/5fecd89fe8dbfb00f5ca0c2b")
      .then(function (response) {
        console.log("from mutation: ", response);
      })
      .catch(function (error) {
        console.error(error);
      });

      console.log(result);
      console.log(result.data);
      return result.data;
    }
  }
}

const server = new ApolloServer({
  typeDefs,
  resolvers,
})

const handler = server.createHandler()

module.exports = { handler }

var express = require('express');
var bodyParser =require('body-parser');
var graphqlExpress = require('express-graphql');
var graphiqlExpress = require('express-graphql');
const ExpressGraphQL = require("express-graphql");
var schema =require("./schema");

const app = express();

// app.use('/graphql', bodyParser.json(), graphqlExpress({
//   schema,
//   context: {},
// }));

// app.use('/graphiql', graphiqlExpress({
//   endpointURL: '/graphql'
// }));

var cors = require('cors')
app.use(cors())
app.use("/graphql", ExpressGraphQL({ schema: schema, graphiql: true}));
app.use("/eligibility", ExpressGraphQL({ schema: schema, graphiql: true}))
app.use("/claimstatus", ExpressGraphQL({ schema: schema, graphiql: true}))
app.use("/common_data", ExpressGraphQL({ schema: schema, graphiql: true}))
app.use("/claims_837", ExpressGraphQL({ schema: schema, graphiql: true}))
app.use("/claim_details", ExpressGraphQL({ schema: schema, graphiql: true}))
app.use("/match_claims", ExpressGraphQL({ schema: schema, graphiql: true}))
app.use("/users", ExpressGraphQL({ schema: schema, graphiql: true}))
app.use("/enrollment", ExpressGraphQL({ schema: schema, graphiql: true}))
app.use("/enrollment_details", ExpressGraphQL({ schema: schema, graphiql: true}))
app.use("/full_file", ExpressGraphQL({ schema: schema, graphiql: true}))
app.use("/real_time_claim", ExpressGraphQL({ schema: schema, graphiql: true}))
app.use("/claim_processing", ExpressGraphQL({ schema: schema, graphiql: true}))
app.use("/real_time_claim_details", ExpressGraphQL({ schema: schema, graphiql: true}))
app.use("/TradingPartner", ExpressGraphQL({ schema: schema, graphiql: true}))

app.listen(4000, () => console.log(
  `GraphQL Server running on http://localhost:4000/graphql`
));
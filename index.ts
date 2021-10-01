import http from "http";
import fs from "fs";

import { ApolloServer, gql } from "apollo-server-express";
import { ApolloServerPluginDrainHttpServer } from "apollo-server-core";
import { createHash } from "crypto";
import express, { Request, Response, NextFunction } from "express";
import serveIndex from "serve-index";

const typeDefs = gql`
  type Query {
    message: String!
  }

  input Arguments {
    argsArr: [String!]
    argNames: [String!]
  }

  input Event {
    key: ID!
    blockNumber: Int!
    name: String!
    module: String!
    metadata: String!
    arguments: Arguments!
  }

  type Mutation {
    addEvents(
      polkadotURL: String!
      startBlock: Int!
      endBlock: Int!
      events: [Event!]!
    ): String
  }
`;

const resolvers = {
  Query: {
    message: () => "Hello, world!",
  },
  Mutation: {
    addEvents(parents: any, args: any, context: any) {
      let timeNow = Date.now()

      let scanPath = `scans/${timeNow}-${uuidv4()}.json`;

      let currScan = {
        polkadotURL: args.polkadotURL,
        startBlock: args.startBlock,
        endBlock: args.endBlock,
        events: args.events,
        eventsCount: args.events.length,
        storedAt: timeNow
      };

      let data = JSON.stringify(currScan);

      fs.writeFileSync(scanPath, data);

      return scanPath;
    },
  },
};

async function startApolloServer(typeDefs: any, resolvers: any) {
  const corsOptions = {
    origin: process.env.ALLOWED_ORIGIN,
    credentials: false,
  };
  const app = express();

  app.use(express.json({ limit: "50mb" }));

  app.use("/scans", function (req: Request, res: Response, next: NextFunction) {
    let auth;
    let received;
    const digest = process.env.DIGEST;

    if (req.headers.authorization) {
      auth = Buffer.from(req.headers.authorization.substring(6), "base64")
        .toString()
        .split(":");
      received = createHash("sha256").update(`${auth[0]}:${auth[1]}`).digest("hex");
    }

    if (!auth || received !== digest) {
      res.statusCode = 401;
      res.setHeader("WWW-Authenticate", 'Basic realm="MyRealmName"');
      res.end("Unauthorized");
    } else {
      next();
    }
  });

  app.use("/scans", express.static("scans"), serveIndex("scans"));

  const httpServer = http.createServer(app);

  const server = new ApolloServer({
    typeDefs,
    resolvers,
    plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
  });

  await server.start();

  server.applyMiddleware({ app, cors: corsOptions });

  await new Promise((resolve: any) => {
    let listener = httpServer.listen({ port: 4000 }, resolve);
    return listener;
  });

  console.log(`🚀 Server ready at http://localhost:4000${server.graphqlPath}`);
}

startApolloServer(typeDefs, resolvers);

function uuidv4() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    var r = (Math.random() * 16) | 0,
      v = c == "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

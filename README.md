# polkadot-scanner-backend

## Getting Started

- Set [env vars](.env.sample)
- `yarn install`
- `yarn build`
- `yarn start:dev`

## Dependencies

- [TypeScript](https://www.typescriptlang.org/download)
- [ts-node](https://github.com/TypeStrong/ts-node)

## GraphQL Schema

```graphql
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
```

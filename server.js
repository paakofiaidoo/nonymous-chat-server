const { GraphQLServer, PubSub } = require("graphql-yoga");
const { v4: uuidv4 } = require("uuid");

const messages = [];
const typeDefs = `
    type Message{
        id: ID!
        user: String!
        position:ID!
        content : String!
    }
    type Query{
        messages:[Message!]
    }
    type Mutation {
        postMessage(user:String!, content: String!):ID!
	}
	type Subscription {
		messages:[Message!]
	}
`;

const subscribers = [];
const onMessageUpdates = (fn) => subscribers.push(fn);
const resolvers = {
	Query: {
		messages: () => messages,
	},
	Mutation: {
		postMessage: (parent, { user, content }) => {
			const id = uuidv4(),
				position = messages.length;

			messages.push({
				id,
				user,
				content,
				position,
			});
			subscribers.forEach((fn) => fn());
			return id;
		},
	},
	Subscription: {
		messages: {
			subscribe: (parent, args, { pubsub }) => {
				const channel = Math.random().toString(36).slice(2, 15);
				onMessageUpdates(() => pubsub.publish(channel, { messages }));
				setTimeout(() => pubsub.publish(channel, { messages }), 0);
				return pubsub.asyncIterator(channel);
			},
		},
	},
};
const pubsub = new PubSub();
const server = new GraphQLServer({ typeDefs, resolvers, context: { pubsub } });
if (process.env.NODE_ENV === "development ") {
	console.log("this is dev mode");
	server.options.port = 4001;
} else {
	server.options.port = 4000;
}

server.start(({ port }) => {
	console.log(`Server on http://localhost:${port}/`);
});
server.listen({ port: server.options.port || 4000 }).then(({ url }) => {
	console.log(`🚀 Server ready at ${url}`);
  });
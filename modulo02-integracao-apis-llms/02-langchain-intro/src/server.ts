import fastify from 'fastify';
import { buildGraph } from './graph/graph.ts';
import { HumanMessage } from 'langchain';

const graph = buildGraph();

export const createServer = () => {
  const app = fastify({ logger: false });

  app.post('/chat', {
    schema: {
      body: {
        type: 'object',
        required: ['question'],
        properties: {
          question: { type: 'string', minLength: 5 }
        }
      }
    },
    handler: async (request, reply) => {
      try {
        const { question } = request.body as { question: string };
        const response = await graph.invoke({
          messages: [new HumanMessage(question)],
        })
        reply.send(response.output);
      }
      catch (err) {
        console.error('Error handling /chat request:', err);
        reply.status(500).send({ error: 'Internal Server Error' });
      }
    }
  })

  return app;
}
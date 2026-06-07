import fastify from 'fastify';
import { OpenRouterService } from './openrouterService.ts';

export const createServer = (openRouterService: OpenRouterService) => {
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
        const response = await openRouterService.generate(question);
        reply.send(response);
      }
      catch (err) {
        console.error('Error handling /chat request:', err);
        reply.status(500).send({ error: 'Internal Server Error' });
      }
    }
  })

  return app;
}
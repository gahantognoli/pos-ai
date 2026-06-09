import { createServer } from "./server.ts";

const app = createServer();

await app.listen({ port: 3000, host: "0.0.0.0" });
console.log(`Server is running on http://localhost:3000`);

// app
//   .inject({
//     method: "POST",
//     url: "/chat",
//     payload: {
//       question: "What is the meaning of life?",
//     },
//   })
//   .then((response) => {
//     console.log("Response from /chat:", response.payload);
//   });

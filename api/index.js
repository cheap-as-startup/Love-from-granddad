// Vercel runs this as a serverless function. It hands every request that isn't
// a plain file (an image, a script) to Expo, which runs our API routes and screens.
const path = require('path');
const { createRequestHandler } = require('expo-server/adapter/vercel');

module.exports = createRequestHandler({
  build: path.join(__dirname, '../dist/server'),
});

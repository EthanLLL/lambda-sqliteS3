import { handler } from './handler.js';

const event = {}

const messages = await handler(event)
console.log(messages)

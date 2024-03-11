import * as mongoose from "mongoose";
import { MONGODB_URL } from "../config/env";
import { logger } from "../logger";

function getMongoClient() {
  const client = mongoose.createConnection(MONGODB_URL);

  client.on('connected', () => {
    logger.info(`Mongoose connected ok`);
  });

  client.on('error', (err) => {
    logger.error(`Mongoose connection error:${err}`);
  });

  client.on('disconnected', () => {
    logger.info('Mongoose disconnected!');
  });

  // If the Node process ends, close the Mongoose connection
  process.on('SIGINT', () => {
    try {
      client.close(() => {
        logger.error('Mongoose default connection disconnected through app termination');
        process.exit(0);
      });
    } catch (e) { }
  });

  return client;
}

export const mongodb = getMongoClient();



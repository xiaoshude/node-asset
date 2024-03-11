import * as dotenv from 'dotenv';
import * as path from 'path';
import { NodeEnv } from './const';
// 读取 .env 文件中的 key=value
// 进环境变量 process.env
const result = dotenv.config();
if (result.error) dotenv.config({ path: process.env.DOTENV_PATH || path.join(process.cwd(), '.env') });

export const env = process.env.NODE_ENV || NodeEnv.prod;
export const isProd = env === NodeEnv.prod;
export const isTest = env === NodeEnv.test;
export const isDev = env === NodeEnv.dev;


export const namespace = !isProd ? 'Development' : 'Production'; // polaris 的命名空间

export const REDIS_DB_HOST = process.env.REDIS_DB_HOST || '';
export const REDIS_DB_PWD = process.env.REDIS_DB_PWD || '';
export const REDIS_DB_PORT = process.env.REDIS_DB_PORT || '';

export const PORT = process.env.PORT || 8080;

export const MONGODB_URL = process.env.MONGODB_URL || '';


export const CONTROLLER_PATH = process.env.CONTROLLER_PATH || path.join(process.cwd(), 'src/controller');
export const HTTP_API_PREFIX = process.env.HTTP_API_PREFIX || '/api';

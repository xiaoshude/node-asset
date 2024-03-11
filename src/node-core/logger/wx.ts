import { Level, levels } from 'log4js';
import { NodeEnv } from '../config/const';
import { env, isProd } from '../config/env';
import { safeStringify } from '../../shared/object';
import { Robot } from '../robot/wx/Robot';
// wx 告警
const url = '';


// 分离正式环境和测试机器人，并且默认关闭正式环境 debug，只保留 error
const urlForTestDebug = '';
const urlForTestError = '';

enum AlertLevel {
  debug = 'debug',
  error = 'error',
  color = 'color',
  fatal = 'fatal'
}
const defaultRobotConfig = {
  [NodeEnv.dev]: {
    [AlertLevel.debug]: urlForTestDebug,
    [AlertLevel.error]: urlForTestError,
  },
  [NodeEnv.test]: {
    [AlertLevel.debug]: urlForTestDebug,
    [AlertLevel.error]: urlForTestError,
  },
  [NodeEnv.prod]: {
    [AlertLevel.error]: url,
  },
} as any;

// eslint-disable-next-line @typescript-eslint/no-require-imports
const packageJson = require(`${process.cwd()}/package.json`);
const projectName = packageJson.name;
const robotConfig = packageJson.robot || {};

// 根据环境，传入不同 robot url，实例化两个 robot 即可
const debugRobotUrl = robotConfig[env]?.[AlertLevel.debug];
const debugRobot = debugRobotUrl && new Robot(debugRobotUrl);

const errorRobotUrl = robotConfig[env]?.[AlertLevel.error];
export const errorRobot = errorRobotUrl && new Robot(errorRobotUrl);

const fatalRobotUrl = robotConfig[env]?.[AlertLevel.fatal] || defaultRobotConfig[env][AlertLevel.fatal];
export const fatalRobot = fatalRobotUrl && new Robot(fatalRobotUrl);

const ctxStrLimit = 2000;

function stdoutAppender(layout: any, timezoneOffset: any) {
  return (loggingEvent: any) => {
    const logCtx = loggingEvent.context;
    const ctxStr = safeStringify(logCtx) || '';
    const requestDataStr = safeStringify(logCtx.query || logCtx.body || {});

    const msgObj = {
      level: loggingEvent.level.levelStr || '', // 日志等级
      ip: loggingEvent.context.ip || '', // ip
      path: loggingEvent.context.path || '', // path
      uid: loggingEvent.context.uid || '', // uid
      ctx: ctxStr.length > ctxStrLimit ? requestDataStr : ctxStr, // ctx
      msg: layout(loggingEvent, timezoneOffset) || '', // 日志内容
      trace: loggingEvent.context.trace || '', // trace_id
    };

    // !!!DO NOT REMOVE,  to skip health check
    if (!msgObj.uid || (msgObj.uid === 'undefined')) return true;
    if (!msgObj.trace) return true;

    if (!String(msgObj.msg).trim()) return true;

    if (!msgObj.ip) delete msgObj.ip;

    if (fatalRobot && (loggingEvent.level as Level).isGreaterThanOrEqualTo(levels.FATAL)) {
      fatalRobot?.error(`[${msgObj.level}]${projectName}`, {
        path: loggingEvent.context.path || '', // path
        ctx: ctxStr.length > ctxStrLimit ? requestDataStr : ctxStr, // ctx
        msg: (layout(loggingEvent, timezoneOffset) as string)?.slice(0, ctxStrLimit) || '', // 日志内容
      });
      return true;
    }

    if (errorRobot && (loggingEvent.level as Level).isGreaterThanOrEqualTo(levels.ERROR)) {
      errorRobot.error(`[${msgObj.level}]${projectName}`, {
        path: loggingEvent.context.path || '', // path
        ctx: ctxStr.length > ctxStrLimit ? requestDataStr : ctxStr, // ctx
        msg: (layout(loggingEvent, timezoneOffset) as string)?.slice(0, ctxStrLimit) || '', // 日志内容
        trace: loggingEvent.context.trace || '', // trace_id
      });
      return true;
    }

    if (isProd) return true;

    if (debugRobot) debugRobot.info(`[${msgObj.level}]${projectName}`, msgObj);
    return true;
  };
};

export function configure(config: any, layouts: any) {
  let layout = layouts.colouredLayout;
  if (config.layout) {
    layout = layouts.layout(config.layout.type, config.layout);
  }
  return stdoutAppender(layout, config.timezoneOffset);
}

if (require.main === module) {
  console.log(__dirname);
  console.log(process.cwd());
  console.log(projectName);
}

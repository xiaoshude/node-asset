import * as log4js from 'log4js';
import { configure as wxConfigure } from './wx';
import { projectName } from './shared';
import { safeStringify } from '../../shared/object';
import { isDev } from '../config/env';
log4js.addLayout('json', (config: any) => function (logEvent: any) {
  return safeStringify({
    projectName,
    env: process.env.NODE_ENV || '',
    uid: logEvent.context.uid || '', // uid
    trace_id: logEvent.context.trace || '', // trace_id
    path: logEvent.context.path || '', // request path
    cost: logEvent.context.cost || '', // costtime
    ...logEvent,
  }, 0) + config.separator;
});
log4js.configure({
  appenders: {
    global: {
      type: 'dateFile',
      // 防止 mac 本地开发，没有文件权限
      filename: isDev ? 'log/global' : '/data/log/project/log/global',
      pattern: '.yyyy-MM-dd.log',
      alwaysIncludePattern: true,
      backups: 3,
      numBackups: 3,
      layout: { type: 'json', separator: '' },
    },
    console: {
      type: 'console',
    },
    // wx 通知
    wx: {
      type: { configure: wxConfigure },
      layout: { type: 'basic' },
    },

  },
  categories: {
    // 这个类别的命名，可以保留，之后可以按项目级别，对日志进一步分类
    default: { appenders: ['global', 'console', /* 'atta' ,*/ 'wx'], level: 'debug' },
  },
});
export const getLogger = () => log4js.getLogger();

/**
 * 注意，不要再使用这个 单例 logger 里，尤其再 server 场景，context 会存在覆写的情况，应该每个请求，实例化一个新的 logger
 * @deprecated
 */
export const logger = log4js.getLogger();


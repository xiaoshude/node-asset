import axios from 'axios';
import { defaultRedisClient } from '../../storage/redis';
import { env, isDev } from '../../config/env';


function getMsgId(msg: string) {
  // '[2022-01-17T08:42:42.278] [ERROR] default - ' 前面是类似这样的时间串，必须去除，否则没有两个告警的标识是相同的。
  // 另外要移除所有的数字，这些数字很有可能是 cost time、ip 等，每次请求都会变的内容。
  // 虽然移除数字，也会移除 retcode，但是依靠 text 的语义，依然可以标识不通的错误类型
  const trimedNumber = msg.replace(/\d/g, '');
  return trimedNumber.slice(44, 144);
}

const sampleOfAttachments = [{
  callback_id: 'button_two_row',
  actions: [{
    name: 'button_1',
    text: 'S',
    type: 'button',
    value: 'S',
    replace_text: '你已选择S',
    border_color: '2EAB49',
    text_color: '2EAB49',
  }],
},
];
export type Attachments = typeof sampleOfAttachments;
export class Robot {
  // eslint-disable-next-line
  constructor(private url: string) { }

  public raw(content: string, attachments?: Attachments, chatid?: string) {
    const msgObj = {
      chatid,
      msgtype: 'markdown',
      markdown: {
        content,
        attachments,
      },
    };

    return axios.post(this.url, msgObj, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  public info(title: string, data: Record<string, any>, chatid?: string) {
    const copyedData = {
      env,
      ...data,
    } as any;
    let content = `### ${title} \n`;
    Object.keys(copyedData).forEach((key) => {
      content += `> **${key}**: <font color="comment">${copyedData[key]}</font> \n\n\n`;
    });
    const msgObj = {
      chatid,
      msgtype: 'markdown',
      markdown: {
        content,
      },
    };

    return axios.post(this.url, msgObj, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  public async error(title: string, data: Record<string, any>, chatid?: string) {
    const msgId = getMsgId(data.msg);
    // 先判断有没有锁
    const lockKey = `${msgId}_lock`;
    const lock = await defaultRedisClient.get(lockKey);
    if (lock) {
      console.log('lock exsit, skip alert', title, data);
      return;
    }
    let rawCounter = await defaultRedisClient.get(msgId);
    // 如果之前没有发送过，初始化
    if (!rawCounter) {
      rawCounter = '0';
    }
    const counter = parseInt(rawCounter, 10);
    // 如果已经发送 3次或以上，加锁，禁止此次发送
    if (counter > 2) {
      // rm counter
      // 要先 rm，可以 rm 失败，下次还会进入告警计数
      await defaultRedisClient.del(msgId);
      // add lock
      await defaultRedisClient.setex(lockKey, 1 * 24 * 60 * 60 * 1000, data?.trace);
      this.raw(`三次未处理告警: ${msgId}  \n\n\n
        已终止该告警推送，24h 时后恢复！
      `, undefined, chatid);
      return;
    }
    // 否则仅仅是计数加一，注意加过期时间
    await defaultRedisClient.setex(msgId, 1 * 24 * 60 * 60 * 1000, String(counter + 1));

    const copyedData = {
      env,
      ...data,
    } as any;
    let content = `### ${title} \n`;
    Object.keys(copyedData).forEach((key) => {
      content += `> **${key}**: <font color="comment">${copyedData[key] as string}</font> \n\n\n`;
    });
    const msgObj = {
      chatid,
      msgtype: 'markdown',
      markdown: {
        content,
        attachments: [{
          callback_id: 'alert_feedback',
          actions: [{
            name: `reject_${data?.trace}`,
            text: '拒绝',
            type: 'button',
            // 这里使用 消息的标识：msg 的 前 100 字节
            value: msgId,
            replace_text: '已拒绝',
            border_color: '2EAB49',
            text_color: '2EAB49',
          },
          {
            name: `accept_${data?.trace}`,
            text: '接受',
            type: 'button',
            value: msgId,
            replace_text: '已接受',
            border_color: '2EAB49',
            text_color: '2EAB49',
          },
          ],
        },
        ],
      },
    };

    return axios.post(this.url, msgObj, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  public errorWithTitle(err: Error, title = '告警'): any {
    if (isDev) return;
    let content = `### ${title} \n ${new Date().toLocaleString()} \n`;
    const data = {
      env,
      message: err.message,
      // eslint-disable-next-line newline-per-chained-call
      stack: err.stack?.split('\n').slice(0, 10).join('\n'),
    } as any;
    Object.keys(data).forEach((key) => {
      content += `> **${key}**: <font color="comment">${data[key]}</font> \n\n\n`;
    });

    const msgObj = {
      msgtype: 'markdown',
      markdown: {
        content,
      },
    };
    return axios.post(this.url, msgObj, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}

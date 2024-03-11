/**
 * js 原生的 error 对象，只有 msg 没有 code 属性，但是，通常的判定 error 是不是 我们要处理的那个，通过 code 更方便。
 *
 * 当然，上面是促使形成这个 AError，不过，除此之外，还有一些锦上添花的功能，比如：
 *
 * - 如果需要更长说明,可以附加在 desc 下，所以，相对的 message 下应该时简短、明确的描述。
 * - payload，如字面意思，可以携带额外的数据。
 */
export class AError extends Error {
  public code: number;

  public message: string;

  public desc: string;

  public payload?: Record<string, any> | null;

  constructor({
    code,
    message,
    desc = '',
    payload = null,
  }: {
    code: number;
    message: string;
    desc?: string;
    payload?: Record<string, any> | null;
  }) {
    super(message);
    this.message = message;
    this.desc = desc;
    this.code = code;
    this.payload = payload;
  }
  // 自定义 toString 方法
  toString() {
    return `AError trigger: code: ${this.code} -- message: ${this.message};  
    payload: ${JSON.stringify(this.payload)};
    desc: ${this.desc}]`;
  }
}

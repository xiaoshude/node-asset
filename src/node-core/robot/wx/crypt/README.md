# WXBizMsgCrypt
企业微信TS(JS)加解密库

这是自己封装的一个企业微信加解密库。

## WXBizMsgCrypt使用

```
import { WXBizMsgCrypt } from "./WXBizMsgCrypt"; // 导入封装的企业微信加解密算法

const EncodingAESKey = "XXXX填写自己的机器人的EncodingAESKey XXXX"; // EncodingAESKey 用于消息体的加密，是AES密钥的Base64编码。 长度为43位的英文或数字。
const token = "chengfu"; // 可由开发者任意填写，用于生成签名。长度为3~32之间的英文或数字.  

const wxbizmsgcrypt = new WXBizMsgCrypt(token, EncodingAESKey);
```



## 企业微信机器人开发经验

先随便在群里新建一个机器人。配置里会得到一个webhook地址，可用来推送消息，直接通过post请求就可以对群里进行推送消息。



推送，如果只是为了通过企业微信机器人给群内推送消息，可以通过webhook。这个比较容易，但是只能实现机器人对用户的消息交流。不能实现用户对机器人的通讯。如果要实现用户对机器人的通讯，必须要用回调了。



这里是关于回调的开发经验

回调必须先填写URL， 填写的URL需要正确响应企业微信URL的请求。填写完Token，EncodingAESKey可以随机获取。

```
URL是群机器人接收企业微信群推送请求的访问协议和地址，支持http或https协议。
Token可由开发者任意填写，用于生成签名。长度为3~32之间的英文或数字.
EncodingAESKey用于消息体的加密，是AES密钥的Base64编码。 长度为43位的英文或数字
```



![1581777037830](https://puui.qpic.cn/vupload/0/20200215_1581777037830.png/0)

点击保存，企业微信服务器会发送一条加密的信息到填写的URL，发送方法为**GET**。 你需要自己的URL服务器将这个加密信息按照特定的算法解密出来 出正确的响应才能通过URL验证。

企业微信在推送消息给企业时，会对消息内容做AES加密，以XML格式POST到企业应用的URL上。
企业在被动响应时，也需要对数据加密，以XML格式返回给企业微信。

这个加解密**相当的麻烦**，为此企业微信官方提供了对应的加解密库，但是目前已有c++/python/php/java/c#等语言版本），所以这里提供一个ts版本的解密库，可以直接调用。

如果想详细了解加解密算法原理的可以参考[群机器人的消息回调文档](https://open.work.weixin.qq.com/api/doc/14812)  [加解密方案说明](https://work.weixin.qq.com/api/doc/90000/90139/90968)

```
假设接收消息地址设置为：http://api.xxx.com/，企业微信将向该地址发送如下验证请求：
请求方式：GET
请求地址：http://api.xxx.com/?msg_signature=ASDFQWEXZCVAQFASDFASDFSS&timestamp=13500001234&nonce=123412323&echostr=ENCRYPT_STR
```

以下代码采用koa框架编写。其它node框架都可以。

```URL验证代码
import { WXBizMsgCrypt } from "./WXBizMsgCrypt"; // 导入封装的企业微信加解密算法

const EncodingAESKey = "XXXX填写自己的机器人的EncodingAESKey XXXX"; // EncodingAESKey 用于消息体的加密，是AES密钥的Base64编码。 长度为43位的英文或数字。
const token = "chengfu"; // 可由开发者任意填写，用于生成签名。长度为3~32之间的英文或数字.  

// GET /getInfo
router.get("info")
  .use(async (ctx) => {
    const requestQuery = ctx.query;
    const signature = requestQuery.msg_signature;
    const { timestamp, nonce, echostr } = requestQuery; // 获取get请求信息
    const wxbizmsgcrypt = new WXBizMsgCrypt(token, EncodingAESKey);
    const getSignature = wxbizmsgcrypt.getSignature(timestamp, nonce, echostr);
    if (signature === getSignature) {
      logger.debug("signature验证成功：");
      // 解密
      const decrypt = wxbizmsgcrypt.decrypt(echostr);
      ctx.body = decrypt;
    }
  });
```



URl验证成功后，就可以处理回调消息了。

群机器人回调消息有`文本(text)`、`事件(event)`和`附件（attachment）`三种类型。*文本*是群成员@机器人的时候会回调，*事件*是机器人被加入到群中或者从群里移除的时候回调 *附件*是用户点击markdown消息中的按钮的时候会回调。这里主要讨论文本。

假设机器人的接收消息的URL设置为http://api.xxx.com。
**请求方式：POST**

**接收数据格式**  **XML**

 ```接收与处理回调数据
  import xml2json from "xml2json";
  import xml2js from "xml2js";  // 使用 xml2js 可以方便地将XML格式字符串数据解析成JavaScript中的对象数据。
  
  // POST / 用户发送信息，通过post传递到服务器。
  router.post("info")
    .use(async (ctx) => {
      // POST进行解密
      const wxbizmsgcrypt = new WXBizMsgCrypt(token, EncodingAESKey); // 解密
      const xmlDecryptString: any = ctx.request.body; // 收到的xml字符串
      let Encrypt: any;
      xml2js.parseString(xmlDecryptString, (err: any, result: any) => { // 将xml字符串转换成json对象
          [Encrypt] = result.xml.Encrypt; // Encrypt = result.xml.Encrypt[0]
      });
  
      // 解密
      const decrypt = wxbizmsgcrypt.decrypt(Encrypt);
      // xml 2 json
      const decryptJson = JSON.parse(xml2json.toJson(decrypt));
      const { From, WebhookUrl, MsgType, ChatId, MsgId, ChatType } = decryptJson.xml;
      // ChatType 类型group, single 判断是群内聊天还是单人聊天。
      const { UserId, Name, Alias } = From; // 存取用户的别名 一般是英文名
  
      // 这里尝试用WebHook进行主动推送
      const baseUrl = WebhookUrl;
      // 推送代码省略
      
      ctx.status = 200; // 必须设置返回值为200，不然微信服务器会重复请求3次。
      ctx.body = "";
  }
 ```

ps: 当接收成功后，http头部返回200表示接收ok，其他错误码像302企业微信后台会一律当做失败并发起重试，重复请求3次。

**文本消息**  **协议格式如下：**

```
<xml>
    <WebhookUrl> <![CDATA[https://qyapi.weixin.qq.com/xxxxxxx]]></WebhookUrl>
    <ChatId><![CDATA[wrkSFfCgAALFgnrSsWU38puiv4yvExuw]]></ChatId>
    <GetChatInfoUrl><![CDATA[https://qyapi.weixin.qq.com/cgi-bin/webhook/get_chat_info?code=m49c5aRCdEP8_QQdZmTNR52yJ5TLGcIMzaLJk3x5KqY]]></GetChatInfoUrl>
    <From>
        <UserId>zhangsan</UserId>
        <Name><![CDATA[张三]]></Name>
        <Alias><![CDATA[xxx]]></Alias>
    </From>
    <MsgType>text</MsgType>
    <Text>
        <Content><![CDATA[@RobotA hello robot]]></Content>
    </Text>
    <MsgId>xxx</MsgId>
</xml>
```

在响应本次请求的时候直接回复消息。回复的消息需要先按明文协议构造xml数据包，然后对明文消息进行加密，之后再回复最终的密文xml数据包。这个相当麻烦，建议通过webhook地址主动发送消息到群里。


提醒机器人的开发其实很简单，其实就是向这个webhook地址，按文档提供的格式发送请求，就可以实现消息推送了。最简单的示例，可以用 `Node.js` 的 `axios` 类库：

```
const axios = require('axios')

const baseUrl = WebhookUrl;
async function bookLunch() {
    let result = await axios.post(baseUrl, {
        msgtype: 'text',
        text: {
            content: '同学们好，我是企业微信机器人！',
            mentioned_list: ['@all'] // 可以使用邮箱或者手机号码
        }
    })
    return result.data
}

bookLunch.then((res) => {
    console.log(res)
})
```

以上是最简单的例子。除了普通文本内容，还可以发送 `markdown`，图文等内容，可以自行去看文档。


## 更多

更多详细文档可以参考

[群机器人回调说明（内测）](https://work.weixin.qq.com/api/doc/90000/90136/91881)

[群机器人的消息回调](https://work.weixin.qq.com/api/doc/14812)

[加解密方案说明](https://work.weixin.qq.com/api/doc/90000/90139/90968)

# 如何使用
## 开启企业微信告警

在 package.json 根级中添加 robot 字段，如下所示：
```json
"robot": {
    "production": {
      "error": "your error robot url",
      "fatal": "your fatal robot url"
    },
    "test": {}
  }
```

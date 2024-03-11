import { Kafka } from 'kafkajs';
const { KAFKA_BROKER } = process.env;

export const kafka = (): Kafka => {
  const broker = KAFKA_BROKER as string;

  return new Kafka({
    clientId: 'orange-ci-master',
    brokers: [broker],
    connectionTimeout: 3000,
  });
};

// consumer 示例
if (require.main === module) {
  (async () => {
    const CONSUMER_GROUP_ID = 'xxx';
    const WEWORK_TOPIC = 'wework';
    const CRONTAB_TOPIC = 'crontab';
    const API_TOPIC = 'api';


    const kafkaInstance = kafka();
    const consumer = kafkaInstance.consumer({ groupId: CONSUMER_GROUP_ID });

    await consumer.connect();
    await consumer.subscribe({ topic: WEWORK_TOPIC });
    await consumer.subscribe({ topic: CRONTAB_TOPIC });
    await consumer.subscribe({ topic: API_TOPIC });
    await consumer.run({
      eachMessage: async ({ topic, message }) => {
        const parseMessageValue = JSON.parse(message.value?.toString() as string);

        console.log('kafka receive:', topic, parseMessageValue);

        // 后续拓展监听其他 topic
        switch (topic) {
          case WEWORK_TOPIC:
            console.log('wework topic');
            break;
          case CRONTAB_TOPIC:
            console.log('crontab topic');
            break;
          case API_TOPIC:
            console.log('api topic');
            break;
          default:
            break;
        }
      },
    });
  })();
}

// producer 示例
if (require.main === module) {
  const kafkaInstance = kafka();
  const producer = kafkaInstance.producer();
  // const topicName = 'user_friend_teacher';
  const topicName = 'stop-polling';

  const run = async () => {
    // Producing
    await producer.connect();
    await producer.send({
      topic: topicName,
      messages: [
        { value: JSON.stringify({ order_id: '订单号', member_id: '用户memberid', phone: '用户手机号', is_friend: true, teacher_oa: 'rtx' }) },
      ],
    });
  };

  run().catch(console.error);
}

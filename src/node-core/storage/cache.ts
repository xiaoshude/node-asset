// 本地内存存储，主要用于缓存
export class LocalCache {
    private cache: Record<string, any>
    constructor() {
      this.cache = {};
    }

    // 类似 redis setex
    setex(key: string, seconds: number, value: any) {
      this.cache[key] = value;
      setTimeout(() => {
        delete this.cache[key];
      }, seconds * 1000);
    }

    get(key: string) {
      return this.cache[key];
    }

    exists(key: string) {
      return Object.prototype.hasOwnProperty.call(this.cache, key);
    }
}


// 使用单例 plain object
export const defaultLocalCache = new LocalCache();

import fs from 'fs';
import path from 'path';
import events from 'events';
import { ensureDirectory } from '../utils/fs';

const EventTypes = {
  STORE: 'store'
};

export class JsonDatabase {
  dbPath: string;
  database: any;
  eventEmitter: events.EventEmitter;

  constructor(path: string) {
    this.dbPath = path;
    this.database = null;
    this.eventEmitter = new events.EventEmitter();

    this.initializeDatabase();
  }

  async initializeDatabase() {
    await ensureDirectory(path.dirname(this.dbPath));
    if (!fs.existsSync(this.dbPath)) {
      // create file with empty json
      fs.writeFileSync(this.dbPath, JSON.stringify({}));
    }
    console.log(`JSON database has been initialized at ${this.dbPath}`);
  }

  onStore<T>(clb: (key: string, oldValue: T, newValue: T) => void): () => void {
    this.eventEmitter.addListener(EventTypes.STORE, clb);
    return () => this.eventEmitter.removeListener(EventTypes.STORE, clb);
  }

  getItem<T>(key: string): T {
    if (!this.database) {
      this.database = this.load();
    }
    return this.database[key];
  }

  setItem(key: string, data: any): void {
    if (!this.database) {
      this.database = this.load();
    }
    let oldValue = this.database[key];
    this.database[key] = data;
    this.save();
    this.eventEmitter.emit(EventTypes.STORE, key, oldValue, data);
  }

  removeItem(key: string): void {
    if (!this.database) {
      this.database = this.load();
    }
    if (this.database[key]) {
      let oldValue = this.database[key];
      delete this.database[key];
      this.save();
      this.eventEmitter.emit(EventTypes.STORE, key, oldValue, null);
    }
  }

  load(): any {
    try {
      return JSON.parse(fs.readFileSync(this.dbPath).toString());
    } catch (error) {
      console.error(error);
      return {};
    }
  }

  save(): void {
    fs.writeFileSync(this.dbPath, JSON.stringify(this.database, null, 4));
  }
}


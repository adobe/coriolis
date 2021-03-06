/*
 * Copyright 2017 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

/**
 * @module Module
 */

import EventEmitter from 'eventemitter3';
import {ModuleBase} from '../ModuleBase';

export class StoreModule extends ModuleBase {
  private _store = new Map<string, unknown>();
  private _storeListener = new EventEmitter();

  constructor(baseArgs: ConstructorParameters<typeof ModuleBase>[0]) {
    super(baseArgs);

    this._store = new Map();
    this._storeListener = new EventEmitter();

    this._attachToChannel();
  }

  get(name: string) {
    return this._store.get(name);
  }
  set(arg: Record<string, unknown> | string, value?: unknown) {
    if (typeof arg === 'string') {
      return this._set(arg, value);
    } else {
      return this._setBulk(arg);
    }
  }
  on(...arg: Parameters<EventEmitter['on']>) {
    return this._storeListener.on(...arg);
  }
  once(...arg: Parameters<EventEmitter['once']>) {
    return this._storeListener.once(...arg);
  }
  off(...arg: Parameters<EventEmitter['off']>) {
    return this._storeListener.off(...arg);
  }

  private _setBulk(obj: Record<string, unknown>) {
    let needSet = false;
    const setObj: Record<string, unknown> = {};
    for (const name in obj) {
      if (!Object.prototype.hasOwnProperty.call(obj, name)) {
        continue;
      }
      if (
        typeof obj[name] !== 'object' &&
        obj[name] === this._store.get(name)
      ) {
        continue;
      }
      this._store.set(name, obj[name]);
      this._storeListener.emit(name, this._store.get(name), 'internal');
      setObj[name] = {
        value: obj[name],
      };
      needSet = true;
    }
    if (needSet) {
      this._postMessage.socketSend('<=> bulkStore', setObj);
    }
  }

  private _set(name: string, value: unknown) {
    if (typeof value !== 'object' && this._store.get(name) === value) {
      return;
    }

    this._postMessage.socketSend('<=> store', {
      name,
      value: value,
    });
    this._store.set(name, value);
    this._storeListener.emit(name, this._store.get(name), 'internal');
  }

  private _attachToChannel() {
    this._postMessage.socketOn('<=> store', d => {
      const name = d.name;
      this._store.set(name, d.value);
      this._storeListener.emit(name, this._store.get(name), 'external');
    });

    this._postMessage.socketOn('<=> bulkStore', obj => {
      for (const name in obj) {
        if (!Object.prototype.hasOwnProperty.call(obj, name)) {
          continue;
        }
        this._store.set(name, obj[name].value);
        this._storeListener.emit(name, this._store.get(name), 'external');
      }
    });
  }
}

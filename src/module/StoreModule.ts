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

export type StoreModuleConfig = {
  handleReconnect?: boolean;
  mergeFunction?: (local: unknown, remote: unknown) => unknown;
  channelSeparator?: string | false;
  globalListener?: boolean;
};

export class StoreModule extends ModuleBase {
  private _store = new Map<string, unknown>();
  private _storeListener = new EventEmitter();
  private _handleReconnect: StoreModuleConfig['handleReconnect'] = true;
  private _mergeFunction: StoreModuleConfig['mergeFunction'] = undefined;
  private _channelSeparator: StoreModuleConfig['channelSeparator'] = ':';
  private _globalListener: StoreModuleConfig['globalListener'] = true;

  constructor(
    baseArgs: ConstructorParameters<typeof ModuleBase>[0],
    conf: StoreModuleConfig = {}
  ) {
    super(baseArgs);

    this._handleReconnect = conf.handleReconnect ?? true;
    this._mergeFunction = conf.mergeFunction;
    this._store = new Map();
    this._storeListener = new EventEmitter();
    this._channelSeparator = conf.channelSeparator ?? ':';
    this._globalListener = conf.globalListener ?? true;

    this._attachToEvents();
    this._attachToChannel();
  }

  _emitWithChannelAndGlobalSupport(
    name: string,
    direction: 'internal' | 'external',
    ...args: unknown[]
  ) {
    if (this._channelSeparator) {
      const chunks = name.split(this._channelSeparator);
      if (chunks.length > 1) {
        for (let i = 0; i < chunks.length - 1; i++) {
          const globName = [...chunks.slice(0, i + 1), '*'].join(
            this._channelSeparator
          );
          this._storeListener.emit(globName, name, ...args, direction);
        }
      }
    }

    if (this._globalListener) {
      this._storeListener.emit('*', name, ...args, direction);
    }
    this._storeListener.emit(name, ...args, direction);
  }

  get<T1 = unknown>(name: string) {
    return this._store.get(name) as T1;
  }
  getAll(): Record<string, unknown> {
    return Object.fromEntries(this._store.entries());
  }
  set<T1 = unknown>(arg: Record<string, T1> | string, value?: T1) {
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

  private _setBulk(obj: Record<string, unknown>, forceUpdate: boolean = false) {
    let needSet = false;
    const setObj: Record<string, unknown> = {};
    for (const name in obj) {
      if (!Object.prototype.hasOwnProperty.call(obj, name)) {
        continue;
      }
      if (
        forceUpdate === false &&
        typeof obj[name] !== 'object' &&
        obj[name] === this._store.get(name)
      ) {
        continue;
      }
      this._store.set(name, obj[name]);
      this._storeListener.emit(name, this._store.get(name), 'internal');
      setObj[name] = obj[name];
      needSet = true;
    }
    if (needSet) {
      this._postMessage.socketSend('<=> bulkStore', setObj, true, true);
    }
  }

  private _storeSync() {
    const setObj: Record<string, unknown> = Object.fromEntries(
      this._store.entries()
    );
    this._postMessage.socketSend('<=> syncStore', setObj, true, true);
  }

  private _set(name: string, value: unknown) {
    if (typeof value !== 'object' && this._store.get(name) === value) {
      return;
    }

    this._postMessage.socketSend(
      '<=> store',
      {
        name,
        value: value,
      },
      true,
      true
    );
    this._store.set(name, value);
    this._emitWithChannelAndGlobalSupport(
      name,
      'internal',
      this._store.get(name)
    );
  }

  private _attachToEvents() {
    if (this._postMessage.isParentFrame) {
      this._postMessage.on('reconnected', () => {
        if (this._handleReconnect === true) {
          this._storeSync();
        }
      });
    }
    this._postMessage.on('connected', () => {
      if (this._handleReconnect === true) {
        this._storeSync();
      }
    });
  }

  private _attachToChannel() {
    this._postMessage.socketOn('<=> store', d => {
      const name = d.name;
      this._store.set(name, d.value);
      this._emitWithChannelAndGlobalSupport(
        name,
        'external',
        this._store.get(name)
      );
    });

    this._postMessage.socketOn('<=> bulkStore', obj => {
      for (const name in obj) {
        if (!Object.prototype.hasOwnProperty.call(obj, name)) {
          continue;
        }
        this._store.set(name, obj[name]);
        this._emitWithChannelAndGlobalSupport(
          name,
          'external',
          this._store.get(name)
        );
      }
    });

    this._postMessage.socketOn('<=> syncStore', obj => {
      for (const name in obj) {
        if (
          !Object.prototype.hasOwnProperty.call(obj, name) ||
          obj[name] === undefined
        ) {
          continue;
        }

        const localValue = this._store.get(name);
        const remoteValue = obj[name];

        if (localValue === remoteValue) {
          continue;
        }

        let newValue = remoteValue;
        if (localValue !== undefined) {
          if (this._mergeFunction) {
            newValue = this._mergeFunction(localValue, remoteValue);
          } else if (this._postMessage.isParentFrame) {
            continue;
          }
        }

        if (newValue !== localValue) {
          this._store.set(name, newValue);
          this._emitWithChannelAndGlobalSupport(name, 'external', newValue);
        }
      }
    });
  }
}

/*
 * Copyright 2021 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
'use strict';

import EventEmitterPolyfill from 'eventemitter3';
import {ModuleBase, ModuleBaseConstructable} from '../src/ModuleBase';
import {ModuleLoader} from '../src/ModuleLoader';
import {PostMessageChannel} from '../src/PostMessageChannel';

export default class {
  static nextTick(nb = 1) {
    if (nb === 0) {
      return Promise.resolve();
    }
    return this.nextTick(nb - 1).then(() => {
      return new Promise<void>(resolve => {
        setTimeout(() => {
          resolve();
        }, 0);
      });
    });
  }

  static createMockPostMessageChannel(time1 = -1, time2 = -1) {
    // Create two eventEmitter for simulate the postMessage interface (minimal set)
    const socket1 = new EventEmitterPolyfill();
    const socket2 = new EventEmitterPolyfill();

    let _isConnected = false;

    const objs = [];

    // Create two classes to emulate postMessageChannel class and link them with eventEmitter instead of postMessage
    class BaseCommon extends EventEmitterPolyfill {
      timing: number;
      receivedSocket: EventEmitterPolyfill;
      emitSocket: EventEmitterPolyfill;
      parent: boolean;
      constructor(receivedSocket, emitSocket, timing, parent) {
        super();
        objs.push(this);
        this.receivedSocket = receivedSocket;
        this.emitSocket = emitSocket;
        this.timing = timing;
        this.parent = parent;
      }

      fakeConnected() {
        _isConnected = true;
        this._allEmit('connected');
      }
      fakeReconnected() {
        _isConnected = true;
        this._allEmit('reconnected');
      }
      fakeDisconnected() {
        _isConnected = false;
        this._allEmit('disconnected');
      }

      get isConnected() {
        return _isConnected;
      }
      _allEmit(...arg) {
        for (const obj of objs) {
          obj.emit(...arg);
        }
      }

      socketSend(name, data) {
        const doFx = () => {
          this.emitSocket.emit(name, data, {
            data: {
              eventName: name,
              data: data,
              sentAt: Date.now() - this.timing, // make timing near perfect
            },
          });
        };

        if (this.timing >= 0) {
          setTimeout(doFx, this.timing);
        } else {
          doFx();
        }
      }
      socketOn(name, cb) {
        return this.receivedSocket.on(name, cb);
      }
      socketOnce(name, cb) {
        return this.receivedSocket.once(name, cb);
      }

      get isParentFrame() {
        return this.parent;
      }
      get isChildFrame() {
        return !this.parent;
      }

      childFrameCheck() {
        if (!this.isChildFrame) {
          throw new Error(
            'This function should be called only in a child frame.'
          );
        }
      }

      parentFrameCheck() {
        if (!this.isParentFrame) {
          throw new Error(
            'This function should be called only in a parent frame.'
          );
        }
      }
    }
    class Base1 extends BaseCommon {
      constructor() {
        super(socket1, socket2, time1, true);
      }
    }
    class Base2 extends BaseCommon {
      constructor() {
        super(socket2, socket1, time2, false);
      }
    }

    return [
      new Base1() as unknown as PostMessageChannel & {
        fakeConnected: Function;
        fakeDisconnected: Function;
        fakeReconnected: Function;
      },
      new Base2() as unknown as PostMessageChannel & {
        fakeConnected: Function;
        fakeDisconnected: Function;
        fakeReconnected: Function;
      },
    ];
  }

  static createModuleBaseArg(
    pmc: PostMessageChannel,
    initModules = new Map<string, ModuleBaseConstructable>()
  ): ConstructorParameters<typeof ModuleBase>[0] {
    const moduleLoader = new ModuleLoader(pmc);
    for (const [name, Module] of initModules) {
      moduleLoader.load(name, Module);
    }
    return {postMessage: pmc, moduleLoader};
  }
}

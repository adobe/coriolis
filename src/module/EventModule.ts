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

export class EventModule extends ModuleBase {
  private _eventListener = new EventEmitter();

  constructor(baseArgs: ConstructorParameters<typeof ModuleBase>[0]) {
    super(baseArgs);
    this._attachToChannel();
  }

  emit(name: string, ...args: unknown[]) {
    this._postMessage.socketSend('<=> event', {name, args});
    this._eventListener.emit(name, ...args, 'internal');
  }
  on(...arg: Parameters<EventEmitter['on']>) {
    return this._eventListener.on(...arg);
  }
  once(...arg: Parameters<EventEmitter['once']>) {
    return this._eventListener.once(...arg);
  }
  off(...arg: Parameters<EventEmitter['off']>) {
    return this._eventListener.off(...arg);
  }
  private _attachToChannel() {
    this._postMessage.socketOn('<=> event', d => {
      this._eventListener.emit(d.name, ...d.args, 'external');
    });
  }
}

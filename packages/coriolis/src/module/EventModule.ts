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

export type EventModuleConfig = {
  channelSeparator?: string | false;
  globalListener?: boolean;
};
export class EventModule extends ModuleBase {
  private _eventListener = new EventEmitter();
  private _channelSeparator: EventModuleConfig['channelSeparator'] = ':';
  private _globalListener: EventModuleConfig['globalListener'] = true;

  constructor(
    baseArgs: ConstructorParameters<typeof ModuleBase>[0],
    conf: EventModuleConfig = {},
  ) {
    super(baseArgs);

    this._channelSeparator = conf.channelSeparator ?? ':';
    this._globalListener = conf.globalListener ?? true;

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
            this._channelSeparator,
          );
          this._eventListener.emit(globName, name, ...args, direction);
        }
      }
    }

    if (this._globalListener) {
      this._eventListener.emit('*', name, ...args, direction);
    }
    this._eventListener.emit(name, ...args, direction);
  }

  emit(name: string, ...args: unknown[]) {
    this._postMessage.socketSend('<=> event', {name, args});
    this._emitWithChannelAndGlobalSupport(name, 'internal', ...args);
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
      this._emitWithChannelAndGlobalSupport(d.name, 'external', ...d.args);
    });
  }
}

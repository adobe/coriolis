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

/**
 * @module Module
 */

import EventEmitter from 'eventemitter3';
import {PostMessageChannel} from './PostMessageChannel';

export interface ModuleLoaderInterface extends EventEmitter {
  load(
    name: string,
    Module: ModuleBaseConstructable,
    config?: Record<string, unknown>,
  ): ModuleBase;
  has(name: string): boolean;
  get(name: string): undefined | ModuleBase;
  list(): Set<string>;

  require(name: string): ModuleBase;
}

export interface ModuleBaseConstructable {
  new (
    moduleBaseArgs: ConstructorParameters<typeof ModuleBase>[0],
    config: {},
  ): ModuleBase;
}

export abstract class ModuleBase {
  protected _postMessage: PostMessageChannel;
  protected _moduleLoader: ModuleLoaderInterface;

  constructor({
    postMessage,
    moduleLoader,
  }: {
    postMessage: PostMessageChannel;
    moduleLoader: ModuleLoaderInterface;
  }) {
    this._postMessage = postMessage;
    this._moduleLoader = moduleLoader;
  }
}

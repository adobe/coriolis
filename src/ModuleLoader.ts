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

import {EventEmitter} from 'eventemitter3';
import {
  ModuleBase,
  ModuleBaseConstructable,
  ModuleLoaderInterface,
} from './ModuleBase';
import {PostMessageChannel} from './PostMessageChannel';

/**
 * A class which handles the loading of the different module and their dependencies.
 *  This will also check that both Coriolis instances have the same modules loaded and
 *  log into the console if it's not the case.
 */
export class ModuleLoader
  extends EventEmitter
  implements ModuleLoaderInterface
{
  /**
   * Internal save of postMessage main instance
   * @type {PostMessageChannel}
   */
  private _postMessage: PostMessageChannel;

  /**
   * Internal array to save all modules that are registered
   * @type {Map}
   */
  private _loadedModules = new Map<string, ModuleBase>();

  /**
   * Constructor
   * @param {Object} postMessage The postMessage main instance to pass to the modules
   */
  constructor(postMessage: PostMessageChannel) {
    super();
    this._postMessage = postMessage;
  }

  /**
   * Add a module
   * @param {string} name The name of the module
   * @param {Class} Module A module class to instanciate
   * @param {Object} config The configuration to pass to the module
   * @param {Boolean} alias If the module is directly available in postMessage class
   * @return {boolean} return if the module is correctly added
   */
  load<T extends ModuleBase = ModuleBase>(
    name: string,
    Module: ModuleBaseConstructable,
    config = {}
  ) {
    if (this._loadedModules.has(name)) {
      throw new Error('This module is already registered');
    }
    // Add a  module
    this._loadedModules.set(
      name,
      new Module({postMessage: this._postMessage, moduleLoader: this}, config)
    );

    this.emit('add', {name});

    return this.get(name) as T;
  }

  has(name: string) {
    return this._loadedModules.has(name);
  }

  get(name: string) {
    return this._loadedModules.get(name);
  }

  list() {
    return new Set([...this._loadedModules.keys()]);
  }

  require(name: string) {
    if (!this.has(name)) {
      throw new Error(`The module "${name}" is required.`);
    }

    return this.get(name) as ModuleBase;
  }
}

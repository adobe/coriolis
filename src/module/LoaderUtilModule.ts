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

import {ModuleBase} from '../ModuleBase';

/**
 * A class which handles the loading of the different module and their dependencies.
 *  This will also check that both Coriolis instances have the same modules loaded and
 *  log into the console if it's not the case.
 */
export class LoaderUtilModule extends ModuleBase {
  /**
   * Internal array to save all custom serializer we have register
   * @type {Map}
   */
  private _remoteModule = new Set<string>();

  /**
   * Constructor
   * @param {Object} postMessage The postMessage main instance to pass to the modules
   */
  constructor(baseArgs: ConstructorParameters<typeof ModuleBase>[0]) {
    super(baseArgs);
    this._postMessage.on('connected', () => {
      this._remoteModule = new Set();
      this._send();
    });
    this._postMessage.on('reconnected', () => {
      this._remoteModule = new Set();
      this._send();
    });
    this._postMessage.on('disconnected', () => {
      this._remoteModule = new Set();
    });

    this._moduleLoader.on('add', () => {
      if (this._postMessage.isConnected) {
        this._send();
      }
    });

    this._attachToChannel();
  }

  loaded() {
    return {
      local: this._moduleLoader.list(),
      remote: this._remoteModule.values(),
    };
  }

  private _moduleAreSame() {
    if (this._moduleLoader.list().size !== this._remoteModule.size) {
      return false;
    }
    for (const [name] of this._moduleLoader.list()) {
      if (!this._remoteModule.has(name)) {
        return false;
      }
    }
    return true;
  }

  private _send() {
    this._postMessage.socketSend('_moduleSync', {
      module: [...this._moduleLoader.list()],
    });
  }

  private _attachToChannel() {
    this._postMessage.socketOn('_moduleSync', d => {
      for (const name of new Set<string>(d.module)) {
        this._remoteModule.add(name);
      }

      if (!this._moduleAreSame()) {
        console.error(
          'Module are not in sync between the two frames.',
          this.loaded()
        );
      }
    });
  }
}

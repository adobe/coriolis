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

type Factory =
  | false
  | ((
      name: string,
      classObject: Object,
      postMessage: ModuleBase['_postMessage']
    ) => Object);

export type PluginModuleConfig = {factory?: Factory};

export class PluginModule extends ModuleBase {
  private _plugins = new Map();
  private _factory: Factory;

  constructor(
    baseArgs: ConstructorParameters<typeof ModuleBase>[0],
    conf: PluginModuleConfig = {}
  ) {
    super(baseArgs);

    this._factory = conf.factory || false;
  }

  /**
   * Register a set of plugin and solve the dependancy
   * @param  {Object<Class>} plugins Class of each plugins with their respective names in keys
   * @return {void}
   */
  register(plugins: Record<string, Object>) {
    const toInit = new Set<string>();
    for (const name in plugins) {
      if (!Object.prototype.hasOwnProperty.call(plugins, name)) {
        continue;
      }
      if (!this._plugins.has(name)) {
        this._plugins.set(name, {ready: false, class: plugins[name]});
        toInit.add(name);
      }
    }

    for (const name of toInit) {
      this._init(name);
    }
  }

  /**
   * Add one plugin with his name and his class
   * @param  {String}   name    The plugin name/key
   * @param  {CLass}    plugin  Class of the plugin to instanciate
   * @return {Boolean}          If the plugin was added and instanciate or false if it's already present
   */
  add(name: string, plugin: Object) {
    if (this._plugins.has(name)) {
      return false;
    }
    this._plugins.set(name, {ready: false, class: plugin});
    this._init(name);
    return true;
  }

  /**
   * Get the in stance of a plugin
   * @param  {String} name   The name of the plugin to get
   * @return {Object}        The instance of the plugin
   */
  get(name: string) {
    const plugin = this._plugins.get(name);
    if (!plugin) {
      return false;
    }
    if (!plugin.ready) {
      this._init(name);
      return this._plugins.get(name).instance;
    } else {
      return plugin.instance;
    }
  }

  /**
   * Instanciate the plugin (with custom plugin factory if it was registered)
   * @param  {String}  name  Plugin name/key to instanciate
   * @return {Boolean}       If the plugin was instanciate
   */
  private _init(name: string) {
    const plugin = this._plugins.get(name);
    if (!plugin || plugin.ready) {
      return false;
    }

    if (this._factory) {
      plugin.instance = this._factory(name, plugin.class, this._postMessage);
    } else {
      const ClassObj = plugin.class; // For the lint
      plugin.instance = new ClassObj(this._postMessage);
    }
    plugin.ready = true;
    this._plugins.set(name, plugin);

    return true;
  }
}

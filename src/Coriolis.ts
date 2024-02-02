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
 * @module Coriolis
 */

import {DataSerializer} from './DataSerializer';
import {DomRectSerializer} from './serializer/DomRectSerializer';
import {MouseEventSerializer} from './serializer/MouseEventSerializer';
import {KeyboardEventSerializer} from './serializer/KeyboardEventSerializer';
import {SetSerializer} from './serializer/SetSerializer';
import {MapSerializer} from './serializer/MapSerializer';
import {ArrayBufferSerializer} from './serializer/ArrayBufferSerializer';
import {ErrorSerializer} from './serializer/ErrorSerializer';
import {DateSerializer} from './serializer/DateSerializer';

import {PostMessageChannel} from './PostMessageChannel';

import {ModuleLoader} from './ModuleLoader';

import {QueryModule} from './module/QueryModule';
import {EventModule} from './module/EventModule';
import {StoreModule, StoreModuleConfig} from './module/StoreModule';
import {PluginModule, PluginModuleConfig} from './module/PluginModule';
import {ContentModule, ContentModuleConfig} from './module/ContentModule';
import {LoaderUtilModule} from './module/LoaderUtilModule';

type Writable<T> = {
  -readonly [K in keyof T]: T[K];
};

export class Coriolis extends PostMessageChannel {
  readonly targetIframe?: HTMLIFrameElement;

  readonly module: ModuleLoader;
  readonly query: QueryModule;
  readonly event: EventModule;
  readonly store: StoreModule;
  readonly plugin: PluginModule;
  readonly content: ContentModule;
  readonly loaderUtil: LoaderUtilModule;

  // called once when we create it
  constructor(
    target: HTMLIFrameElement | Window | 'defer',
    targetUrl: URL | string,
    options: {
      autoConnect?: boolean;
      pluginModule?: PluginModuleConfig;
      contentModule?: ContentModuleConfig;
      storeModule?: StoreModuleConfig;
    } = {
      autoConnect: true,
    }
  ) {
    const dataSerializer = new DataSerializer();
    let domElement:
      | false
      | HTMLIFrameElement
      | (() => HTMLIFrameElement | false) = false;
    if (target instanceof HTMLIFrameElement) {
      domElement = target;
    } else if (target === 'defer') {
      domElement = () => {
        return this.domElement;
      };
    }

    dataSerializer.addSerializer(
      'DomRectSerializer',
      new DomRectSerializer(domElement)
    );
    dataSerializer.addSerializer(
      'MouseEventSerializer',
      new MouseEventSerializer(domElement)
    );
    dataSerializer.addSerializer(
      'KeyboardEventSerializer',
      new KeyboardEventSerializer()
    );
    dataSerializer.addSerializer('SetSerializer', new SetSerializer());
    dataSerializer.addSerializer('MapSerializer', new MapSerializer());
    dataSerializer.addSerializer(
      'ArrayBufferSerializer',
      new ArrayBufferSerializer()
    );
    dataSerializer.addSerializer('ErrorSerializer', new ErrorSerializer());
    dataSerializer.addSerializer('DateSerializer', new DateSerializer());

    super(target, targetUrl, {...options, dataSerializer});

    if (target instanceof HTMLIFrameElement) {
      this.targetIframe = target;
    }

    this.module = new ModuleLoader(this);

    this.query = this.module.load('query', QueryModule, {}) as QueryModule;
    this.event = this.module.load('event', EventModule, {}) as EventModule;
    this.store = this.module.load(
      'store',
      StoreModule,
      options.storeModule
    ) as StoreModule;
    this.plugin = this.module.load(
      'plugin',
      PluginModule,
      options.pluginModule
    ) as PluginModule;
    this.content = this.module.load(
      'content',
      ContentModule,
      options.contentModule
    ) as ContentModule;
    this.loaderUtil = this.module.load(
      'loaderUtil',
      LoaderUtilModule,
      {}
    ) as LoaderUtilModule;
  }

  static get version() {
    return 'v' + __CORIOLIS_VERSION__;
  }

  static createIframe(
    target: HTMLElement,
    targetUrl: URL | string,
    initialContent: string
  ) {
    if (!(target instanceof HTMLElement)) {
      throw new TypeError('Excepted to have a HTMLElement object');
    }

    let url;
    if (targetUrl instanceof URL) {
      url = targetUrl;
    } else {
      url = new URL(targetUrl);
    }
    const targetDiv = target;
    const targetIframe: Writable<HTMLIFrameElement> =
      document.createElement('iframe');
    targetIframe.src = url.href;
    targetIframe.sandbox.add('allow-scripts', 'allow-same-origin');
    targetIframe.setAttribute('defer', 'true');
    targetDiv.appendChild(targetIframe);

    const options = {
      autoConnect: false,
      contentModule: {initialContent: initialContent},
    };
    return new Coriolis(targetIframe, targetUrl, options);
  }
}

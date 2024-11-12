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

import {assert} from 'chai';
import {PluginModule} from '../src/module/PluginModule';

import Util from './0_util';
import {PostMessageChannel} from '../src/PostMessageChannel';

describe('test pluginDecorator class', () => {
  it('check public api.', done => {
    // create postMessageChannel mock
    const [pmc1] = Util.createMockPostMessageChannel();

    // decorate our class with the storeDecorator
    const obj = new PluginModule(Util.createModuleBaseArg(pmc1));

    // check this correctly decorate our Base class and enhance the API
    assert.typeOf(obj.register, 'function');
    assert.typeOf(obj.add, 'function');
    assert.typeOf(obj.get, 'function');
    done();
  });

  it('check simple task with register and get.', done => {
    // create postMessageChannel mock
    const [pmc1] = Util.createMockPostMessageChannel();

    const pmc1Plugin: typeof pmc1 & {plugin?: PluginModule} = pmc1;

    // decorate our class with the storeDecorator
    const obj1 = new PluginModule(Util.createModuleBaseArg(pmc1));

    pmc1Plugin.plugin = obj1; // Because it's a mock and we don't use ModuleLoader, we don't have alias

    obj1.register({
      pluginA: class {
        coriolis: typeof pmc1Plugin;
        constructor(
          coriolis: PostMessageChannel & {
            fakeConnected: Function;
            fakeDisconnected: Function;
            fakeReconnected: Function;
          } & {plugin?: PluginModule},
        ) {
          coriolis.plugin!.get('pluginB');
          assert.deepEqual(coriolis, pmc1);
          this.coriolis = coriolis;
        }
        get name() {
          return 'pluginA';
        }
        get nameB() {
          return this.coriolis.plugin!.get('pluginB').name;
        }
      },
      pluginB: class {
        get name() {
          return 'pluginB';
        }
      },
    });

    assert.deepEqual(obj1.get('pluginA').name, 'pluginA');
    assert.deepEqual(obj1.get('pluginA').nameB, 'pluginB');
    assert.deepEqual(obj1.get('pluginB').name, 'pluginB');

    done();
  });

  it('check simple task with add.', done => {
    // create postMessageChannel mock
    const [pmc1] = Util.createMockPostMessageChannel();
    const pmc1Plugin: typeof pmc1 & {plugin?: PluginModule} = pmc1;
    // decorate our class with the storeDecorator
    const obj1 = new PluginModule(Util.createModuleBaseArg(pmc1));

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment

    pmc1Plugin.plugin = obj1; // Because it's a mock and we don't use ModuleLoader, we don't have alias

    obj1.add(
      'pluginB',
      class {
        get name() {
          return 'pluginB';
        }
      },
    );

    obj1.add(
      'pluginA',
      class {
        coriolis: typeof pmc1Plugin;
        constructor(
          coriolis: PostMessageChannel & {
            fakeConnected: Function;
            fakeDisconnected: Function;
            fakeReconnected: Function;
          } & {plugin?: PluginModule},
        ) {
          coriolis.plugin!.get('pluginB');
          assert.deepEqual(coriolis, pmc1);
          this.coriolis = coriolis;
        }
        get name() {
          return 'pluginA';
        }
        get nameB() {
          return this.coriolis.plugin!.get('pluginB').name;
        }
      },
    );

    assert.deepEqual(obj1.get('pluginA').name, 'pluginA');
    assert.deepEqual(obj1.get('pluginA').nameB, 'pluginB');
    assert.deepEqual(obj1.get('pluginB').name, 'pluginB');

    done();
  });

  it('check custom factory with add.', done => {
    // create postMessageChannel mock
    const [pmc1] = Util.createMockPostMessageChannel();
    const pmc1Plugin: typeof pmc1 & {plugin?: PluginModule} = pmc1;

    // decorate our class with the storeDecorator
    const obj1 = new PluginModule(Util.createModuleBaseArg(pmc1), {
      factory: function (name, ClassObj, coriolis) {
        assert.deepEqual(coriolis, pmc1);

        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        return new ClassObj(name, coriolis);
      },
    });

    pmc1Plugin.plugin = obj1; // Because it's a mock and we don't use ModuleLoader, we don't have alias

    obj1.add(
      'pluginB',
      class {
        get name() {
          return 'pluginB';
        }
      },
    );

    obj1.add(
      'pluginA',
      class {
        coriolis: typeof pmc1Plugin;
        _name: string;
        constructor(
          name: string,
          coriolis: PostMessageChannel & {
            fakeConnected: Function;
            fakeDisconnected: Function;
            fakeReconnected: Function;
          } & {plugin?: PluginModule},
        ) {
          coriolis.plugin!.get('pluginB');
          this.coriolis = coriolis;
          this._name = name;
        }
        get name() {
          return this._name;
        }
        get nameB() {
          return this.coriolis.plugin!.get('pluginB').name;
        }
      },
    );

    assert.deepEqual(obj1.get('pluginA').name, 'pluginA');
    assert.deepEqual(obj1.get('pluginA').nameB, 'pluginB');
    assert.deepEqual(obj1.get('pluginB').name, 'pluginB');

    done();
  });

  it('try to register twice a plugin.', done => {
    // create postMessageChannel mock
    const [pmc1] = Util.createMockPostMessageChannel();

    // decorate our class with the storeDecorator
    const obj1 = new PluginModule(Util.createModuleBaseArg(pmc1));

    assert.deepEqual(obj1.get('pluginB'), false);
    obj1.add(
      'pluginB',
      class {
        get name() {
          return 'pluginB';
        }
      },
    );

    assert.deepEqual(obj1.get('pluginB').name, 'pluginB');
    obj1.get('pluginB').prop = 'toto';
    assert.deepEqual(obj1.get('pluginB').prop, 'toto');

    obj1.add(
      'pluginB',
      class {
        get name() {
          return 'pluginB';
        }
      },
    );

    assert.deepEqual(obj1.get('pluginB').name, 'pluginB');
    assert.deepEqual(obj1.get('pluginB').prop, 'toto');

    obj1.register({
      pluginB: class {
        get name() {
          return 'pluginB';
        }
      },
    });

    assert.deepEqual(obj1.get('pluginB').name, 'pluginB');
    assert.deepEqual(obj1.get('pluginB').prop, 'toto');

    done();
  });
});

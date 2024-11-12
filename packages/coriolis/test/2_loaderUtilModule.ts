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
import sinon from 'sinon';
import {LoaderUtilModule} from '../src/module/LoaderUtilModule';
import {ModuleBase, ModuleLoaderInterface} from '../src/ModuleBase';

import Util from './0_util';
import {PostMessageChannel} from '../src/PostMessageChannel';

describe('test LoaderUtilModule class', () => {
  const ModuleBaseMock = class extends ModuleBase {
    constructor(arg: {
      postMessage: PostMessageChannel;
      moduleLoader: ModuleLoaderInterface;
    }) {
      super(arg);
    }
  };

  it('check public api.', done => {
    // create postMessageChannel mock
    const [pmc1] = Util.createMockPostMessageChannel();

    // decorate our class with the capabilityDecorator
    const obj = new LoaderUtilModule(Util.createModuleBaseArg(pmc1));

    // check this correctly decorate our Base class and enhance the API
    assert.typeOf(obj.loaded, 'function');

    done();
  });

  it('check load and loaded method.', done => {
    const consoleStub = sinon.stub(console, 'error');

    // create postMessageChannel mock
    const [pmc1, pmc2] = Util.createMockPostMessageChannel(0, 0);

    // create two LoaderUtilModule
    const obj1Args = Util.createModuleBaseArg(pmc1);
    const loader1 = obj1Args.moduleLoader;
    const obj1 = new LoaderUtilModule(obj1Args);
    const obj2Args = Util.createModuleBaseArg(pmc2);
    const loader2 = obj2Args.moduleLoader;
    const obj2 = new LoaderUtilModule(obj2Args);

    assert.deepEqual(Array.from(obj1.loaded().local), []);
    assert.deepEqual(Array.from(obj1.loaded().remote), []);

    loader1.load('test', ModuleBaseMock);

    assert.deepEqual(Array.from(obj1.loaded().local), ['test']);
    assert.deepEqual(Array.from(obj1.loaded().remote), []);

    assert.deepEqual(Array.from(obj2.loaded().local), []);
    assert.deepEqual(Array.from(obj2.loaded().remote), []);

    pmc1.fakeConnected();

    Util.nextTick()
      .then(() => {
        // Step 1, both frame are unhappy, 2 errors
        assert.deepEqual(consoleStub.callCount, 2);

        assert.deepEqual(Array.from(obj2.loaded().local), []);
        assert.deepEqual(Array.from(obj2.loaded().remote), ['test']);

        loader2.load('toto', ModuleBaseMock);

        return Util.nextTick();
      })
      .then(() => {
        // Step 2, one frame receive the update and still is unhappy, we jump from 2 errors to 3 errors
        assert.deepEqual(consoleStub.callCount, 3);

        assert.deepEqual(Array.from(obj1.loaded().local), ['test']);
        assert.deepEqual(Array.from(obj1.loaded().remote), ['toto']);
        assert.deepEqual(Array.from(obj2.loaded().local), ['toto']);
        assert.deepEqual(Array.from(obj2.loaded().remote), ['test']);

        pmc1.fakeDisconnected();

        loader1.load('toto', ModuleBaseMock);
        loader2.load('test', ModuleBaseMock);

        return Util.nextTick();
      })
      .then(() => {
        // Step 3, we disconnect the socket, no no check is done, we stay at 3 errors
        assert.deepEqual(consoleStub.callCount, 3);

        assert.deepEqual(Array.from(obj2.loaded().local).sort(), [
          'test',
          'toto',
        ]);
        assert.deepEqual(Array.from(obj2.loaded().remote).sort(), []);
        assert.deepEqual(Array.from(obj1.loaded().local).sort(), [
          'test',
          'toto',
        ]);
        assert.deepEqual(Array.from(obj1.loaded().remote).sort(), []);

        pmc1.fakeReconnected();
        return Util.nextTick();
      })
      .then(() => {
        // Step 4, we reconnect the socket, both side are now in sync, we stay at 3 errors
        assert.deepEqual(consoleStub.callCount, 3);

        assert.deepEqual(Array.from(obj2.loaded().local).sort(), [
          'test',
          'toto',
        ]);
        assert.deepEqual(Array.from(obj2.loaded().remote).sort(), [
          'test',
          'toto',
        ]);
        assert.deepEqual(Array.from(obj1.loaded().local).sort(), [
          'test',
          'toto',
        ]);
        assert.deepEqual(Array.from(obj1.loaded().remote).sort(), [
          'test',
          'toto',
        ]);

        consoleStub.restore();
        done();
      })
      .catch(err => {
        consoleStub.restore();
        done(err);
      });
  });
});

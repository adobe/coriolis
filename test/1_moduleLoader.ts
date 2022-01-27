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
import {ModuleLoader} from '../src/ModuleLoader';
import {ModuleBase} from '../src/ModuleBase';

import Util from './0_util';

describe('test ModuleLoader class', () => {
  const ModuleBaseMock = class extends ModuleBase {
    constructor(postMessage) {
      super(postMessage);
    }
  };

  it('check public api.', done => {
    // create postMessageChannel mock
    const [pmc1] = Util.createMockPostMessageChannel();

    // decorate our class with the capabilityDecorator
    const obj = new ModuleLoader(pmc1);

    // check this correctly decorate our Base class and enhance the API
    assert.typeOf(obj.require, 'function');

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    assert.typeOf(obj.load, 'function', Object);
    assert.typeOf(obj.has, 'function');
    done();
  });

  it('check load and loaded method.', done => {
    // create postMessageChannel mock
    const [pmc1, pmc2] = Util.createMockPostMessageChannel(0, 0);

    // create two ModuleLoader
    const obj1 = new ModuleLoader(pmc1);
    const obj2 = new ModuleLoader(pmc2);

    assert.deepEqual(Array.from(obj1.list()), []);

    obj1.load('test', ModuleBaseMock);

    assert.deepEqual(Array.from(obj1.list()), ['test']);

    assert.deepEqual(Array.from(obj2.list()), []);

    pmc1.fakeConnected();

    Util.nextTick()
      .then(() => {
        assert.deepEqual(Array.from(obj2.list()), []);

        obj2.load('toto', ModuleBaseMock);

        return Util.nextTick();
      })
      .then(() => {
        assert.deepEqual(Array.from(obj1.list()), ['test']);
        assert.deepEqual(Array.from(obj2.list()), ['toto']);

        pmc1.fakeDisconnected();

        obj1.load('toto', ModuleBaseMock);
        obj2.load('test', ModuleBaseMock);

        return Util.nextTick();
      })
      .then(() => {
        assert.deepEqual(Array.from(obj2.list()).sort(), ['test', 'toto']);
        assert.deepEqual(Array.from(obj1.list()).sort(), ['test', 'toto']);

        pmc1.fakeReconnected();
        return Util.nextTick();
      })
      .then(() => {
        assert.deepEqual(Array.from(obj2.list()).sort(), ['test', 'toto']);
        assert.deepEqual(Array.from(obj1.list()).sort(), ['test', 'toto']);

        done();
      })
      .catch(err => {
        done(err);
      });
  });

  it('check has method.', done => {
    // create postMessageChannel mock
    const [pmc1] = Util.createMockPostMessageChannel();

    // create two ModuleLoader
    const obj = new ModuleLoader(pmc1);

    assert.deepEqual(obj.has('test'), false);

    obj.load('test', ModuleBaseMock);

    assert.deepEqual(obj.has('test'), true);

    done();
  });

  it('check require method.', done => {
    // create postMessageChannel mock
    const [pmc1] = Util.createMockPostMessageChannel();

    // create two ModuleLoader
    const obj = new ModuleLoader(pmc1);

    // create postMessageChannel mock

    assert.throws(() => {
      obj.require('test');
    });

    obj.load('test', ModuleBaseMock);
    assert.doesNotThrow(() => {
      obj.require('test');
    });
    done();
  });

  it("check can't load two module with the same name.", done => {
    // create postMessageChannel mock
    const [pmc1] = Util.createMockPostMessageChannel(0, 0);

    // create two ModuleLoader
    const obj1 = new ModuleLoader(pmc1);

    obj1.load('test', ModuleBaseMock);
    assert.throws(
      () => obj1.load('test', ModuleBaseMock),
      'This module is already registered'
    );

    done();
  });
});

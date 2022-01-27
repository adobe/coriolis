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
import {QueryModule} from '../src/module/QueryModule';

import Util from './0_util';

describe('test queryDecorator class', () => {
  it('check public api.', done => {
    // create postMessageChannel mock
    const [pmc1] = Util.createMockPostMessageChannel();

    // decorate our class with the queryDecorator
    const obj = new QueryModule(Util.createModuleBaseArg(pmc1));

    // check this correctly decorate our Base class and enhance the API
    assert.typeOf(obj.register, 'function');
    assert.typeOf(obj.remove, 'function');
    assert.typeOf(obj.call, 'function');
    assert.typeOf(obj.isAvailable, 'function');
    assert.typeOf(obj.isRegistered, 'function');
    assert.typeOf(obj.setCatchUnregisterCall, 'function');
    done();
  });

  it('check rejection if query is not registered.', done => {
    // create postMessageChannel mock
    const [pmc1, pmc2] = Util.createMockPostMessageChannel(1, 1);

    // decorate our class with the queryDecorator
    const obj1 = new QueryModule(Util.createModuleBaseArg(pmc1));
    new QueryModule(Util.createModuleBaseArg(pmc2));

    const p1 = obj1.call('notRegisterFunction', 'arg1');
    assert.instanceOf(p1, Promise); // check the result is a Promise
    p1.catch(e => {
      // this is a rejection
      assert.instanceOf(e, TypeError); // the rejection is a TypeError
      done();
    });
  });

  it('check query result with resolve is correct.', done => {
    // create postMessageChannel mock
    const [pmc1, pmc2] = Util.createMockPostMessageChannel(1, 1);

    // decorate our class with the queryDecorator
    const obj1 = new QueryModule(Util.createModuleBaseArg(pmc1));
    const obj2 = new QueryModule(Util.createModuleBaseArg(pmc2));

    obj2.register('query1', arg => {
      assert.deepEqual(arg, 'arg1'); // check argument of query are correct.
      return new Promise(resolve => {
        // test async response
        setTimeout(() => {
          resolve('arg2'); // return arg2 value
        }, 1);
      });
    });
    const p1 = obj1.call('query1', 'arg1');
    assert.instanceOf(p1, Promise); // check the result is a Promise
    p1.then(d => {
      assert.deepEqual(d, 'arg2');
      done();
    });
  });

  it('check query result with reject is correct.', done => {
    // create postMessageChannel mock
    const [pmc1, pmc2] = Util.createMockPostMessageChannel(1, 1);

    // decorate our class with the queryDecorator
    const obj1 = new QueryModule(Util.createModuleBaseArg(pmc1));
    const obj2 = new QueryModule(Util.createModuleBaseArg(pmc2));

    obj2.register('query1', arg => {
      assert.deepEqual(arg, 'arg1'); // check argument of query are correct.
      return new Promise((resolve, reject) => {
        // test async response
        setTimeout(() => {
          reject(new Error('arg2')); // return arg2 value
        }, 1);
      });
    });
    const p1 = obj1.call('query1', 'arg1');
    assert.instanceOf(p1, Promise); // check the result is a Promise
    p1.catch(e => {
      const targetError = new Error('arg2');
      // stack trace are not the same, toString compare the type and the message
      assert.deepEqual(e.toString(), targetError.toString());
      done();
    });
  });

  it('check query result with reject is not a promise.', done => {
    // create postMessageChannel mock
    const [pmc1, pmc2] = Util.createMockPostMessageChannel(1, 1);

    // decorate our class with the queryDecorator
    const obj1 = new QueryModule(Util.createModuleBaseArg(pmc1));
    const obj2 = new QueryModule(Util.createModuleBaseArg(pmc2));

    obj2.register('query1', arg => {
      assert.deepEqual(arg, 'arg1'); // check argument of query are correct.
      return new Promise((resolve, reject) => {
        // test async response
        setTimeout(() => {
          reject('arg2'); // return arg2 value
        }, 1);
      });
    });
    const p1 = obj1.call('query1', 'arg1');
    assert.instanceOf(p1, Promise); // check the result is a Promise
    p1.catch(e => {
      const targetError = new Error('arg2');
      // stack trace are not the same, toString compare the type and the message
      assert.deepEqual(e.toString(), targetError.toString());
      done();
    });
  });

  it('check reject when result is not a Promise.', done => {
    // create postMessageChannel mock
    const [pmc1, pmc2] = Util.createMockPostMessageChannel(1, 1);

    // decorate our class with the queryDecorator
    const obj1 = new QueryModule(Util.createModuleBaseArg(pmc1));
    const obj2 = new QueryModule(Util.createModuleBaseArg(pmc2));

    obj2.register('query1', () => {
      return 'test';
    });

    const consoleStub = sinon.stub(console, 'error');
    const p1 = obj1.call('query1', 'arg1');
    assert.instanceOf(p1, Promise); // check the result is a Promise
    p1.catch(d => {
      assert.instanceOf(d, Error); // the rejection is an Error
      assert.deepEqual(d.message, 'Query "query1" doesn\'t return a Promise.');
      assert.deepEqual(consoleStub.calledOnce, true);
      assert.deepEqual(
        consoleStub.getCall(0).args[0],
        'Query "query1" doesn\'t return a Promise.'
      );
      consoleStub.restore();
      done();
    });
  });

  it('check remove works has expected.', done => {
    // create postMessageChannel mock
    const [pmc1, pmc2] = Util.createMockPostMessageChannel(1, 1);

    // decorate our class with the queryDecorator
    const obj1 = new QueryModule(Util.createModuleBaseArg(pmc1));
    const obj2 = new QueryModule(Util.createModuleBaseArg(pmc2));

    obj2.register('query1', () => Promise.resolve('arg2'));

    const p1 = obj1.call('query1', 'arg1');
    assert.instanceOf(p1, Promise); // check the result is a Promise
    p1.then(d => {
      assert.deepEqual(d, 'arg2');

      obj2.remove('query1');
      const p2 = obj1.call('query1', 'arg3');
      assert.instanceOf(p2, Promise); // check the result is a Promise
      p2.catch(e => {
        // this is a rejection
        assert.instanceOf(e, TypeError); // the rejection is a TypeError
        done();
      });
    });
  });

  it('check isAvailable and isRegistered works has expected.', done => {
    // create postMessageChannel mock
    const [pmc1, pmc2] = Util.createMockPostMessageChannel(1, 1);

    // decorate our class with the queryDecorator
    const obj1 = new QueryModule(Util.createModuleBaseArg(pmc1));
    const obj2 = new QueryModule(Util.createModuleBaseArg(pmc2));

    obj2.register('query1', () => Promise.resolve('arg2'));

    const p1 = obj1.isAvailable('query1');
    assert.instanceOf(p1, Promise); // check the result is a Promise
    assert.deepEqual(obj2.isRegistered('query1'), true);
    p1.then(d => {
      assert.deepEqual(d, true);
      obj2.remove('query1');
      const p2 = obj1.isAvailable('query1');
      assert.instanceOf(p2, Promise); // check the result is a Promise
      assert.deepEqual(obj2.isRegistered('query1'), false);
      p2.then(d => {
        assert.deepEqual(d, false);
        done();
      });
    });
  });

  it('check setCatchUnregisterCall is correct.', done => {
    // create postMessageChannel mock
    const [pmc1, pmc2] = Util.createMockPostMessageChannel(1, 1);

    // decorate our class with the queryDecorator
    const obj1 = new QueryModule(Util.createModuleBaseArg(pmc1));
    const obj2 = new QueryModule(Util.createModuleBaseArg(pmc2));

    const queryName = `call=${Math.random()}`;

    obj2.setCatchUnregisterCall((name, arg) => {
      assert.deepEqual(name, queryName); // check name of query is correct.
      assert.deepEqual(arg, 'arg1'); // check argument of query are correct.
      return new Promise(resolve => {
        // test async response
        setTimeout(() => {
          resolve('arg2'); // return arg2 value
        }, 1);
      });
    });
    const p1 = obj1.call(queryName, 'arg1');
    assert.instanceOf(p1, Promise); // check the result is a Promise
    p1.then(d => {
      assert.deepEqual(d, 'arg2');
      done();
    });
  });
});

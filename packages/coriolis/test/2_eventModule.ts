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
import {EventModule} from '../src/module/EventModule';
// import capabilityDecorator from '../src/module/capabilityDecorator';

import Util from './0_util';

describe('test eventModule class', () => {
  it('check public api.', done => {
    // create postMessageChannel mock
    const [pmc1] = Util.createMockPostMessageChannel();

    // decorate our class with the eventModule
    const obj = new EventModule(Util.createModuleBaseArg(pmc1));
    // check this correctly decorate our Base class and enhance the API
    assert.typeOf(obj.emit, 'function');
    assert.typeOf(obj.on, 'function');
    assert.typeOf(obj.once, 'function');
    done();
  });

  it('functionnal testing scenario.', done => {
    // Object for count how many times the callback are called.
    const called = {
      onInternal: 0,
      onExternal: 0,
      onceInternal: 0,
      onceExternal: 0,
    };

    // create postMessageChannel mock
    const [pmc1, pmc2] = Util.createMockPostMessageChannel();

    // decorate our two classes with the eventModule
    const obj1 = new EventModule(Util.createModuleBaseArg(pmc1));
    const obj2 = new EventModule(Util.createModuleBaseArg(pmc2));

    // register event listener for one time only
    const internalOnce = (...args: any[]) => {
      called.onceInternal++; // increment counter of called callback
      const type = args.pop(); // take last arg (origin arg)
      assert.deepEqual(type, 'internal'); // check it's internal event
      assert.deepEqual(args, ['arg1', {arg2: 'val2'}, null]); // check the parameters
    };
    obj1.once('event1', internalOnce);

    const externalOnce = (...args: any[]) => {
      called.onceExternal++; // increment counter of called callback
      const type = args.pop(); // take last arg (origin arg)
      assert.deepEqual(type, 'external'); // check it's external event
      assert.deepEqual(args, ['arg1', {arg2: 'val2'}, null]); // check the parameters
    };
    obj2.once('event1', externalOnce);

    // register event listener
    const internalOn = (...args: any[]) => {
      called.onInternal++; // increment counter of called callback
      const type = args.pop(); // take last arg (origin arg)
      assert.deepEqual(type, 'internal'); // check it's internal event
      assert.deepEqual(args, ['arg1', {arg2: 'val2'}, null]); // check the parameters
    };
    obj1.on('event1', internalOn);

    const externalOn = (...args: any[]) => {
      called.onExternal++; // increment counter of called callback
      const type = args.pop(); // take last arg (origin arg)
      assert.deepEqual(type, 'external'); // check it's external event
      assert.deepEqual(args, ['arg1', {arg2: 'val2'}, null]); // check the parameters
    };
    obj2.on('event1', externalOn);

    // send an event that nobody listen
    obj1.emit('event0', 'test');

    // check nobody received it
    assert.deepEqual(called, {
      onInternal: 0,
      onExternal: 0,
      onceInternal: 0,
      onceExternal: 0,
    });

    // send an event that everyone listen
    obj1.emit('event1', 'arg1', {arg2: 'val2'}, null);

    // check everyone received it
    assert.deepEqual(called, {
      onInternal: 1,
      onExternal: 1,
      onceInternal: 1,
      onceExternal: 1,
    });

    // send again an event that everyone listen
    obj1.emit('event1', 'arg1', {arg2: 'val2'}, null);

    // check that the once stop received this event
    assert.deepEqual(called, {
      onInternal: 2,
      onExternal: 2,
      onceInternal: 1,
      onceExternal: 1,
    });

    obj1.once('event1', internalOnce);
    obj2.once('event1', externalOnce);

    obj2.off('event1', externalOn);
    obj2.off('event1', externalOnce);
    obj1.off('event1', internalOn);
    obj1.off('event1', internalOnce);

    // check nobody received it
    assert.deepEqual(called, {
      onInternal: 2,
      onExternal: 2,
      onceInternal: 1,
      onceExternal: 1,
    });

    done();
  });
});

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
import {StoreModule} from '../src/module/StoreModule';

import Util from './0_util';

describe('test storeDecorator class', () => {
  it('check public api.', done => {
    // create postMessageChannel mock
    const [pmc1] = Util.createMockPostMessageChannel();

    // decorate our class with the storeDecorator
    const obj = new StoreModule(Util.createModuleBaseArg(pmc1));

    // check this correctly decorate our Base class and enhance the API
    assert.typeOf(obj.get, 'function');
    assert.typeOf(obj.set, 'function');
    assert.typeOf(obj.on, 'function');
    assert.typeOf(obj.once, 'function');
    done();
  });

  // it('check set with bad arguments failled.', done => {
  //   // create postMessageChannel mock
  //   const [pmc1, pmc2] = Util.createMockPostMessageChannel(1, 1);

  //   // decorate our class with the storeDecorator
  //   const obj1 = new StoreModule(Util.createModuleBaseArg(pmc1));
  //   new StoreModule(Util.createModuleBaseArg(pmc2));

  //   assert.throws(() => obj1.set('string'), TypeError);

  //   done();
  // });

  it('check get and set.', done => {
    // create postMessageChannel mock
    const [pmc1, pmc2] = Util.createMockPostMessageChannel(1, 1);

    // decorate our class with the storeDecorator
    const obj1 = new StoreModule(Util.createModuleBaseArg(pmc1));
    const obj2 = new StoreModule(Util.createModuleBaseArg(pmc2));

    assert.deepEqual(obj1.get('notExists'), undefined);

    obj1.set('var1', 'value1');
    assert.deepEqual(obj1.get('var1'), 'value1');

    Util.nextTick()
      .then(() => {
        assert.deepEqual(obj2.get('var1'), 'value1');

        obj1.set({var1: 'value2', var2: 'value3'});
        assert.deepEqual(obj1.get('var1'), 'value2');
        assert.deepEqual(obj1.get('var2'), 'value3');

        return Util.nextTick();
      })
      .then(() => {
        assert.deepEqual(obj2.get('var1'), 'value2');
        assert.deepEqual(obj2.get('var2'), 'value3');

        return Util.nextTick();
      })
      .then(() => {
        // check optimizations (partial send)
        obj1.set({var1: 'value2', var2: 'value4'});

        assert.deepEqual(obj1.get('var1'), 'value2');
        assert.deepEqual(obj2.get('var1'), 'value2');
        assert.deepEqual(obj1.get('var2'), 'value4');

        return Util.nextTick();
      })
      .then(() => {
        assert.deepEqual(obj2.get('var2'), 'value4');

        return Util.nextTick();
      })
      .then(() => {
        // check optimizations (no send + bulk)
        obj1.set({var1: 'value2'});

        assert.deepEqual(obj1.get('var1'), 'value2');
        assert.deepEqual(obj2.get('var1'), 'value2');

        return Util.nextTick();
      })
      .then(() => {
        // check optimizations (no send + single)
        obj1.set('var1', 'value2');

        assert.deepEqual(obj1.get('var1'), 'value2');
        assert.deepEqual(obj2.get('var1'), 'value2');

        // check global object doesn't poluate the store
        assert.deepEqual(obj2.get('poluate'), undefined);
        assert.deepEqual(obj1.get('poluate'), undefined);

        done();
      })
      .catch(err => {
        done(err);
      });
  });

  it('fonctionnal test of on, once and off.', done => {
    // Object for count how many times the callback are called.
    const called = {
      onInternal: 0,
      onExternal: 0,
      onceInternal: 0,
      onceExternal: 0,
    };

    // create postMessageChannel mock
    const [pmc1, pmc2] = Util.createMockPostMessageChannel();

    // decorate our class with the storeDecorator
    const obj1 = new StoreModule(Util.createModuleBaseArg(pmc1));
    const obj2 = new StoreModule(Util.createModuleBaseArg(pmc2));

    // register store listener for one time only
    const internalOnce = (...args) => {
      called.onceInternal++; // increment counter of called callback
      const type = args.pop(); // take last arg (origin arg)
      assert.deepEqual(type, 'internal'); // check it's internal store
      assert.deepEqual(args, ['val1']); // check the parameters
    };
    obj1.once('var1', internalOnce);

    const externalOnce = (...args) => {
      called.onceExternal++; // increment counter of called callback
      const type = args.pop(); // take last arg (origin arg)
      assert.deepEqual(type, 'external'); // check it's external store
      assert.deepEqual(args, ['val1']); // check the parameters
    };
    obj2.once('var1', externalOnce);

    // register store listener
    const internalOn = (...args) => {
      called.onInternal++; // increment counter of called callback
      const type = args.pop(); // take last arg (origin arg)
      assert.deepEqual(type, 'internal'); // check it's internal store
      assert.deepEqual(args, ['val' + called.onInternal]); // check the parameters
    };
    obj1.on('var1', internalOn);

    const externalOn = (...args) => {
      called.onExternal++; // increment counter of called callback
      const type = args.pop(); // take last arg (origin arg)
      assert.deepEqual(type, 'external'); // check it's external store
      assert.deepEqual(args, ['val' + called.onExternal]); // check the parameters
    };
    obj2.on('var1', externalOn);

    // send an store that nobody listen
    obj1.set('var0', 'test');

    // check nobody received it
    assert.deepEqual(called, {
      onInternal: 0,
      onExternal: 0,
      onceInternal: 0,
      onceExternal: 0,
    });

    // send an store that everyone listen
    obj1.set('var1', 'val1');

    // check everyone received it
    assert.deepEqual(called, {
      onInternal: 1,
      onExternal: 1,
      onceInternal: 1,
      onceExternal: 1,
    });

    // send again an store that everyone listen with same value (optimization)
    obj1.set('var1', 'val1');
    obj1.set({var1: 'val1'});
    obj1.set({var1: 'val1', var2: 'val2'});

    // check that the optimization prevent the events
    assert.deepEqual(called, {
      onInternal: 1,
      onExternal: 1,
      onceInternal: 1,
      onceExternal: 1,
    });

    // send again an store that everyone listen
    obj1.set('var1', 'val2');

    // check that the once stop received this store
    assert.deepEqual(called, {
      onInternal: 2,
      onExternal: 2,
      onceInternal: 1,
      onceExternal: 1,
    });

    obj1.once('var1', internalOnce);
    obj2.once('var1', externalOnce);

    obj2.off('var1', externalOn);
    obj2.off('var1', externalOnce);
    obj1.off('var1', internalOn);
    obj1.off('var1', internalOnce);

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

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
import {MapSerializer} from '../src/serializer/MapSerializer';

describe('test MapSerializer class', () => {
  it('Check all is correctly implemented', done => {
    const s = new MapSerializer();
    assert.instanceOf(s.classToSerialize, Object);
    assert.typeOf(s.serialize, 'function');
    assert.typeOf(s.deserialize, 'function');

    done();
  });

  it('Check serialize and deserialize data', done => {
    const d = new Map();
    d.set('acwq', 21321313);
    d.set(12231434, '12321441');
    d.set(Math.random(), Math.random());

    const s = new MapSerializer();
    const r = s.deserialize(s.serialize(d));
    assert.instanceOf(r, Map);
    assert.deepEqual(r, d);
    done();
  });
});

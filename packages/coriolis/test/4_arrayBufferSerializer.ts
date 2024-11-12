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
import {ArrayBufferSerializer} from '../src/serializer/ArrayBufferSerializer';

describe('test ArrayBuffer class', () => {
  it('Check all is correctly implemented', done => {
    const s = new ArrayBufferSerializer();
    assert.instanceOf(s.classToSerialize, Object);
    assert.typeOf(s.serialize, 'function');
    assert.typeOf(s.deserialize, 'function');

    done();
  });

  it('Check serialize and deserialize data', done => {
    const s = new ArrayBufferSerializer();

    // Force int8
    let d = new Uint8Array([2, 0, 255, 128, 3]).buffer;
    let r = s.deserialize(s.serialize(d));
    assert.instanceOf(r, ArrayBuffer);
    assert.deepEqual(r, d);

    // Allow int16
    d = new Uint8Array([2, 0, 255, 128, 78, 42]).buffer;
    r = s.deserialize(s.serialize(d));
    assert.instanceOf(r, ArrayBuffer);
    assert.deepEqual(r, d);

    // Allow int32
    d = new Uint8Array([2, 0, 255, 128, 122, 45, 28, 90]).buffer;
    r = s.deserialize(s.serialize(d));
    assert.instanceOf(r, ArrayBuffer);
    assert.deepEqual(r, d);

    done();
  });
});

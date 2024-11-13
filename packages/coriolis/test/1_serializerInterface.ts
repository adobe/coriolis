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

import {SerializerBase} from '../src/SerializerBase';

describe('test SerializerBase class', () => {
  it('check serializerBase extends.', done => {
    class A {}
    class Serializer extends SerializerBase {
      get classToSerialize() {
        return A;
      }
      serialize(object: any) {
        return object;
      }
      deserialize(object: any) {
        return object;
      }
    }

    const s = new Serializer();

    assert.deepEqual(s.classToSerialize, A);
    assert.deepEqual(s.serialize({}), {});
    assert.deepEqual(s.deserialize({}), {});
    done();
  });

  // it('check serializerBase throw error when bad extension.', done => {
  //   class Serializer extends SerializerBase {}

  //   const s = new Serializer();

  //   assert.throws(() => s.classToSerialize(), Error);
  //   // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //   // @ts-ignore
  //   assert.throws(() => s.serialize(), Error);
  //   // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //   // @ts-ignore
  //   assert.throws(() => s.deserialize(), Error);
  //   done();
  // });
});

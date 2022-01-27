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
import {ErrorSerializer} from '../src/serializer/ErrorSerializer';

describe('test ErrorSerializer class', () => {
  it('Check all is correctly implemented', done => {
    const s = new ErrorSerializer();
    assert.instanceOf(s.classToSerialize, Object);
    assert.typeOf(s.serialize, 'function');
    assert.typeOf(s.deserialize, 'function');

    done();
  });

  it('Check serialize and deserialize data', done => {
    const d = new TypeError('Test');

    const s = new ErrorSerializer();
    const r = s.deserialize(s.serialize(d));
    assert.instanceOf(r, TypeError);
    assert.deepEqual(r.message, d.message);
    assert.deepEqual(r.stack, d.stack);
    done();
  });

  describe('Check all error type', () => {
    const checkErrorType = (ErrorType, done) => {
      const d = new ErrorType('Test' + Math.random());

      const s = new ErrorSerializer();
      const r = s.deserialize(s.serialize(d));
      assert.instanceOf(r, ErrorType);
      assert.deepEqual(r.message, d.message);
      assert.deepEqual(r.stack, d.stack);
      done();
    };

    // InternalError works only on firefox. Test units runs on chrome by default
    const nativeErrorType = [
      'EvalError',
      /* 'InternalError',*/ 'RangeError',
      'ReferenceError',
      'SyntaxError',
      'TypeError',
      'URIError',
      'Error',
    ];

    for (const v of nativeErrorType) {
      it(`check type: ${v}`, done => {
        const ErrorType = global[v];
        checkErrorType(ErrorType, done);
      });
    }

    it('Check custome Error class', done => {
      class MyCustomError extends Error {
        constructor(...args) {
          super(...args);
          this.name = 'MyCustomError';
        }
      }

      const d = new MyCustomError('Test' + Math.random());
      const s = new ErrorSerializer();
      const r = s.deserialize(s.serialize(d));
      assert.instanceOf(r, Error);
      assert.deepEqual(r.message, d.message);
      assert.deepEqual(r.stack, d.stack);
      done();
    });
  });
});

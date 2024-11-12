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
import {DataSerializer} from '../src/DataSerializer';

describe('test DataSerializer class', () => {
  it('check public api.', done => {
    const obj = new DataSerializer();

    assert.typeOf(obj.addSerializer, 'function');
    assert.typeOf(obj.stringify, 'function');
    assert.typeOf(obj.parse, 'function');
    done();
  });

  it('check dataserializer without serializers.', done => {
    const obj = new DataSerializer();

    const tests = [
      'string',
      123,
      -123.98,
      true,
      false,
      null,
      undefined,
      [1, 2.4, true, 'string', [4, 5], null],
      {
        string: 'toto',
        int: 34,
        double: 3.5675,
        boolean: false,
        array: [1, 2, 3],
        obj: {key: 'value'},
      },
    ];

    for (const value of tests) {
      assert.deepEqual(obj.parse(obj.stringify(value)), value);
    }

    done();
  });

  it('check private properties are not exposed.', done => {
    const obj = new DataSerializer();

    assert.deepEqual(
      obj.parse(obj.stringify({key: 'value', _private: 'null'})),
      {key: 'value'},
    );
    assert.deepEqual(
      obj.parse(obj.stringify({key: 'value', _private: {key2: 'null'}})),
      {key: 'value'},
    );
    assert.deepEqual(
      obj.parse(obj.stringify({key: 'value', obj2: {_private: 'null'}})),
      {key: 'value', obj2: {}},
    );

    done();
  });

  it('reject bad serializers.', done => {
    const obj = new DataSerializer();
    class B {}

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    assert.throws(() => obj.addSerializer('a', new B()), Error);
    done();
  });

  it('reject register a serializer twice.', done => {
    const obj = new DataSerializer();
    class ClassToSerialize {}
    class SimpleSerializer extends SerializerBase {
      constructor() {
        super();
      }
      get classToSerialize() {
        return ClassToSerialize;
      }
      serialize() {
        return {};
      }
      deserialize() {
        return {};
      }
    }

    obj.addSerializer('a', new SimpleSerializer());

    assert.throws(() => obj.addSerializer('a', new SimpleSerializer()), Error);
    done();
  });

  it('test simple serializers.', done => {
    const obj = new DataSerializer();
    class ClassToSerialize {}
    class SimpleSerializer extends SerializerBase<ClassToSerialize> {
      constructor() {
        super();
      }

      get classToSerialize() {
        return ClassToSerialize;
      }

      serialize(object) {
        return {serialize: true, ...object};
      }

      deserialize(object) {
        assert.deepEqual(object.serialize, true);
        object = Object.assign(new ClassToSerialize(), object);
        object.deserialize = true;
        return object;
      }
    }

    obj.addSerializer('a', new SimpleSerializer());

    // test normal use
    assert.deepEqual(
      obj.parse(obj.stringify({key: 'value', _private: 'null'})),
      {key: 'value'},
    );

    // test with serializer at different levels
    const serialize = {
      key: new ClassToSerialize(),
      key2: {key3: 'value'},
      _private: 'null',
    };
    const deserialize = obj.parse(
      obj.stringify(serialize),
    ) as typeof serialize & {key: {serialize: boolean; deserialize: boolean}};
    assert.instanceOf(deserialize.key, ClassToSerialize);
    assert.deepEqual(deserialize.key.serialize, true);
    assert.deepEqual(deserialize.key.deserialize, true);
    assert.deepEqual(deserialize.key2, {key3: 'value'});
    assert.deepEqual(Object.keys(deserialize), ['key', 'key2']);

    const serialize2 = new ClassToSerialize();
    const deserialize2 = obj.parse(
      obj.stringify(serialize2),
    ) as ClassToSerialize;
    assert.instanceOf(deserialize2, ClassToSerialize);

    done();
  });

  it('test deserialize something which is crafted by hand with private inside.', done => {
    const obj = new DataSerializer();
    class ClassToSerialize {}
    class SimpleSerializer extends SerializerBase<ClassToSerialize, Object> {
      constructor() {
        super();
      }
      get classToSerialize() {
        return ClassToSerialize;
      }

      serialize(object) {
        object.serialize = true;
        return object;
      }

      deserialize(object) {
        assert.deepEqual(object.serialize, true);
        // private key is already removed here
        assert.deepEqual(object._privateKey, undefined);
        object = Object.assign(new ClassToSerialize(), object);
        object.deserialize = true;
        return object;
      }
    }

    obj.addSerializer('simpleSeiralizerKey', new SimpleSerializer());

    const serialize =
      '{"key":{"value":{"serialize":true},"_serializerKey":"simpleSeiralizerKey", "_privateKey": "myPrivateValue"},"key2":{"key3":"value"}}';
    const deserialize = obj.parse(serialize) as {
      key: ClassToSerialize & {
        serialize: boolean;
        deserialize: boolean;
        _privateKey?: unknown;
      };
    };
    assert.instanceOf(deserialize.key, ClassToSerialize);
    assert.deepEqual(deserialize.key.serialize, true);
    assert.deepEqual(deserialize.key.deserialize, true);
    assert.deepEqual(deserialize.key._privateKey, undefined);

    const serialize2 =
      '{"key":{"serialize":true,"_serializerKey":"simpleSeiralizerKeyNotFound", "_privateKey": "myPrivateValue"},"key2":{"key3":"value"}}';
    const deserialize2 = obj.parse(serialize2) as {key?: unknown};
    assert.deepEqual(deserialize2.key, undefined);

    done();
  });
});

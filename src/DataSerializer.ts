/*
 * Copyright 2017 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

/**
 * @module Serializer
 */

import {SerializerBase} from './SerializerBase';

/**
 * A class that handles the stringification and parsing of the data that will be sent through PostMessage.
 * This has two main differences with JSON.parse/JSON.stringify.
 * - It allows loading custom domain serializer that could be loaded dynamically
 * - It excludes from serialization all the property of objects which start with an "_" (underscore)
 * This allows having more than javascript primitive to be serialized and also to keep some property to be
 *  transferred because they shouldn't or they technically can't be transferred. For example, a security
 *  token might not be transferred or an HTMLElement reference couldn't be technically transferred. In that
 *  case, it could still be interesting to use it in a store but you never want them to be transferred.
 */
export class DataSerializer {
  /**
   * Internal array to save all custom serializer we have register
   * @type {Map}
   */
  private _serializers = new Map<string, SerializerBase>();

  /**
   * Add a custom serializer
   * @param {string} name The name of the serializer
   * @param {Object} serializer A serializer which extends and implement SerializerBase
   * @return {boolean} return if the serializer is correctly added
   */
  addSerializer(name: string, serializer: SerializerBase) {
    if (!(serializer instanceof SerializerBase)) {
      throw new Error('The serializer is not an instanceof SerializerBase');
    }

    if (this._serializers.has(name)) {
      throw new Error('This serializer is already registered');
    }
    // Add serializer
    this._serializers.set(name, serializer);
    return true;
  }

  // ================================================ //
  //                    SERIALIZER                    //
  // ================================================ //

  /**
   * Stringify object
   * @param  {any}      obj   The data to stringify
   * @return {string}         JSON string of the object
   */
  stringify(obj: unknown) {
    obj = this._serializerStringify(obj);
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const myThis = this; // can't use closure since we need the JSON.stringify this
    return JSON.stringify(obj, function (k, v) {
      // typeof => eject number and things that doesn't have match function
      if (k !== '_serializerKey' && typeof k === 'string' && k.match(/^_/)) {
        return undefined;
      }
      // if v is used, class is lost, it's always an Object
      // eslint-disable-next-line no-invalid-this
      return myThis._serializerStringify(this[k], v);
    });
  }

  /**
   * Call all custom serializer
   * @param  {Object}         obj         Object to serialize
   * @param  {any}            [fallback]  Default value if we can't find a dataSerializer for it
   * @return {Object|any}                 The value after the custom serializer or fallback
   */
  private _serializerStringify(obj: unknown, fallback = false) {
    if (obj instanceof Object) {
      for (const [serializerName, s] of this._serializers) {
        if (obj instanceof s.classToSerialize) {
          return {...s.serialize(obj), _serializerKey: serializerName};
        }
      }
    }
    return fallback ? fallback : obj;
  }

  /**
   * Parse object
   * @param  {string} jsonString Json string to parse
   * @return {any}               The value of the jsonString
   */
  parse(jsonString: string) {
    if (typeof jsonString === 'undefined') {
      return jsonString;
    }
    const obj = JSON.parse(jsonString, (k, v) => {
      if (k !== '_serializerKey' && typeof k === 'string' && k.match(/^_/)) {
        return undefined;
      }
      return this._serializerParse(v);
    });
    return this._serializerParse(obj);
  }

  /**
   * Call all custom serializer
   * @param  {any}    obj The current parse value
   * @return {any}    The value after the custom parse or the input obj
   */
  private _serializerParse(
    obj: unknown | (Object & {_serializerKey?: string})
  ) {
    const key = (obj as Object & {_serializerKey?: string})?._serializerKey;
    if (key) {
      for (const [serializerName, s] of this._serializers) {
        if (key === serializerName) {
          return s.deserialize(obj as Object);
        }
      }
      return undefined;
    }
    return obj;
  }
}

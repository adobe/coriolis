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

export abstract class SerializerBase<
  ClassName = Object,
  SerializedData = unknown,
  ClassConstructor =
    | (new () => ClassName)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    | (new (...args: any[]) => ClassName),
> {
  /**
   * Getter to overload which return the Class to serialize
   * @abstract
   * @return {Object} Class object to serialize
   */
  abstract get classToSerialize(): ClassConstructor;

  /**
   * Method to implement for serialize an object (which match the classToSerialize) (reverse operation of deserialize)
   * @param  {Object} object      Object to serialize
   * @abstract
   * @return {Object}             Return a standard serialized object
   */
  abstract serialize(object: ClassName): SerializedData;

  /**
   * Method to implement for deserialize an object (reverse operation of serialize)
   * @param  {object} object       The object to deserialize
   * @abstract
   * @return {object}              The deserialized object
   */
  abstract deserialize(object: SerializedData): ClassName;
}

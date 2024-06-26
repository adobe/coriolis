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

import {SerializerBase} from '../SerializerBase';

type SerializedData = Array<[unknown, unknown]>;

export class MapSerializer extends SerializerBase<
  Map<unknown, unknown>,
  SerializedData
> {
  get classToSerialize() {
    return Map;
  }

  serialize(e: Map<unknown, unknown>) {
    const newMap: SerializedData = [];
    for (const [k, v] of e.entries()) {
      newMap.push([k, v]);
    }
    return newMap;
  }

  deserialize(e: SerializedData) {
    const newMap = new Map();
    for (const item of e) {
      newMap.set(item[0], item[1]);
    }

    return newMap;
  }
}

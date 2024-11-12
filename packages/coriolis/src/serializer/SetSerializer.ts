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

type SerializedData = Array<unknown>;

export class SetSerializer extends SerializerBase<
  Set<unknown>,
  SerializedData
> {
  get classToSerialize() {
    return Set;
  }

  serialize(e: Set<unknown>) {
    const newSet = [];
    for (const v of e.values()) {
      newSet.push(v);
    }
    return newSet;
  }

  deserialize(e: Array<unknown>) {
    const newSet = new Set();
    for (const item of e) {
      newSet.add(item);
    }

    return newSet;
  }
}

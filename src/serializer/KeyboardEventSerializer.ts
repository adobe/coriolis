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

type deprecatedKeyProperty = {
  charCode?: number;
  keyCode?: number;
  which?: number;
};
type SerializedData = Required<KeyboardEventInit> &
  deprecatedKeyProperty & {type: string};

export class KeyboardEventSerializer extends SerializerBase<
  KeyboardEvent,
  SerializedData
> {
  constructor() {
    super();
  }

  get classToSerialize() {
    return KeyboardEvent;
  }

  serialize(e: KeyboardEvent) {
    return {
      type: e.type,
      bubbles: e.bubbles,
      cancelable: e.cancelable,
      key: e.key,
      code: e.code,
      location: e.location,
      ctrlKey: e.ctrlKey,
      shiftKey: e.shiftKey,
      altKey: e.altKey,
      metaKey: e.metaKey,
      repeat: e.repeat,
      isComposing: e.isComposing,
      charCode: e.charCode,
      keyCode: e.keyCode,
      which: e.which,
    } as SerializedData;
  }

  deserialize(e: SerializedData) {
    return new KeyboardEvent(e.type, e);
  }
}

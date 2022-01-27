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

type SerializedData = {
  name: string;
  message: string;
  fileName: string;
  lineNumber: string;
  stack: string | undefined;
};

export class ErrorSerializer extends SerializerBase<Error, SerializedData> {
  get classToSerialize() {
    return Error;
  }

  serialize(
    e: Error & {fileName?: string; lineNumber?: string}
  ): SerializedData {
    return {
      name: e.name,
      message: e.message,
      fileName: e.fileName || '',
      lineNumber: e.lineNumber || '',
      stack: e.stack,
    };
  }

  deserialize(e: SerializedData) {
    let error: Error & {newStack?: string; orignalStack?: string};
    switch (e.name) {
      case 'EvalError':
      case 'InternalError':
      case 'RangeError':
      case 'ReferenceError':
      case 'SyntaxError':
      case 'TypeError':
      case 'URIError':
      case 'Error':
        error = new (window[e.name as keyof Window] as unknown as new (
          message: string,
          fileName: string,
          lineNumber: string
        ) => Error)(e.message, e.fileName, e.lineNumber);
        break;
      default:
        error = new Error(e.message);
        break;
    }
    error.newStack = error.stack;
    error.orignalStack = e.stack;
    error.stack = e.stack;
    return error;
  }
}

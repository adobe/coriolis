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
 * @module Module
 */

import {ModuleBase} from '../ModuleBase';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type QueryFunction<Parameters extends Array<any> = Array<any>, Return = any> = (
  ...data: Parameters
) => Promise<Return>;

export class QueryModule extends ModuleBase {
  private _query = new Map<string, QueryFunction>();
  protected _seqId = 0;
  private _catchUnregisterCall: QueryFunction | false = false;

  constructor(baseArgs: ConstructorParameters<typeof ModuleBase>[0]) {
    super(baseArgs);

    this._attachToChannel();

    this.register('__getQueryList', () =>
      Promise.resolve([...this._query.keys()]),
    );
  }

  register(name: string, callback: QueryFunction) {
    this._query.set(name, callback);
  }

  remove(name: string) {
    this._query.delete(name);
  }

  isAvailable(name: string) {
    return this.call('__getQueryList').then(d =>
      Promise.resolve((d as string[]).includes(name)),
    );
  }

  isRegistered(name: string) {
    return this._query.has(name);
  }

  setCatchUnregisterCall(callback: QueryFunction) {
    this._catchUnregisterCall = callback;
  }

  call<T1 extends QueryFunction>(
    queryName: string,
    ...data: Parameters<T1>
  ): Promise<Awaited<ReturnType<T1>>> {
    this._seqId++;
    if (this._seqId === Number.MAX_VALUE) {
      this._seqId = Number.MIN_VALUE;
    }

    const callback = `<= query-${queryName}-${this._seqId}`;

    return new Promise((resolve, reject) => {
      this._postMessage.socketOnce(callback, d => {
        if (d.resolve) {
          resolve(d.data);
        } else {
          if (!(d.error instanceof Error)) {
            // If the Error serializer is not loaded, create an Error object.
            if (d.errorType === 'TypeError') {
              d.error = new TypeError(d.error);
            } else {
              d.error = new window.Error(d.error);
            }
          }
          reject(d.error);
        }
      });
      this._postMessage.socketSend('=> query', {
        callback,
        name: queryName,
        data: data,
      });
    });
  }

  private _attachToChannel() {
    this._postMessage.socketOn('=> query', d => {
      const queryName = d.name;

      let method = this._query.get(queryName);
      if (!method && this._catchUnregisterCall) {
        method = this._catchUnregisterCall.bind(null, queryName);
      }
      if (method) {
        const res = method(...d.data);
        if (!res || !res.then) {
          this._postMessage.socketSend(d.callback, {
            error: `Query "${queryName}" doesn't return a Promise.`,
            errorType: 'Error',
            resolve: false,
          });
          console.error(`Query "${queryName}" doesn't return a Promise.`);
          return;
        } else {
          res
            .then((result: unknown) => {
              this._postMessage.socketSend(d.callback, {
                data: result,
                resolve: true,
              });
            })
            .catch((error: Error) => {
              this._postMessage.socketSend(d.callback, {
                error,
                errorType: error.name || 'Error',
                resolve: false,
              });
            });
        }
      } else {
        this._postMessage.socketSend(d.callback, {
          error: `Query "${queryName}" not registered.`,
          errorType: 'TypeError',
          resolve: false,
        });
      }
    });
  }
}

/*
 * Copyright 2018 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

const testsContext = require.context('.', false, /\d_/);
testsContext.keys().forEach(testsContext);

// For testing global object pollution doesn't make a mess
beforeEach(done => {
  // eslint-disable-next-line no-extend-native
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  Object.prototype.poluate = true;
  done();
});

// For testing global object pollution doesn't make a mess
afterEach(done => {
  // eslint-disable-next-line no-extend-native
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  delete Object.prototype.poluate;
  done();
});

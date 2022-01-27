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
const a = 40 + 2;
console.log(a);

const coriolis = window.coriolis;
coriolis.plugin.register({
  pluginA: class {
    getAnswer() {
      return 'toto';
    }
  },
  pluginB: class {
    constructor(coriolis) {
      this.coriolis = coriolis;
    }
    getAnswer() {
      console.dir(this.coriolis);
      return this.coriolis.plugin.get('pluginA').getAnswer();
    }
  },
});

console.log('0', coriolis.plugin.get('pluginB'));
console.log('1', coriolis.plugin.get('pluginB').getAnswer());
console.log('2', coriolis.plugin.get('pluginA').getAnswer());

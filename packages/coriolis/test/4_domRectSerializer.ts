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
import {DomRectSerializer} from '../src/serializer/DomRectSerializer';

describe('test DomRectSerializer class', () => {
  it('Check all is correctly implemented', done => {
    const s = new DomRectSerializer();
    assert.instanceOf(s.classToSerialize, Object);
    assert.typeOf(s.serialize, 'function');
    assert.typeOf(s.deserialize, 'function');

    done();
  });

  it('Check serialize and deserialize data', done => {
    // Create frame for play
    const iframe1 = window.document.createElement('iframe');
    const iframe2 = window.document.createElement('iframe');
    window.document.body.appendChild(iframe1);
    iframe1.contentDocument!.body.appendChild(iframe2);

    // shortcuts
    const iframe1Html = iframe1.contentDocument!.querySelector('html')!;
    const iframe2Html = iframe2.contentDocument!.querySelector('html')!;

    // shortcuts
    const iframe1Body = iframe1.contentDocument!.body;
    const iframe2Body = iframe2.contentDocument!.body;

    // Try to mess up the results
    iframe1Html.style.margin = '11px';
    iframe1Body.style.margin = '16px';
    iframe1Html.style.padding = '22px';
    iframe1Body.style.padding = '27px';
    iframe1Html.style.border = '33px dotted transparent';
    iframe1Body.style.border = '38px dotted transparent';
    iframe1Body.style.position = 'relative';

    // Try to mess up the results
    iframe2Html.style.margin = '44px';
    iframe2Body.style.margin = '49px';
    iframe2Html.style.padding = '55px';
    iframe2Body.style.padding = '58px';
    iframe2Html.style.border = '66px dotted transparent';
    iframe2Body.style.border = '69px dotted transparent';
    iframe2Body.style.position = 'relative';
    iframe2.width = '900px';
    iframe2.height = '900px';
    iframe2.style.border = '10px dashed grey';

    // Init serializers
    const s1 = new DomRectSerializer(iframe2, iframe1Body);
    const s2 = new DomRectSerializer(false, iframe2Body);

    // If we can create a div, transfert twice the DomRect, recreate a new div and have same position, it's a WIN

    // create the div
    const div1 = document.createElement('div');
    Object.assign(div1.style, {
      position: 'absolute',
      left: '88px',
      top: '99px',
      width: '10px',
      height: '10px',
      backgroundColor: 'green',
    });
    iframe1Body.insertBefore(div1, iframe1Body.firstChild);

    // transfert it
    const d1 = div1.getBoundingClientRect();

    // Test if the first box is placed as expected.
    // If this fails, we need to update all coordonate after a manuel test and inspection.
    assert.deepEqual(d1.x, 208);
    assert.deepEqual(d1.y, 219);

    const r1 = s2.deserialize(s1.serialize(d1));

    // create a second div
    const div2 = document.createElement('div');
    Object.assign(div2.style, {
      position: 'absolute',
      left: r1.left + 'px',
      top: r1.top + 'px',
      width: r1.width + 'px',
      height: r1.height + 'px',
      backgroundColor: 'blue',
    });
    iframe2Body.insertBefore(div2, iframe2Body.firstChild);

    const d2 = div2.getBoundingClientRect(); // - 126px

    // If this fails, we need to update the coordonate after a manuel test and inspection.
    assert.deepEqual(d2.x, 51);
    assert.deepEqual(d2.y, 62);

    // transfert it back
    const r2 = s1.deserialize(s2.serialize(d2));

    // create a thirs div
    const div3 = document.createElement('div');
    Object.assign(div3.style, {
      position: 'absolute',
      left: r2.left + 'px',
      top: r2.top + 'px',
      width: r2.width + 'px',
      height: r2.height + 'px',
      backgroundColor: 'red',
    });
    iframe1Body.insertBefore(div3, iframe1Body.firstChild);

    // Now test if it's a win
    const d3 = div3.getBoundingClientRect(); // - 27px

    assert.deepEqual(d3, d1);

    // creanup the dom
    iframe2.parentNode?.removeChild(iframe2);
    iframe1.parentNode?.removeChild(iframe1);

    done();
  });
});

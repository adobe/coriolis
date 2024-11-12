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
import {MouseEventSerializer} from '../src/serializer/MouseEventSerializer';

describe('test MouseEventSerializer class', () => {
  it('Check all is correctly implemented', done => {
    const s = new MouseEventSerializer();
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
    const s1 = new MouseEventSerializer(iframe2);
    const s2 = new MouseEventSerializer();

    const d = new MouseEvent('mousemove', {
      buttons: 3,
      ctrlKey: true,
      metaKey: true,
      clientX: 10,
      clientY: 42,
    });

    const r = s1.deserialize(s2.serialize(d));
    assert.instanceOf(r, MouseEvent);
    assert.equal(r.buttons, d.buttons);
    assert.equal(r.button, d.button);
    assert.equal(r.ctrlKey, d.ctrlKey);
    assert.equal(r.metaKey, d.metaKey);
    assert.equal(r.type, d.type);
    assert.equal(r.altKey, d.altKey);

    assert.equal(r.clientX, 167);
    assert.equal(r.clientY, 199);

    // transfert it back
    const r2 = s2.deserialize(s1.serialize(r));

    assert.instanceOf(r2, MouseEvent);
    assert.equal(r2.buttons, d.buttons);
    assert.equal(r2.button, d.button);
    assert.equal(r2.ctrlKey, d.ctrlKey);
    assert.equal(r2.metaKey, d.metaKey);
    assert.equal(r2.type, d.type);
    assert.equal(r2.altKey, d.altKey);

    assert.equal(r2.clientX, 10);
    assert.equal(r2.clientY, 42);

    // creanup the dom
    iframe2.parentNode?.removeChild(iframe2);
    iframe1.parentNode?.removeChild(iframe1);

    done();
  });
});

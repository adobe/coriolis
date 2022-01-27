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
import sinon from 'sinon';
import {ContentModule as ContentModuleOriginal} from '../src/module/ContentModule';
import {EventModule} from '../src/module/EventModule';
import {QueryModule} from '../src/module/QueryModule';
import {ModuleBaseConstructable} from '../src/ModuleBase';

import Util from './0_util';

class ContentModule extends ContentModuleOriginal {
  public _childExecuteScriptTags;
  public _childGetCss;
  public _childSetCss;
}

const depsModules: Parameters<typeof Util.createModuleBaseArg>[1] = new Map<
  string,
  ModuleBaseConstructable
>([
  ['query', QueryModule],
  ['event', EventModule],
]);

describe('test contentDecorator class', () => {
  const context: {
    iframe?: HTMLIFrameElement;
    stubQuery?: typeof document.querySelectorAll & {restore: Function};
    stubCreate?: typeof document.createElement & {restore: Function};
    stubAppendChild?: typeof document.appendChild & {restore: Function};
  } = {};

  beforeEach(done => {
    context.iframe = window.document.createElement('iframe');
    context.iframe.style.display = 'none';
    window.document.body.appendChild(context.iframe);

    context.stubQuery = sinon
      .stub(document, 'querySelectorAll')
      .callsFake(arg => context.iframe.contentDocument.querySelectorAll(arg));
    context.stubCreate = sinon
      .stub(document, 'createElement')
      .callsFake(arg => context.iframe.contentDocument.createElement(arg));
    context.stubAppendChild = sinon
      .stub(document.head, 'appendChild')
      .callsFake(arg => context.iframe.contentDocument.head.appendChild(arg));
    done();
  });

  afterEach(done => {
    context.stubQuery.restore();
    context.stubCreate.restore();
    context.stubAppendChild.restore();

    context.iframe.parentNode.removeChild(context.iframe);
    context.iframe = null;
    delete context.iframe;
    done();
  });

  it('check public api.', done => {
    // create postMessageChannel mock
    const [pmc1] = Util.createMockPostMessageChannel();

    // decorate our class with the queryDecorator
    const obj = new ContentModule(Util.createModuleBaseArg(pmc1, depsModules));

    // check this correctly decorate our Base class and enhance the API
    assert.typeOf(obj.getHtml, 'function');
    assert.typeOf(obj.replaceHtml, 'function');
    assert.typeOf(obj.loadScript, 'function');
    done();
  });

  it('check _childGetCss.', done => {
    // create postMessageChannel mock
    const [, pmc1] = Util.createMockPostMessageChannel();

    // decorate our class with the queryDecorator
    const obj1 = new ContentModule(Util.createModuleBaseArg(pmc1, depsModules));

    context.iframe.src = '/fixture/contentDecoratorCssTestData.html';
    context.iframe.addEventListener('load', () => {
      const confCss = obj1._childGetCss();

      assert.deepEqual(confCss, [
        {
          href: 'http://localhost:9876/fixture/empty.css?url1',
          attributes: new Map([['type', 'text/css']]),
        },
        {
          href: 'http://localhost:9876/fixture/empty.css?url2',
          attributes: new Map([
            ['attr2', 'value2'],
            ['data-attr2', 'data-value2'],
            ['prop2', ''],
            ['type', 'text/css'],
          ]),
        },
        {
          content: '.style1{}',
          attributes: new Map([['type', 'text/css']]),
        },
        {
          href: 'http://localhost:9876/fixture/empty.css?url3',
          attributes: new Map([
            ['attr3', 'value3'],
            ['data-attr3', 'data-value3'],
            ['prop3', ''],
            ['type', 'text/css'],
          ]),
        },
        {
          content: '.style4{}',
          attributes: new Map([
            ['attr4', 'value4'],
            ['data-attr4', 'data-value4'],
            ['prop4', ''],
            ['type', 'text/css'],
          ]),
        },
      ]);

      done();
    });
  });

  it('check _childSetCss.', done => {
    // create postMessageChannel mock
    const [, pmc1] = Util.createMockPostMessageChannel();

    // decorate our class with the queryDecorator
    const obj1 = new ContentModule(Util.createModuleBaseArg(pmc1, depsModules));

    const conf = [
      {
        href: 'http://localhost:9876/fixture/empty.css?url1',
        attributes: new Map([['type', 'text/css']]),
      },
      {
        href: 'http://localhost:9876/fixture/empty.css?url2',
        attributes: new Map([
          ['attr2', 'value2'],
          ['data-attr2', 'data-value2'],
          ['prop2', ''],
          ['type', 'text/css'],
        ]),
      },
      {
        href: 'http://localhost:9876/fixture/empty.css?url3',
        attributes: new Map([
          ['attr3', 'value3'],
          ['data-attr3', 'data-value3'],
          ['prop3', ''],
          ['type', 'text/css'],
        ]),
      },
      {
        content: '.style1{}',
        attributes: new Map([['type', 'text/css']]),
      },
      {
        content: '.style4{}',
        attributes: new Map([
          ['attr4', 'value4'],
          ['data-attr4', 'data-value4'],
          ['prop4', ''],
          ['type', 'text/css'],
        ]),
      },
    ];

    const style = context.iframe.contentDocument.createElement('style');
    style.setAttribute('importInit', 'true');
    context.iframe.contentDocument.head.appendChild(style);

    const link = context.iframe.contentDocument.createElement('link');
    link.setAttribute('rel', 'stylesheet');
    link.setAttribute('importInit', 'true');
    context.iframe.contentDocument.body.appendChild(link);

    obj1._childSetCss(conf);

    const html = `<html>
      <head>
        <link rel="stylesheet" href="http://localhost:9876/fixture/empty.css?url1" importinit="true" type="text/css">
        <link rel="stylesheet" href="http://localhost:9876/fixture/empty.css?url2" importinit="true" attr2="value2" data-attr2="data-value2" prop2="" type="text/css">
        <link rel="stylesheet" href="http://localhost:9876/fixture/empty.css?url3" importinit="true" attr3="value3" data-attr3="data-value3" prop3="" type="text/css">
        <style importinit="true" type="text/css">.style1{}</style>
        <style importinit="true" attr4="value4" data-attr4="data-value4" prop4="" type="text/css">.style4{}</style>
      </head>
      <body>
      </body>
    </html>`.replace(/\n\s+/gm, '');
    assert.deepEqual(
      context.iframe.contentDocument.documentElement.outerHTML,
      html
    );

    done();
  });

  it('check _childExecuteScriptTags.', done => {
    // create postMessageChannel mock
    const [, pmc1] = Util.createMockPostMessageChannel();

    // decorate our class with the queryDecorator
    const obj1 = new ContentModule(Util.createModuleBaseArg(pmc1, depsModules));

    const token = `_nb-${Math.floor(Math.random() * 100000)}`;
    global[token] = 0;
    context.iframe.contentDocument.documentElement.innerHTML = `<script attr="test" 1273-invalid-attr style="color: green" data-test="toto" prop>window.parent['${token}']++;</script>`;

    obj1._childExecuteScriptTags();

    assert.deepEqual(global[token], 1);

    global[token] = null;
    delete global[token];

    done();
  });

  it("check _childExecuteScriptTags doesn't crash with bad attributes.", done => {
    // create postMessageChannel mock
    const [, pmc1] = Util.createMockPostMessageChannel();

    // decorate our class with the queryDecorator
    const obj1 = new ContentModule(Util.createModuleBaseArg(pmc1, depsModules));

    const token = `_nb-${Math.floor(Math.random() * 100000)}`;
    global[token] = 0;
    context.iframe.contentDocument.documentElement.innerHTML = `<script 1273-invalid-attr >window.parent['${token}']++;</script>`;

    obj1._childExecuteScriptTags();

    assert.deepEqual(global[token], 1);

    global[token] = null;
    delete global[token];

    done();
  });
});

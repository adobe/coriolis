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
import {QueryModule} from './QueryModule';
import {EventModule} from './EventModule';

type DataCss = Array<{
  content?: string | null;
  href?: string;
  attributes: Map<string, string>;
}>;

export type ContentModuleConfig = {
  initialContent?: string;
  keepInitialCss?: boolean;
  initialCssAttribute?: string;
  executeScriptTags?: boolean;
  handleReconnect?: boolean | 'auto';
};

export class ContentModule extends ModuleBase {
  private _savedUnloadHtml: false | string = false;

  private _keepInitialCss = true;
  private _initialCssAttribute = 'importInit';
  private _executeScriptTags = true; // TODO: check with ie double execute
  private _handleReconnect: ContentModuleConfig['handleReconnect'] = false;

  constructor(
    baseArgs: ConstructorParameters<typeof ModuleBase>[0],
    conf: ContentModuleConfig = {}
  ) {
    super(baseArgs);

    if (this._postMessage.isParentFrame) {
      this._parentAttachToChannel();

      this._keepInitialCss = conf.keepInitialCss ?? true;
      this._initialCssAttribute = conf.initialCssAttribute || 'importInit';
      this._executeScriptTags = conf.executeScriptTags ?? true; // TODO: check with ie double execute
      this._handleReconnect = conf.handleReconnect ?? 'auto';
      this._savedUnloadHtml = conf.initialContent || false;
      if (conf.initialContent && this._handleReconnect === 'auto') {
        this._handleReconnect = true;
      }

      this._postMessage.on('connected', () => this._onChildConnection());
      this._postMessage.on('reconnected', () => this._onChildConnection());
    } else {
      this._childAttachToChannel();

      window.addEventListener('beforeunload', () => {
        const html = this._contentGetHtml();
        this._postMessage.socketSend('_beforeunload', {html: html});
      });
    }

    this._moduleLoader.require('query');
    this._moduleLoader.require('event');
  }

  private _onChildConnection() {
    this._postMessage.parentFrameCheck();

    if (this._savedUnloadHtml && this._handleReconnect === true) {
      this._postMessage.socketSend('_initialContent', {
        html: this._savedUnloadHtml,
        keepInitialCss: this._keepInitialCss,
        initialCssAttribute: this._initialCssAttribute,
        executeScriptTags: this._executeScriptTags,
      });
    }
  }

  private get _query() {
    return this._moduleLoader.get('query') as QueryModule;
  }

  private get _event() {
    return this._moduleLoader.get('event') as EventModule;
  }

  loadScript(url: string) {
    this._postMessage.parentFrameCheck();

    return this._query.call('_contentLoadScript', url) as Promise<void>;
  }

  replaceHtml(html: string, {keepCss = true, executeScriptTags = true} = {}) {
    this._postMessage.parentFrameCheck();

    if (this._handleReconnect === 'auto') {
      this._handleReconnect = true;
    }

    return this._query.call(
      '_contentReplaceHtml',
      html,
      keepCss,
      executeScriptTags
    ) as Promise<void>;
  }

  getHtml(): Promise<string> {
    this._postMessage.parentFrameCheck();

    return this._query.call('_contentGetHtml').then(data => data as string);
  }

  private _parentAttachToChannel() {
    this._postMessage.parentFrameCheck();

    this._postMessage.socketOn('_beforeunload', (data: {html: string}) => {
      this._savedUnloadHtml = data.html;
    });
  }

  private _childAttachToChannel() {
    this._postMessage.childFrameCheck();

    this._postMessage.socketOnce(
      '_initialContent',
      (d: {
        html: string;
        keepInitialCss: boolean;
        initialCssAttribute: string;
        executeScriptTags: boolean;
      }) => {
        this._keepInitialCss = d.keepInitialCss;
        this._initialCssAttribute = d.initialCssAttribute;
        this._executeScriptTags = d.executeScriptTags;

        if (this._keepInitialCss) {
          const configs = this._childGetCss();
          this._childSetHtml(d.html);
          this._childSetCss(configs);
        } else {
          this._childSetHtml(d.html);
        }

        if (this._executeScriptTags) {
          this._childExecuteScriptTags();
        }

        this._event.emit('initialContentLoaded');
      }
    );

    this._query.register(
      '_contentReplaceHtml',
      (html: string, keepCss: boolean, executeScriptTags: boolean) => {
        if (keepCss) {
          const configs = this._childGetCss();
          this._childSetHtml(html);
          this._childSetCss(configs);
        } else {
          this._childSetHtml(html);
        }

        if (executeScriptTags) {
          this._childExecuteScriptTags();
        }

        this._event.emit('contentReplaceHtml');
        return Promise.resolve();
      }
    );

    this._query.register('_contentGetHtml', () => {
      return Promise.resolve(this._contentGetHtml());
    });

    this._query.register('_contentLoadScript', (url: string) => {
      return new Promise<void>(resolve => {
        const el = document.createElement('script');
        el.type = 'text/javascript';
        el.async = true;
        el.src = url;
        document.head.appendChild(el);
        el.addEventListener('load', () => {
          if (el.parentNode) {
            el.parentNode.removeChild(el);
          }
          resolve();
        });
      });
    });
  }

  private _contentGetHtml() {
    this._postMessage.childFrameCheck();

    // TODO: allow callback cleaner fonction and so on

    let html = document.documentElement.outerHTML;
    // extract <style> but take into account that </style> can apear inside background-image data-uri svg property
    const regex =
      /(<style.*?>)((?:(?:'[^']*')|(?:"[^"]*")|(?:[^'"]))*?)(<\/style>)/gim;
    html = html.replace(regex, (all, prev, inside, close) => {
      inside = inside.replace(/<\//gi, '<\\/'); // replace </style by <\/style inside the style element
      return prev + inside + close;
    });

    // Generate a doctype
    if (document.doctype) {
      const publicId = document.doctype.publicId
        ? ` PUBLIC "${document.doctype.publicId}"`
        : '';
      const systemId = document.doctype.systemId
        ? ` "${document.doctype.systemId}"`
        : '';
      const doctype = `<!doctype ${document.doctype.name}${publicId}${systemId}>`;

      return doctype + '\n' + html;
    } else {
      return '<!doctype html>\n' + html;
    }
  }

  private _childSetHtml(html: string) {
    this._postMessage.childFrameCheck();

    const parser = new DOMParser();
    const parsedDOM = parser.parseFromString(html, 'text/html');

    if (parsedDOM.doctype) {
      const parsedDt = parsedDOM.doctype;
      const dt = document.implementation.createDocumentType(
        parsedDt.name,
        parsedDt.publicId,
        parsedDt.systemId
      );
      if (document.doctype) {
        document.replaceChild(dt, document.doctype);
      }
    }

    document.replaceChild(parsedDOM.documentElement, document.documentElement);
  }

  protected _childGetCss(): DataCss {
    this._postMessage.childFrameCheck();

    const elements = document.querySelectorAll('style, link[rel=stylesheet]');
    const css = [];

    for (const el of elements) {
      const attributes = new Map<string, string>();

      for (const attr of el.attributes) {
        attributes.set(attr.name, attr.value);
      }

      if (el.tagName.toUpperCase() === 'STYLE') {
        css.push({
          content: el.textContent,
          attributes,
        });
      } else {
        attributes.delete('href');
        attributes.delete('rel');
        css.push({
          href: (el as HTMLLinkElement).href,
          attributes,
        });
      }
    }
    return css;
  }

  protected _childSetCss(configs: DataCss) {
    this._postMessage.childFrameCheck();

    const attrCssExpr = `[${this._initialCssAttribute}=true]`;
    const coriolisElements = document.querySelectorAll(
      `style${attrCssExpr}, link[rel=stylesheet]${attrCssExpr}`
    );
    for (const el of coriolisElements) {
      el.remove();
    }

    for (const item of configs) {
      let newEl;

      if (item.href) {
        newEl = document.createElement('link');
        newEl.setAttribute('rel', 'stylesheet');
        newEl.href = item.href;
      } else {
        newEl = document.createElement('style');
        newEl.textContent = item.content || '';
      }

      newEl.setAttribute(this._initialCssAttribute, 'true');

      for (const [name, value] of item.attributes) {
        try {
          newEl.setAttribute(name, value);
          // eslint-disable-next-line no-empty
        } catch (e) {}
      }

      document.head.appendChild(newEl);
    }
  }

  protected _childExecuteScriptTags() {
    this._postMessage.childFrameCheck();

    const els = document.querySelectorAll('script');
    for (const el of els) {
      const script = document.createElement('script');
      for (const attr of el.attributes) {
        try {
          script.setAttribute(attr.name, attr.value);
          // eslint-disable-next-line no-empty
        } catch (e) {}
      }
      script.textContent = el.textContent;
      if (el.parentNode) {
        el.parentNode.insertBefore(script, el);
        el.parentNode.removeChild(el);
      }
    }
  }
}

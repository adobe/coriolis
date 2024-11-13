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
 * @module Coriolis
 */

import EventEmitter from 'eventemitter3';

type DataSerializer = {
  parse: (serializeString: string) => unknown;
  stringify: (object: unknown) => string;
};

/**
 * PostMessageChannel class.
 * This is an class which warp postMessage communication and allow to work with it with higher API.
 * This have dataSerializer feature, auto-connect feature (with defer), ensure url of the target (security),
 * send (with wait connect), listener on messages, and events for lisfecycle of postmessageChannel status
 */
export class PostMessageChannel extends EventEmitter<
  'connected' | 'reconnected' | 'disconnected'
> {
  /**
   * The socket used to directly send PostMessage
   * @type {Window}
   */
  private _socket: Window | false = false;

  /**
   * The domElement which contains socket to send PostMessage (in contentWindow)
   * @type {HTMLIFrameElement}
   */
  private _domElement: HTMLIFrameElement | false = false;

  /**
   * The allowed URL for PostMessage communication
   * @type {URL}
   */
  readonly url: URL;

  /**
   * The dataserializer to use for parse and stringify object into PostMessage
   * @type {Object}
   * @property {parse}      function    used to unserialize data
   * @property {stringify}  function    used to serialize data
   */
  readonly dataSerializer: DataSerializer;

  /**
   * Channel where everything will be broadcast
   * @type {EventEmitter}
   */
  protected _channelListener = new EventEmitter();

  /**
   * Flag to know if we have a reconnect without a disconnect
   * @type {Boolean}
   */
  private _previouslyConnected = false;

  /**
   * Private property to save the message eventListener function
   * @type {function}
   */
  private _listenerReference: ((e: MessageEvent) => void) | false = false;

  /**
   * Private property to save the statuts of the PostMessage communication.
   * @type {Boolean}
   */
  private _isConnected = false;

  /**
   * Constructor of PostMessageChannel
   * @param  {HTMLIFrameElement|Window|'defer'}   target                    Target of the PostMessageChannel
   * @param  {URL|string}                         targetUrl                 Url allowed to communicate
   * @param  {Object}                             [options.dataSerializer]  Object used to serialized and deserialized (need parse and stringify methods)
   * @param  {Boolean}                            [options.autoConnect]     If we try or not to connect autoatically when instance is created
   */
  constructor(
    target: HTMLIFrameElement | Window | 'defer',
    targetUrl: URL | string,
    {
      dataSerializer = window.JSON,
      autoConnect = true,
    }: {dataSerializer?: DataSerializer; autoConnect?: boolean} = {},
  ) {
    super();

    this.dataSerializer = dataSerializer;

    // Set the target into correct property
    if (target === 'defer') {
      autoConnect = false;
    } else if (target instanceof HTMLIFrameElement) {
      this._domElement = target;
    } else if (target && typeof target.postMessage === 'function') {
      this._socket = target;
    } else {
      throw new TypeError(
        'Excepted to have a Window or HTMLIFrameElement object.',
      );
    }

    // Set correctly targetUrl
    if (targetUrl instanceof URL) {
      this.url = targetUrl;
    } else {
      try {
        this.url = new URL(targetUrl);
      } catch (e) {
        console.error(`Can't create an URL object with ${targetUrl}`);
        throw e;
      }
    }

    // Add the eventListener by default
    this.addListeners();
    // attach the different callback for handle connection messages and try to auto-connect if asked
    this._initializeSocket(autoConnect);

    // make sure the isConnected property is synced with connected, reconnected and disconnected events
    // reconnect is only when we have a non clean reconnect (without a disconnect)
    this.on('connected', () => (this._isConnected = true));
    this.on('reconnected', () => (this._isConnected = true));
    this.on('disconnected', () => (this._isConnected = false));
  }

  /**
   * Boolean which expose the statuts of the PostMessage communication.
   * @return {Boolean}
   */
  get isConnected() {
    return this._isConnected;
  }

  /**
   * Boolean which expose if it's the parent frame.
   * @return {Boolean}
   */
  get isParentFrame() {
    return !this._socket || this._socket !== window.parent;
  }

  /**
   * Boolean which expose if it's the child frame (iframe).
   * @return {Boolean}
   */
  get isChildFrame() {
    return !!this._socket && this._socket === window.parent;
  }

  /**
   * Simple check with throw an Error if you are not in a child Frame
   * @return {void}
   */
  childFrameCheck() {
    if (!this.isChildFrame) {
      throw new Error('This function should be called only in a child frame.');
    }
  }

  /**
   * Simple check with throw an Error if you are not in a parent Frame
   * @return {void}
   */
  parentFrameCheck() {
    if (!this.isParentFrame) {
      throw new Error('This function should be called only in a parent frame.');
    }
  }

  setTarget(target: HTMLIFrameElement | Window | 'defer') {
    if (this.isConnected) {
      throw new Error('Can not change target when connected.');
    }

    if (target === 'defer') {
      this._socket = false;
      this._domElement = false;
    } else if (target instanceof HTMLIFrameElement) {
      this._domElement = target;
      this._socket = false;
    } else if (target && typeof target.postMessage === 'function') {
      this._socket = target;
      this._domElement = false;
    } else {
      throw new TypeError(
        'Excepted to have a Window or HTMLIFrameElement object.',
      );
    }
  }

  get domElement() {
    return this._domElement;
  }

  /**
   * Try to connect to postMessageChannel
   * @return {boolean} return false if we are already connected or true if the request is handled
   */
  connect() {
    if (!this._domElement && !this._socket) {
      throw new Error('Set a target before connect.');
    }

    if (!this._listenerReference) {
      this.addListeners();
    }
    if (this._isConnected) {
      return false;
    } else {
      if (
        this._domElement &&
        this._domElement.getAttribute('defer') === 'true'
      ) {
        const domElement = this._domElement;
        domElement.addEventListener('load', () => {
          domElement.setAttribute('defer', '');
          this.socketSend('_socket:SYN', {version: this.version}, false);
        });
      } else {
        this.socketSend('_socket:SYN', {version: this.version}, false);
      }
      return true;
    }
  }

  /**
   * Disconnect to the postMessageChannel
   * @return {boolean} return false if we are already disconnected or true if the request is handled
   */
  disconnect() {
    if (!this._isConnected) {
      return false;
    }
    this.socketSend('_socket:FIN', {api: true, unload: false}, false);
    this.emit('disconnected');
    this._previouslyConnected = false;
    return true;
  }

  /**
   * Register the callbacks for handle connection of postMessageChannel and auto-connect if asked.
   * @param  {Boolean} [autoConnect] If we need to auto-connect or not
   * @return {void}
   */
  private _initializeSocket(autoConnect: boolean) {
    // Take a look to TCP flags
    //  SYN = ask new connection
    //  ACK = acknowledgement
    //  RST = reset
    //  FIN = fin

    if (autoConnect) {
      this.connect();
    }

    this.socketOn('_socket:SYN', data => {
      if (data.version !== this.version) {
        console.error(
          `Coriolis version mismatch, it's highly recommended to update. local version: ${this.version} remote version: ${data.version ?? 'unknown (probably < 2.1.0)'}`,
        );
      }
      if (!this._previouslyConnected) {
        this.socketSend('_socket:ACK', {}, false);
        this.emit('connected');
      } else {
        this.socketSend('_socket:RST', {}, false);
        this.emit('reconnected');
      }
      this._previouslyConnected = true;
    });
    this.socketOn('_socket:ACK', () => {
      this.emit('connected');
      this._previouslyConnected = true;
    });
    this.socketOn('_socket:RST', () => {
      this.emit('reconnected');
      this._previouslyConnected = true;
    });
    this.socketOn('_socket:FIN', data => {
      this.emit('disconnected');
      if (data.api) {
        this._previouslyConnected = false;
      }
    });
  }

  /**
   * Add the eventListener for postMessage
   * @return {void}
   */
  addListeners() {
    if (this._listenerReference) {
      return;
    }

    this._listenerReference = e => this._messageListenerCallback(e);
    window.addEventListener('message', this._listenerReference, false);

    window.addEventListener('beforeunload', () => {
      this.socketSend('_socket:FIN', {api: false, unload: true}, false);
    });
  }

  /**
   * Remove the eventListener for postMessage
   * @return {void}
   */
  removeListeners() {
    if (!this._listenerReference) {
      return;
    }
    window.removeEventListener('message', this._listenerReference, false);
    this._listenerReference = false;
  }

  private _messageListenerCallback(e: MessageEvent) {
    const socket =
      this._socket || (this._domElement && this._domElement.contentWindow);
    if (e.source !== socket) {
      return; // Message not for me!
    }
    if (e.origin !== this.url.origin) {
      throw new Error(
        `Security: Bad message origin: ${e.origin} != ${this.url.origin}`,
      );
    }
    if (!e.data || !e.data.eventName) {
      return; // other communication not handled by the lib
      // throw new TypeError('Excepted to have a object with an eventName property');
    }
    this._channelListener.emit(
      e.data.eventName,
      this.dataSerializer.parse(e.data.eventData),
      e,
    );
  }

  /**
   * Send a message into the postMessageChannel
   * @param  {string}  eventName          The identifier of the message
   * @param  {Object}  [data]             Associated data with the message
   * @param  {Boolean} [waitConnected]    If we delay communication and wait we are connected or not
   * @param  {Boolean} [skipDisconnected] If we skip that socketSend if the connection is not established
   * @return {void}
   */
  socketSend(
    eventName: string,
    data = {},
    waitConnected = true,
    skipDisconnected = false,
  ) {
    const cb = () => {
      const socket =
        this._socket || (this._domElement && this._domElement.contentWindow);
      socket &&
        socket.postMessage(
          {
            eventName,
            eventData: this.dataSerializer.stringify(data),
            sentAt: Date.now(),
          },
          this.url.origin,
        );
    };
    if (waitConnected && !this._isConnected) {
      this.once('connected', cb);
    } else if (!skipDisconnected || this._isConnected) {
      cb();
    }
  }

  /**
   * Register an eventemmiter listener on every socket messages
   * @see https://github.com/primus/eventemitter3/blob/master/index.js
   * @see https://nodejs.org/api/events.html#events_emitter_on_eventname_listener
   * @return {void}
   */
  socketOn(...args: Parameters<EventEmitter['on']>) {
    return this._channelListener.on(...args);
  }

  /**
   * Register an eventemmiter listener on one socket messages
   * @see https://github.com/primus/eventemitter3/blob/master/index.js
   * @see https://nodejs.org/api/events.html#events_emitter_on_eventname_listener
   * @return {void}
   */
  socketOnce(...args: Parameters<EventEmitter['once']>) {
    return this._channelListener.once(...args);
  }

  get version() {
    return 'v' + __CORIOLIS_VERSION__;
  }
}

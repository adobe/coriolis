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
import {PostMessageChannel as PostMessageChannelOriginal} from '../src/PostMessageChannel';
import {Coriolis} from '../src/index';

class PostMessageChannel extends PostMessageChannelOriginal {
  public _channelListener;
}

declare global {
  interface Window {
    coriolis: Coriolis;
    coriolis2: Coriolis;
    Coriolis: typeof Coriolis;
  }
}

describe('test PostMessageChannel class', () => {
  it('check public api.', done => {
    const iframe = document.createElement('iframe');
    const pmc = new PostMessageChannel(iframe, 'http://example.org/', {
      autoConnect: false,
    });

    // Low level socket function are available
    assert.typeOf(pmc.socketOn, 'function');
    assert.typeOf(pmc.socketOnce, 'function');
    assert.typeOf(pmc.socketSend, 'function');

    // listener function are available
    assert.typeOf(pmc.addListeners, 'function');
    assert.typeOf(pmc.removeListeners, 'function');

    // connect function are available
    assert.typeOf(pmc.connect, 'function');
    assert.typeOf(pmc.disconnect, 'function');
    assert.property(pmc, 'isConnected');

    // check frame side function are available
    assert.typeOf(pmc.childFrameCheck, 'function');
    assert.typeOf(pmc.parentFrameCheck, 'function');
    assert.property(pmc, 'isParentFrame');
    assert.property(pmc, 'isChildFrame');

    done();
  });

  describe('check different target option', () => {
    it('Check error when target is not correct', done => {
      assert.throws(() => {
        const div = document.createElement('div');
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        new PostMessageChannel(div, 'http://example.org/', {
          autoConnect: false,
        });
      });
      done();
    });

    it('Check with iframe target param', done => {
      const iframe = document.createElement('iframe');
      document.body.appendChild(iframe);
      const pmc = new PostMessageChannel(iframe, window.location.origin, {
        autoConnect: false,
      });

      const iframePostMessageSpy = sinon.spy(
        iframe.contentWindow,
        'postMessage'
      );
      pmc.socketSend('eventName', {}, false);
      assert.isTrue(iframePostMessageSpy.calledOnce);

      iframePostMessageSpy.restore();
      document.body.removeChild(iframe);
      done();
    });

    it('Check with parent frame param', done => {
      const pmc = new PostMessageChannel(
        window.parent,
        window.location.origin,
        {autoConnect: false}
      );

      const windowPostMessageSpy = sinon.spy(window.parent, 'postMessage');
      pmc.socketSend('eventName', {}, false);
      assert.isTrue(windowPostMessageSpy.calledOnce);

      windowPostMessageSpy.restore();
      done();
    });
  });

  describe('check different targetUrl option', () => {
    it('Check error when targetUrl is not correct', done => {
      const consoleErrorSpy = sinon.stub(window.console, 'error');
      assert.throws(() => {
        new PostMessageChannel(window.parent, '', {autoConnect: false});
      });
      assert.equal(consoleErrorSpy.callCount, 1);
      assert.throws(() => {
        new PostMessageChannel(window.parent, undefined, {autoConnect: false});
      });
      assert.equal(consoleErrorSpy.callCount, 2);
      assert.throws(() => {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        new PostMessageChannel(window.parent, Object, {autoConnect: false});
      });
      assert.equal(consoleErrorSpy.callCount, 3);
      assert.throws(() => {
        new PostMessageChannel(window.parent, 'toto/titi.html', {
          autoConnect: false,
        });
      });
      assert.equal(consoleErrorSpy.callCount, 4);
      consoleErrorSpy.restore();
      done();
    });

    it('Check with targetUrl has a string', done => {
      const pmc = new PostMessageChannel(
        window.parent,
        `${window.location.origin}/path?arg=value#hash`,
        {autoConnect: false}
      );

      const windowPostMessageSpy = sinon.spy(window.parent, 'postMessage');
      pmc.socketSend('eventName', {}, false);
      assert.isTrue(windowPostMessageSpy.calledOnce);
      assert.deepEqual(
        windowPostMessageSpy.firstCall.args[1],
        window.location.origin
      );

      windowPostMessageSpy.restore();
      done();
    });

    it('Check with targetUrl has an URL', done => {
      const url = new URL(`${window.location.origin}/path?arg=value#hash`);
      const pmc = new PostMessageChannel(window.parent, url, {
        autoConnect: false,
      });

      const windowPostMessageSpy = sinon.spy(window.parent, 'postMessage');
      pmc.socketSend('eventName', {}, false);
      assert.isTrue(windowPostMessageSpy.calledOnce);
      assert.deepEqual(
        windowPostMessageSpy.firstCall.args[1],
        window.location.origin
      );

      windowPostMessageSpy.restore();
      done();
    });
  });

  describe('check autoConnect option', () => {
    it('Check with autoConnect = false', done => {
      // Create a true iframe to have a correct origin
      const iframe = document.createElement('iframe');

      // Mock with the correct origin url
      const eventListenerSpy = sinon.spy(
        PostMessageChannel.prototype,
        'connect'
      );
      new PostMessageChannel(iframe, window.location as unknown as URL, {
        autoConnect: false,
      });

      // Check is registered
      assert.isFalse(eventListenerSpy.called);

      eventListenerSpy.restore();

      done();
    });

    it('Check with autoConnect = true', done => {
      // Create a true iframe to have a correct origin
      const iframe = document.createElement('iframe');
      iframe.setAttribute('src', '/fixture/empty.html');
      document.body.appendChild(iframe);

      // Mock with the correct origin url
      const eventListenerSpy = sinon.spy(
        PostMessageChannel.prototype,
        'connect'
      );
      new PostMessageChannel(iframe, window.location as unknown as URL, {
        autoConnect: true,
      });

      // Check is registered
      assert.isTrue(eventListenerSpy.calledOnce);

      eventListenerSpy.restore();
      document.body.removeChild(iframe);

      done();
    });

    it('Check with default autoConnect is true', done => {
      // Create a true iframe to have a correct origin
      const iframe = document.createElement('iframe');
      iframe.setAttribute('src', '/fixture/empty.html');
      document.body.appendChild(iframe);

      // Mock with the correct origin url
      const eventListenerSpy = sinon.spy(
        PostMessageChannel.prototype,
        'connect'
      );
      new PostMessageChannel(iframe, window.location as unknown as URL);

      // Check is registered
      assert.isTrue(eventListenerSpy.calledOnce);

      eventListenerSpy.restore();
      document.body.removeChild(iframe);

      done();
    });
  });

  describe('check frame side function', () => {
    it('check function result on parent side', done => {
      const iframe = document.createElement('iframe');
      const pmc = new PostMessageChannel(iframe, 'http://example.org/', {
        autoConnect: false,
      });

      assert.isTrue(pmc.isParentFrame);
      assert.isFalse(pmc.isChildFrame);
      assert.doesNotThrow(() => {
        pmc.parentFrameCheck();
      });

      assert.throws(() => {
        pmc.childFrameCheck();
      });

      done();
    });

    it('check function result on child side', done => {
      const pmc = new PostMessageChannel(window.parent, 'http://example.org/', {
        autoConnect: false,
      });

      assert.isFalse(pmc.isParentFrame);
      assert.isTrue(pmc.isChildFrame);
      assert.throws(() => {
        pmc.parentFrameCheck();
      });

      assert.doesNotThrow(() => {
        pmc.childFrameCheck();
      });

      pmc.removeListeners();
      done();
    });
  });

  describe('check register / unregister listener', () => {
    it('Check register listener by default', done => {
      // Create a true iframe to have a correct origin
      const iframe = document.createElement('iframe');
      iframe.setAttribute('src', '/fixture/empty.html');
      document.body.appendChild(iframe);

      // Mock with the correct origin url
      const eventListenerSpy = sinon.spy(global, 'addEventListener');
      const pmc = new PostMessageChannel(
        iframe,
        window.location as unknown as URL,
        {
          autoConnect: false,
        }
      );
      const listenerSpy = sinon.spy(pmc._channelListener, 'emit');

      // Check is registered
      assert.isTrue(eventListenerSpy.calledOnce);

      // And the registration works as expected
      window.dispatchEvent(
        new MessageEvent('message', {
          source: iframe.contentWindow,
          origin: window.location.origin,
          data: {
            eventName: 'myName',
            eventData: '{"toto": "tata"}',
          },
        })
      );
      assert.isTrue(listenerSpy.called);

      eventListenerSpy.restore();
      listenerSpy.restore();
      document.body.removeChild(iframe);

      done();
    });

    it('Check removeListeners works', done => {
      // Create a true iframe to have a correct origin
      const iframe = document.createElement('iframe');
      iframe.setAttribute('src', '/fixture/empty.html');
      document.body.appendChild(iframe);

      // Mock with the correct origin url
      const eventListenerSpy = sinon.spy(global, 'addEventListener');
      const pmc = new PostMessageChannel(
        iframe,
        window.location as unknown as URL,
        {
          autoConnect: false,
        }
      );
      const listenerSpy = sinon.spy(pmc._channelListener, 'emit');

      pmc.removeListeners();
      // check when we do it twice this doesn't generate errors
      pmc.removeListeners();

      // And the registration works as expected
      window.dispatchEvent(
        new MessageEvent('message', {
          source: iframe.contentWindow,
          origin: window.location.origin,
          data: {
            eventName: 'myName',
            eventData: '{"toto": "tata"}',
          },
        })
      );
      assert.isFalse(listenerSpy.called);

      eventListenerSpy.restore();
      listenerSpy.restore();
      document.body.removeChild(iframe);

      done();
    });

    it('Check addListeners works once', done => {
      // Create a true iframe to have a correct origin
      const iframe = document.createElement('iframe');
      iframe.setAttribute('src', '/fixture/empty.html');
      document.body.appendChild(iframe);

      // Mock with the correct origin url
      const eventListenerSpy = sinon.spy(global, 'addEventListener');
      const pmc = new PostMessageChannel(
        iframe,
        window.location as unknown as URL,
        {
          autoConnect: false,
        }
      );
      const listenerSpy = sinon.spy(pmc._channelListener, 'emit');

      pmc.removeListeners();
      pmc.addListeners();
      // check when we do it twice we doesn't register them twice
      pmc.addListeners();

      // And the registration works as expected
      window.dispatchEvent(
        new MessageEvent('message', {
          source: iframe.contentWindow,
          origin: window.location.origin,
          data: {
            eventName: 'myName',
            eventData: '{"toto": "tata"}',
          },
        })
      );
      assert.isTrue(listenerSpy.calledOnce);

      eventListenerSpy.restore();
      listenerSpy.restore();
      document.body.removeChild(iframe);

      done();
    });
  });

  describe('check callback listener', () => {
    it('Check we ignore messages from other frames', done => {
      // Create a true iframe to have a correct origin
      const iframe = document.createElement('iframe');
      iframe.setAttribute('src', '/fixture/empty.html');
      document.body.appendChild(iframe);

      // Second iframe to check multiple frames switch
      const iframe2 = document.createElement('iframe');
      iframe2.setAttribute('src', '/fixture/empty.html');
      document.body.appendChild(iframe2);

      // Mock with the correct origin url
      const pmc = new PostMessageChannel(
        iframe,
        window.location as unknown as URL,
        {
          autoConnect: false,
        }
      );
      const iframePostMessageSpy = sinon.spy(pmc._channelListener, 'emit');

      // Send a message but not for this frame
      window.dispatchEvent(
        new MessageEvent('message', {
          source: iframe2.contentWindow,
          origin: window.location.origin,
        })
      );
      assert.isFalse(iframePostMessageSpy.called);
      iframePostMessageSpy.restore();

      document.body.removeChild(iframe);
      document.body.removeChild(iframe2);

      done();
    });

    it('Check we have a security error when origin missmatch', done => {
      // Create a true iframe to have a correct origin
      const iframe = document.createElement('iframe');
      iframe.setAttribute('src', '/fixture/empty.html');
      document.body.appendChild(iframe);

      // Mock with the correct origin url
      const pmc = new PostMessageChannel(
        iframe,
        window.location as unknown as URL,
        {
          autoConnect: false,
        }
      );
      const iframePostMessageSpy = sinon.spy(pmc._channelListener, 'emit');

      // Send a message but with a bad origin
      assert.throws(() => {
        // Here I directly used the private method because we can't catch the throw on an other JS tick

        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        pmc._listenerAttached(
          new MessageEvent('message', {
            source: iframe.contentWindow,
            origin: 'http://perdu.com',
            data: 'toto',
          })
        );
      });

      assert.isFalse(iframePostMessageSpy.called);
      iframePostMessageSpy.restore();
      document.body.removeChild(iframe);
      done();
    });

    it('Check we ignore messages without coriolis format', done => {
      // Create a true iframe to have a correct origin
      const iframe = document.createElement('iframe');
      iframe.setAttribute('src', '/fixture/empty.html');
      document.body.appendChild(iframe);

      // Mock with the correct origin url
      const pmc = new PostMessageChannel(
        iframe,
        window.location as unknown as URL,
        {
          autoConnect: false,
        }
      );
      const iframePostMessageSpy = sinon.spy(pmc._channelListener, 'emit');

      // Send a message but not with coriolis format
      window.dispatchEvent(
        new MessageEvent('message', {
          source: iframe.contentWindow,
          origin: window.location.origin,
          data: 'toto',
        })
      );

      assert.isFalse(iframePostMessageSpy.called);
      iframePostMessageSpy.restore();

      document.body.removeChild(iframe);

      done();
    });

    it("Check we correctly send a event if it's a valid message", done => {
      // Create a true iframe to have a correct origin
      const iframe = document.createElement('iframe');
      iframe.setAttribute('src', '/fixture/empty.html');
      document.body.appendChild(iframe);

      // Mock with the correct origin url
      const pmc = new PostMessageChannel(
        iframe,
        window.location as unknown as URL,
        {
          autoConnect: false,
        }
      );
      const iframePostMessageSpy = sinon.spy(pmc._channelListener, 'emit');

      // Send a correct message :-)
      window.dispatchEvent(
        new MessageEvent('message', {
          source: iframe.contentWindow,
          origin: window.location.origin,
          data: {
            eventName: 'myName',
            eventData: '{"toto": "tata"}',
          },
        })
      );
      assert.isTrue(iframePostMessageSpy.calledOnce);
      iframePostMessageSpy.restore();

      document.body.removeChild(iframe);

      done();
    });
  });

  describe('check connect', () => {
    it('Check auto connect with defer', done => {
      // Create a true iframe to have a correct origin
      const iframe = document.createElement('iframe');
      iframe.setAttribute('src', '/fixture/coriolis.html');
      iframe.setAttribute('defer', 'true');
      document.body.appendChild(iframe);

      const pmc = new PostMessageChannel(
        iframe,
        window.location as unknown as URL,
        {
          autoConnect: true,
        }
      );
      assert.isFalse(pmc.isConnected);

      // Wait page load and Coriolis is ready
      pmc.on('connected', () => {
        assert.isTrue(pmc.isConnected);
        assert.isTrue(iframe.contentWindow.coriolis.isConnected);
        document.body.removeChild(iframe);
        done();
      });
    });

    it('Check auto connect without defer', done => {
      // Create a true iframe to have a correct origin
      const iframe = document.createElement('iframe');
      iframe.setAttribute('src', '/fixture/coriolis.html');
      document.body.appendChild(iframe);

      // Wait page load and Coriolis is ready
      iframe.addEventListener('load', () => {
        const pmc = new PostMessageChannel(
          iframe,
          window.location as unknown as URL,
          {
            autoConnect: true,
          }
        );
        assert.isFalse(pmc.isConnected);

        pmc.on('connected', () => {
          assert.isTrue(pmc.isConnected);
          assert.isTrue(iframe.contentWindow.coriolis.isConnected);
          document.body.removeChild(iframe);
          done();
        });
      });
    });

    it('Check normal connect method usage', done => {
      // Create a true iframe to have a correct origin
      const iframe = document.createElement('iframe');
      iframe.setAttribute('src', '/fixture/coriolis.html');
      document.body.appendChild(iframe);

      const pmc = new PostMessageChannel(
        iframe,
        window.location as unknown as URL,
        {
          autoConnect: false,
        }
      );
      assert.isFalse(pmc.isConnected);

      // Wait page load and Coriolis is ready
      iframe.addEventListener('load', () => {
        assert.isFalse(pmc.isConnected);

        assert.isTrue(pmc.connect());

        pmc.on('connected', () => {
          assert.isTrue(pmc.isConnected);
          assert.isTrue(iframe.contentWindow.coriolis.isConnected);
          document.body.removeChild(iframe);
          done();
        });
      });
    });

    it('Check remote connect method usage', done => {
      // Create a true iframe to have a correct origin
      const iframe = document.createElement('iframe');
      iframe.setAttribute('src', '/fixture/coriolis.html');
      document.body.appendChild(iframe);

      const pmc = new PostMessageChannel(
        iframe,
        window.location as unknown as URL,
        {
          autoConnect: false,
        }
      );
      assert.isFalse(pmc.isConnected);

      // Wait page load and Coriolis is ready
      iframe.addEventListener('load', () => {
        assert.isFalse(pmc.isConnected);

        assert.isTrue(iframe.contentWindow.coriolis.connect());

        iframe.contentWindow.coriolis.on('connected', () => {
          assert.isTrue(pmc.isConnected);
          assert.isTrue(iframe.contentWindow.coriolis.isConnected);
          document.body.removeChild(iframe);
          done();
        });
      });
    });

    it('Check connect method auto attach listeners', done => {
      // Create a true iframe to have a correct origin
      const iframe = document.createElement('iframe');
      iframe.setAttribute('src', '/fixture/coriolis.html');
      document.body.appendChild(iframe);

      const pmc = new PostMessageChannel(
        iframe,
        window.location as unknown as URL,
        {
          autoConnect: false,
        }
      );
      pmc.removeListeners();

      // Wait page load and Coriolis is ready
      iframe.addEventListener('load', () => {
        assert.isFalse(pmc.isConnected);

        const attachListenerSpy = sinon.spy(pmc, 'addListeners');
        assert.isTrue(pmc.connect());
        assert.isTrue(attachListenerSpy.calledOnce);

        pmc.on('connected', () => {
          assert.isTrue(pmc.isConnected);
          assert.isTrue(iframe.contentWindow.coriolis.isConnected);
          document.body.removeChild(iframe);
          attachListenerSpy.restore();
          done();
        });
      });
    });

    it('Check connect method when already connected', done => {
      // Create a true iframe to have a correct origin
      const iframe = document.createElement('iframe');
      iframe.setAttribute('src', '/fixture/coriolis.html');
      document.body.appendChild(iframe);

      const pmc = new PostMessageChannel(
        iframe,
        window.location as unknown as URL,
        {
          autoConnect: false,
        }
      );
      pmc.removeListeners();

      // Wait page load and Coriolis is ready
      iframe.addEventListener('load', () => {
        assert.isFalse(pmc.isConnected);
        assert.isTrue(pmc.connect());

        pmc.on('connected', () => {
          assert.isTrue(pmc.isConnected);

          const socketSendSpy = sinon.spy(pmc, 'socketSend');
          assert.isFalse(pmc.connect());
          assert.isFalse(socketSendSpy.called);

          document.body.removeChild(iframe);
          socketSendSpy.restore();
          done();
        });
      });
    });
  });

  describe('check disconnect', () => {
    it('Check local disconnect', done => {
      // Create a true iframe to have a correct origin
      const iframe = document.createElement('iframe');
      iframe.setAttribute('src', '/fixture/coriolis.html');
      iframe.setAttribute('defer', 'true');
      document.body.appendChild(iframe);

      const pmc = new PostMessageChannel(
        iframe,
        window.location as unknown as URL,
        {
          autoConnect: true,
        }
      );
      assert.isFalse(pmc.isConnected);

      // Wait page load and Coriolis is ready
      pmc.on('connected', () => {
        assert.isTrue(pmc.isConnected);
        assert.isTrue(iframe.contentWindow.coriolis.isConnected);

        // Register callback for local disconnection
        pmc.on('disconnected', () => {
          // check local disconnection
          assert.isFalse(pmc.isConnected);

          // Register callback for remote disconnection
          iframe.contentWindow.coriolis.on('disconnected', () => {
            // check remote disconnection
            assert.isFalse(iframe.contentWindow.coriolis.isConnected);

            // cleanup
            document.body.removeChild(iframe);
            done();
          });
        });

        // launch disconnect
        assert.isTrue(pmc.disconnect());
      });
    });

    it('Check remote disconnect', done => {
      // Create a true iframe to have a correct origin
      const iframe = document.createElement('iframe');
      iframe.setAttribute('src', '/fixture/coriolis.html');
      iframe.setAttribute('defer', 'true');
      document.body.appendChild(iframe);

      const pmc = new PostMessageChannel(
        iframe,
        window.location as unknown as URL,
        {
          autoConnect: true,
        }
      );
      assert.isFalse(pmc.isConnected);

      // Wait page load and Coriolis is ready
      pmc.on('connected', () => {
        assert.isTrue(pmc.isConnected);
        assert.isTrue(iframe.contentWindow.coriolis.isConnected);

        // Register callback for local disconnection
        pmc.on('disconnected', () => {
          // check local disconnection
          assert.isFalse(pmc.isConnected);

          // check remote disconnection
          assert.isFalse(iframe.contentWindow.coriolis.isConnected);

          // cleanup
          document.body.removeChild(iframe);
          done();
        });

        // launch remote disconnect
        assert.isTrue(iframe.contentWindow.coriolis.disconnect());
      });
    });

    it('Check disconnect when not connected', done => {
      // Create a true iframe to have a correct origin
      const iframe = document.createElement('iframe');

      const pmc = new PostMessageChannel(
        iframe,
        window.location as unknown as URL,
        {
          autoConnect: false,
        }
      );
      assert.isFalse(pmc.isConnected);

      const socketSendSpy = sinon.spy(pmc, 'socketSend');
      const emitSpy = sinon.spy(pmc, 'emit');

      // launch disconnect
      assert.isFalse(pmc.disconnect());
      assert.isFalse(socketSendSpy.called);
      assert.isFalse(emitSpy.called);

      socketSendSpy.restore();
      emitSpy.restore();
      done();
    });
  });

  describe('check reconnect', () => {
    it('Check local reconnect', done => {
      // Create a true iframe to have a correct origin
      const iframe = document.createElement('iframe');
      iframe.setAttribute('src', '/fixture/coriolis.html');
      iframe.setAttribute('defer', 'true');
      document.body.appendChild(iframe);

      const pmc = new PostMessageChannel(
        iframe,
        window.location as unknown as URL,
        {
          autoConnect: true,
        }
      );
      assert.isFalse(pmc.isConnected);

      // Wait page load and Coriolis is ready
      pmc.once('connected', () => {
        assert.isTrue(pmc.isConnected);
        assert.isTrue(iframe.contentWindow.coriolis.isConnected);

        pmc.removeListeners();
        const pmc2 = new PostMessageChannel(
          iframe,
          window.location as unknown as URL,
          {
            autoConnect: false,
          }
        );

        pmc2.once('connected', () => {
          // should not send connected event when reconnected
          assert.isFalse(true);
        });

        // Register callback for local disconnection
        pmc2.on('reconnected', () => {
          // check local disconnection
          assert.isTrue(pmc.isConnected);

          // This setTimeout allow the moduleLoader to finish his checks
          setTimeout(() => {
            // cleanup
            document.body.removeChild(iframe);
            done();
          }, 0);
        });

        assert.isTrue(pmc2.connect());
      });
    });

    it('Check remote reconnect', done => {
      // Create a true iframe to have a correct origin
      const iframe = document.createElement('iframe');
      iframe.setAttribute('src', '/fixture/coriolis.html');
      iframe.setAttribute('defer', 'true');
      document.body.appendChild(iframe);

      const pmc = new PostMessageChannel(
        iframe,
        window.location as unknown as URL,
        {
          autoConnect: true,
        }
      );
      assert.isFalse(pmc.isConnected);

      // Wait page load and Coriolis is ready
      pmc.once('connected', () => {
        assert.isTrue(pmc.isConnected);
        assert.isTrue(iframe.contentWindow.coriolis.isConnected);

        pmc.once('connected', () => {
          // should not send connected event when reconnected
          assert.isFalse(true);
        });

        // Register callback for local disconnection
        pmc.on('reconnected', () => {
          // check local disconnection
          assert.isTrue(pmc.isConnected);

          // Register callback for remote disconnection
          iframe.contentWindow.coriolis2.on('reconnected', () => {
            // check remote disconnection
            assert.isTrue(iframe.contentWindow.coriolis2.isConnected);

            // cleanup
            document.body.removeChild(iframe);
            done();
          });
        });

        iframe.contentWindow.coriolis.removeListeners();
        iframe.contentWindow.coriolis2 = new iframe.contentWindow.Coriolis(
          iframe.contentWindow.parent,
          window.location as unknown as URL,
          {autoConnect: true}
        );
      });
    });
  });

  describe('check socketSend, socketOn and socketOnce', () => {
    it('Check socketSend without optionnal arguments', done => {
      // Create a true iframe to have a correct origin
      const iframe = document.createElement('iframe');
      iframe.setAttribute('src', '/fixture/coriolis.html');
      iframe.setAttribute('defer', 'true');
      document.body.appendChild(iframe);

      const pmc = new PostMessageChannel(
        iframe,
        window.location as unknown as URL,
        {
          autoConnect: true,
        }
      );

      // Wait page load and Coriolis is ready
      pmc.once('connected', () => {
        iframe.contentWindow.coriolis.socketOn('test-ABC', data => {
          // Be sure expected value take also into account the poluate property
          assert.deepEqual(data, Object.assign(Object.create(null), {}));
          // cleanup
          document.body.removeChild(iframe);
          done();
        });

        pmc.socketSend('test-ABC');
      });
    });

    it('Check socketSend without data arguments', done => {
      // Create a true iframe to have a correct origin
      const iframe = document.createElement('iframe');
      iframe.setAttribute('src', '/fixture/coriolis.html');
      iframe.setAttribute('defer', 'true');
      document.body.appendChild(iframe);

      const pmc = new PostMessageChannel(
        iframe,
        window.location as unknown as URL,
        {
          autoConnect: true,
        }
      );

      // Wait page load and Coriolis is ready
      pmc.once('connected', () => {
        iframe.contentWindow.coriolis.socketOn('test-ABC', data => {
          // Be sure expected value take also into account the poluate property
          assert.deepEqual(
            data,
            Object.assign(Object.create(null), {toto: 'titi'})
          );
          // cleanup
          document.body.removeChild(iframe);
          done();
        });

        pmc.socketSend('test-ABC', {toto: 'titi'});
      });
    });

    it('Check socketOn', done => {
      // Create a true iframe to have a correct origin
      const iframe = document.createElement('iframe');
      iframe.setAttribute('src', '/fixture/coriolis.html');
      iframe.setAttribute('defer', 'true');
      document.body.appendChild(iframe);

      const pmc = new PostMessageChannel(
        iframe,
        window.location as unknown as URL,
        {
          autoConnect: true,
        }
      );

      // Wait page load and Coriolis is ready
      pmc.once('connected', () => {
        let i = 0;
        pmc.socketOn('test-ABC', data => {
          i++;
          if (i === 1) {
            assert.deepEqual(data, {});
          } else if (i === 2) {
            assert.deepEqual(data, {toto: 'titi'});

            // cleanup
            document.body.removeChild(iframe);
            done();
          }
        });

        iframe.contentWindow.coriolis.socketSend('test-ABC');
        iframe.contentWindow.coriolis.socketSend('test-ABC', {toto: 'titi'});
      });
    });

    it('Check socketOnce', done => {
      // Create a true iframe to have a correct origin
      const iframe = document.createElement('iframe');
      iframe.setAttribute('src', '/fixture/coriolis.html');
      iframe.setAttribute('defer', 'true');
      document.body.appendChild(iframe);

      const pmc = new PostMessageChannel(
        iframe,
        window.location as unknown as URL,
        {
          autoConnect: true,
        }
      );

      // Wait page load and Coriolis is ready
      pmc.once('connected', () => {
        let i = 0;
        pmc.socketOnce('test-ABC', data => {
          i++;
          if (i === 1) {
            assert.deepEqual(data, {});
          } else if (i === 2) {
            // Should not be called twice
            assert.isTrue(false);
          }
        });
        pmc.socketOnce('test-end', data => {
          assert.deepEqual(data, {toto: 'titi'});

          // cleanup
          document.body.removeChild(iframe);
          done();
        });

        iframe.contentWindow.coriolis.socketSend('test-ABC');
        iframe.contentWindow.coriolis.socketSend('test-ABC', {toto: 'titi'});
        iframe.contentWindow.coriolis.socketSend('test-end', {toto: 'titi'});
      });
    });
  });
});

<h1 align="center">
  <img src="docs/coriolis-white-logo.png" alt="Coriolis" />
</h1>


<h3 align="center">A library for cross iframe communication with high level API and features.</h3>

<p align="center">
  <a href="#usefull-links">Usefull Links</a> •
  <a href="#key-features">Key Features</a> •
  <a href="#how-to-use">How To Use</a> •
  <a href="#architecture">Architecture</a> •
  <a href="#related-projects">Related projects</a> •
  <a href="#contributing">Contributing</a> •
	<a href="#licensing">Licensing</a> •
	<a href="#changelog">Changelog</a> •
  <a href="#future-developments">Future developments</a> •
  <a href="#ideas-to-explore">Ideas to explore</a>
</p>


## Useful Links

* [Documentation](https://opensource.adobe.com/coriolis/)

## Key Features

* Cross browser compatibility (see version 1.X for IE support)
* Low number of dependencies and lightweight (~ 10kb minified & gzipped)
* Extensible and modularized (you can add module and serializer)
* Handshake with event for connection, disconnection and reconnection
* Handle most security checks out of the box for you
* Multiple high-level functional API with:
	* Query module for easy cross domain function calls
	* Event module to share state changes
	* Store module to share states with observable support
	* Plugin module to provide you a base plugin system
	* Content module to allow basic operation on child content
* Serializer system for non JavaScript primitive data type like:
	* Map / Set objects
	* Error objects
	* Date objects
	* KeyboardEvent
	* MouseEvent
	* DomRect (with auto translation of coordinate)
	* ArrayBuffer

## How To Use it

In your main domain (Asset domain):

```
<script src="polyfill.js" type="text/javascript" charset="utf-8"></script>
<script src="coriolis.js" type="text/javascript" charset="utf-8"></script>
<div id="coriolisContainer"></div>
<script type="text/javascript">
	var coriolis = Coriolis.createIframe(
		document.querySelector('#coriolisContainer'),
		'https://your-ugc-hostname.example.com',
		'<html><head></head><body>Initial Coriolis Content</div></body></html>'
	);

	coriolis.query.call('addition', 12, 30).then(function(result) {
		console.log(result);
	});
</script>
```

In your user generated content domain:

```
<script src="polyfill.js" type="text/javascript" charset="utf-8"></script>
<script src="coriolis.js" type="text/javascript" charset="utf-8"></script>
<script type="text/javascript">
	var coriolis = new Coriolis(
		window.parent,
		'https://your-asset-hostname.example.com',
	);

	coriolis.query.register('addition', function(a, b) {
		return Promise.resolve(a + b);
	})
</script>
```

This will load Coriolis on both of the domains, do a handshake, override the content of the Iframe with the `Initial Coriolis Content` and finally print the result of `addition` in the main domain (while the computation is done in the iframe).

For more example of Coriolis, you could start the project (`npm start`) and/or check the demo folder. You could also look the generated documentation (build it locally with `npm run doc && open reporting/doc/index.html`).

## Architecture

Coriolis in composed of multiple components and allows for Modules and Serializers to be configured. Here is a high level class diagram that explains how the Class interact.

The DataSerializer and ModuleLoader are abstract enough to be used outside of a context of Postmessage if you have other functional needs (for example, webSocket) and are responsible of the extensibility of Coriolis.

<img src="docs/Coriolis - Class diagram - High level.svg"/>

## Security

Even if Coriolis alone couldn't protect your Assets (replace Assets by what is important for you to protect, eg: IMS token), it should help when you deal with customer data that you couldn't escape (Customer JS code, Customer plugin, Non-Adobe integration, RichText Editors...). It enhances security with 3 main ideas:

* Easy usage prevent developers to bypass security
* Use a specific protocol are reject non expected data
* Configured by default related security setting (sandbox attributes)

The other part that you are in charge of is to ensure a full protection of your Asset is:

* Correctly configure your Cross Origin Resource Sharing (CORS) and Content Security Policy (CSP) on your server
* Use two different domains, one for your main domain with your Assets and one for User Generated Content (UGC)
* Do a security code review of code that used or extends Coriolis on the **main domain**
* Do not shared your Assets through Coriolis

If you used Coriolis and applied all of these advises, you should be secured as described in that threat model diagram:

<img src="docs/Coriolis - Threat model.png"/>

## Related projects

### [penpal](https://github.com/Aaronius/penpal#readme)

Open source project that allow implementing query feature. It is used inside Adobe by Adobe Launch in the [Reactor Bridge](https://github.com/adobe/reactor-bridge). It only support primitive javascript information transfer. It doesn't preconfigure any security parameters by default.

### [postmate](https://github.com/dollarshaveclub/postmate)

A popular Open source project. It has an handshake support. It only support primitive JavaScript information transfer. It's only designed to have parent to child exchange and it's not designed for by-directional communication.

## Contributing

Contributions are welcomed! Read the [Contributing Guide](./.github/CONTRIBUTING.md) for more information.

## Licensing

This project is licensed under the Apache V2 License. See [LICENSE](LICENSE) for more information.

## Changelog

### Version 2.1.2

* Fix missing Readme on npmjs package

### Version 2.1.1

* Allow to bypass origin verification with the '*' as input URL.

### Version 2.1.0

* Fix Map and Set serializer
* Allow to defer the target of PostMessage (create coriolis object before the iframe)
* Fix contentModule that rewrite the content even when not used
* Allow contentModule and StoreModule to handle reconnect or not
* Make StoreModule sync the store at connection with mergeCallback in conflict or use parent value if mergeCallback was not defined.
* Send a disconnect event if the connection is lost (eventlistener for unload)
* Improve typescript definition
* Update connection system to alert in version mismatch
* Add channel listener support and global listener support in store and event module

### Version 2.0.0

* Drop support of Internet Explorer
* Addition of TypeScript
* Reduce checks on usage (will be checked by TypeScript)

## Future Developments

Here is a list of some idea / improvement for future version of Coriolis. Any contribution is welcome and if you have interest for one of the item, event without the ability to contribute, please contact us.

* Add security configuration
	* Add warning when two frame are on the same domain
	* Allow to have multiple whitelisted hosts for parent / child
	* Allow personalization of sandbox attribute
* Move some dependencies into peerDependency (allow main project to use they own polyfill)
* Allow configure target param for the DomRectSerializaer from Coriolis constructor

## Ideas to explore

* Add a strict mode for store (need declare store object before use them)
* Add a tool for help debugging what is inside store, history of event and query
* Make a postMessage decorator for multiple frames forwarder

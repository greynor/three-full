var Three = (function (exports) {
	'use strict';

	function WebGLProperties() {

		var properties = new WeakMap();

		function get( object ) {

			var map = properties.get( object );

			if ( map === undefined ) {

				map = {};
				properties.set( object, map );

			}

			return map;

		}

		function remove( object ) {

			properties.delete( object );

		}

		function update( object, key, value ) {

			properties.get( object )[ key ] = value;

		}

		function dispose() {

			properties = new WeakMap();

		}

		return {
			get: get,
			remove: remove,
			update: update,
			dispose: dispose
		};

	}

	exports.WebGLProperties = WebGLProperties;

	return exports;

}({}));

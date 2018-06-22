var Three = (function (exports) {
	'use strict';

	var _Math = {

		DEG2RAD: Math.PI / 180,
		RAD2DEG: 180 / Math.PI,

		generateUUID: ( function () {

			// http://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid-in-javascript/21963136#21963136

			var lut = [];

			for ( var i = 0; i < 256; i ++ ) {

				lut[ i ] = ( i < 16 ? '0' : '' ) + ( i ).toString( 16 );

			}

			return function generateUUID() {

				var d0 = Math.random() * 0xffffffff | 0;
				var d1 = Math.random() * 0xffffffff | 0;
				var d2 = Math.random() * 0xffffffff | 0;
				var d3 = Math.random() * 0xffffffff | 0;
				var uuid = lut[ d0 & 0xff ] + lut[ d0 >> 8 & 0xff ] + lut[ d0 >> 16 & 0xff ] + lut[ d0 >> 24 & 0xff ] + '-' +
					lut[ d1 & 0xff ] + lut[ d1 >> 8 & 0xff ] + '-' + lut[ d1 >> 16 & 0x0f | 0x40 ] + lut[ d1 >> 24 & 0xff ] + '-' +
					lut[ d2 & 0x3f | 0x80 ] + lut[ d2 >> 8 & 0xff ] + '-' + lut[ d2 >> 16 & 0xff ] + lut[ d2 >> 24 & 0xff ] +
					lut[ d3 & 0xff ] + lut[ d3 >> 8 & 0xff ] + lut[ d3 >> 16 & 0xff ] + lut[ d3 >> 24 & 0xff ];

				// .toUpperCase() here flattens concatenated strings to save heap memory space.
				return uuid.toUpperCase();

			};

		} )(),

		clamp: function ( value, min, max ) {

			return Math.max( min, Math.min( max, value ) );

		},

		// compute euclidian modulo of m % n
		// https://en.wikipedia.org/wiki/Modulo_operation

		euclideanModulo: function ( n, m ) {

			return ( ( n % m ) + m ) % m;

		},

		// Linear mapping from range <a1, a2> to range <b1, b2>

		mapLinear: function ( x, a1, a2, b1, b2 ) {

			return b1 + ( x - a1 ) * ( b2 - b1 ) / ( a2 - a1 );

		},

		// https://en.wikipedia.org/wiki/Linear_interpolation

		lerp: function ( x, y, t ) {

			return ( 1 - t ) * x + t * y;

		},

		// http://en.wikipedia.org/wiki/Smoothstep

		smoothstep: function ( x, min, max ) {

			if ( x <= min ) return 0;
			if ( x >= max ) return 1;

			x = ( x - min ) / ( max - min );

			return x * x * ( 3 - 2 * x );

		},

		smootherstep: function ( x, min, max ) {

			if ( x <= min ) return 0;
			if ( x >= max ) return 1;

			x = ( x - min ) / ( max - min );

			return x * x * x * ( x * ( x * 6 - 15 ) + 10 );

		},

		// Random integer from <low, high> interval

		randInt: function ( low, high ) {

			return low + Math.floor( Math.random() * ( high - low + 1 ) );

		},

		// Random float from <low, high> interval

		randFloat: function ( low, high ) {

			return low + Math.random() * ( high - low );

		},

		// Random float from <-range/2, range/2> interval

		randFloatSpread: function ( range ) {

			return range * ( 0.5 - Math.random() );

		},

		degToRad: function ( degrees ) {

			return degrees * _Math.DEG2RAD;

		},

		radToDeg: function ( radians ) {

			return radians * _Math.RAD2DEG;

		},

		isPowerOfTwo: function ( value ) {

			return ( value & ( value - 1 ) ) === 0 && value !== 0;

		},

		ceilPowerOfTwo: function ( value ) {

			return Math.pow( 2, Math.ceil( Math.log( value ) / Math.LN2 ) );

		},

		floorPowerOfTwo: function ( value ) {

			return Math.pow( 2, Math.floor( Math.log( value ) / Math.LN2 ) );

		}

	};

	var GLNode = function ( type ) {

		this.uuid = _Math.generateUUID();

		this.name = "";
		this.allows = {};

		this.type = type;

		this.userData = {};

	};

	GLNode.prototype.isNode = true;

	GLNode.prototype.parse = function ( builder, context ) {

		context = context || {};

		builder.parsing = true;

		var material = builder.material;

		this.build( builder.addCache( context.cache, context.requires ).addSlot( context.slot ), 'v4' );

		material.clearVertexNode();
		material.clearFragmentNode();

		builder.removeCache().removeSlot();

		builder.parsing = false;

	};

	GLNode.prototype.parseAndBuildCode = function ( builder, output, context ) {

		context = context || {};

		this.parse( builder, context );

		return this.buildCode( builder, output, context );

	};

	GLNode.prototype.buildCode = function ( builder, output, context ) {

		context = context || {};

		var material = builder.material;

		var data = { result: this.build( builder.addCache( context.cache, context.requires ).addSlot( context.slot ), output ) };

		if ( builder.isShader( 'vertex' ) ) data.code = material.clearVertexNode();
		else data.code = material.clearFragmentNode();

		builder.removeCache().removeSlot();

		return data;

	};

	GLNode.prototype.build = function ( builder, output, uuid ) {

		output = output || this.getType( builder, output );

		var material = builder.material, data = material.getDataNode( uuid || this.uuid );

		if ( builder.parsing ) this.appendDepsNode( builder, data, output );

		if ( this.allows[ builder.shader ] === false ) {

			throw new Error( 'Shader ' + shader + ' is not compatible with this node.' );

		}

		if ( material.nodes.indexOf( this ) === - 1 ) {

			material.nodes.push( this );

		}

		if ( this.updateFrame !== undefined && material.updaters.indexOf( this ) === - 1 ) {

			material.updaters.push( this );

		}

		return this.generate( builder, output, uuid );

	};

	GLNode.prototype.appendDepsNode = function ( builder, data, output ) {

		data.deps = ( data.deps || 0 ) + 1;

		var outputLen = builder.getFormatLength( output );

		if ( outputLen > ( data.outputMax || 0 ) || this.getType( builder, output ) ) {

			data.outputMax = outputLen;
			data.output = output;

		}

	};

	GLNode.prototype.getType = function ( builder, output ) {

		return output === 'sampler2D' || output === 'samplerCube' ? output : this.type;

	};

	GLNode.prototype.getJSONNode = function ( meta ) {

		var isRootObject = ( meta === undefined || typeof meta === 'string' );

		if ( ! isRootObject && meta.nodes[ this.uuid ] !== undefined ) {

			return meta.nodes[ this.uuid ];

		}

	};

	GLNode.prototype.createJSONNode = function ( meta ) {

		var isRootObject = ( meta === undefined || typeof meta === 'string' );

		var data = {};

		if ( typeof this.nodeType !== "string" ) throw new Error( "Node does not allow serialization." );

		data.uuid = this.uuid;
		data.type = this.nodeType + "Node";

		if ( this.name !== "" ) data.name = this.name;

		if ( JSON.stringify( this.userData ) !== '{}' ) data.userData = this.userData;

		if ( ! isRootObject ) {

			meta.nodes[ this.uuid ] = data;

		}

		return data;

	};

	GLNode.prototype.toJSON = function ( meta ) {

		return this.getJSONNode( meta ) || this.createJSONNode( meta );

	};

	var TempNode = function ( type, params ) {

		GLNode.call( this, type );

		params = params || {};

		this.shared = params.shared !== undefined ? params.shared : true;
		this.unique = params.unique !== undefined ? params.unique : false;

	};

	TempNode.prototype = Object.create( GLNode.prototype );
	TempNode.prototype.constructor = TempNode;

	TempNode.prototype.build = function ( builder, output, uuid, ns ) {

		output = output || this.getType( builder );

		var material = builder.material;

		if ( this.isShared( builder, output ) ) {

			var isUnique = this.isUnique( builder, output );

			if ( isUnique && this.constructor.uuid === undefined ) {

				this.constructor.uuid = _Math.generateUUID();

			}

			uuid = builder.getUuid( uuid || this.getUuid(), ! isUnique );

			var data = material.getDataNode( uuid );

			if ( builder.parsing ) {

				if ( data.deps || 0 > 0 ) {

					this.appendDepsNode( builder, data, output );

					return this.generate( builder, type, uuid );

				}

				return GLNode.prototype.build.call( this, builder, output, uuid );

			} else if ( isUnique ) {

				data.name = data.name || GLNode.prototype.build.call( this, builder, output, uuid );

				return data.name;

			} else if ( ! builder.optimize || data.deps == 1 ) {

				return GLNode.prototype.build.call( this, builder, output, uuid );

			}

			uuid = this.getUuid( false );

			var name = this.getTemp( builder, uuid );
			var type = data.output || this.getType( builder );

			if ( name ) {

				return builder.format( name, type, output );

			} else {

				name = TempNode.prototype.generate.call( this, builder, output, uuid, data.output, ns );

				var code = this.generate( builder, type, uuid );

				if ( builder.isShader( 'vertex' ) ) material.addVertexNode( name + '=' + code + ';' );
				else material.addFragmentNode( name + '=' + code + ';' );

				return builder.format( name, type, output );

			}

		}

		return GLNode.prototype.build.call( this, builder, output, uuid );

	};

	TempNode.prototype.isShared = function ( builder, output ) {

		return output !== 'sampler2D' && output !== 'samplerCube' && this.shared;

	};

	TempNode.prototype.isUnique = function ( builder, output ) {

		return this.unique;

	};

	TempNode.prototype.getUuid = function ( unique ) {

		var uuid = unique || unique == undefined ? this.constructor.uuid || this.uuid : this.uuid;

		if ( typeof this.scope == "string" ) uuid = this.scope + '-' + uuid;

		return uuid;

	};

	TempNode.prototype.getTemp = function ( builder, uuid ) {

		uuid = uuid || this.uuid;

		var material = builder.material;

		if ( builder.isShader( 'vertex' ) && material.vertexTemps[ uuid ] ) return material.vertexTemps[ uuid ].name;
		else if ( material.fragmentTemps[ uuid ] ) return material.fragmentTemps[ uuid ].name;

	};

	TempNode.prototype.generate = function ( builder, output, uuid, type, ns ) {

		if ( ! this.isShared( builder, output ) ) console.error( "TempNode is not shared!" );

		uuid = uuid || this.uuid;

		if ( builder.isShader( 'vertex' ) ) return builder.material.getVertexTemp( uuid, type || this.getType( builder ), ns ).name;
		else return builder.material.getFragmentTemp( uuid, type || this.getType( builder ), ns ).name;

	};

	var InputNode = function ( type, params ) {

		params = params || {};
		params.shared = params.shared !== undefined ? params.shared : false;

		TempNode.call( this, type, params );

		this.readonly = false;

	};

	InputNode.prototype = Object.create( TempNode.prototype );
	InputNode.prototype.constructor = InputNode;

	InputNode.prototype.isReadonly = function ( builder ) {

		return this.readonly;

	};

	InputNode.prototype.generate = function ( builder, output, uuid, type, ns, needsUpdate ) {

		var material = builder.material;

		uuid = builder.getUuid( uuid || this.getUuid() );
		type = type || this.getType( builder );

		var data = material.getDataNode( uuid ),
			readonly = this.isReadonly( builder ) && this.generateReadonly !== undefined;

		if ( readonly ) {

			return this.generateReadonly( builder, output, uuid, type, ns, needsUpdate );

		} else {

			if ( builder.isShader( 'vertex' ) ) {

				if ( ! data.vertex ) {

					data.vertex = material.createVertexUniform( type, this, ns, needsUpdate );

				}

				return builder.format( data.vertex.name, type, output );

			} else {

				if ( ! data.fragment ) {

					data.fragment = material.createFragmentUniform( type, this, ns, needsUpdate );

				}

				return builder.format( data.fragment.name, type, output );

			}

		}

	};

	var UVNode = function ( index ) {

		TempNode.call( this, 'v2', { shared: false } );

		this.index = index || 0;

	};

	UVNode.vertexDict = [ 'uv', 'uv2' ];
	UVNode.fragmentDict = [ 'vUv', 'vUv2' ];

	UVNode.prototype = Object.create( TempNode.prototype );
	UVNode.prototype.constructor = UVNode;
	UVNode.prototype.nodeType = "UV";

	UVNode.prototype.generate = function ( builder, output ) {

		var material = builder.material;
		var result;

		material.requires.uv[ this.index ] = true;

		if ( builder.isShader( 'vertex' ) ) result = UVNode.vertexDict[ this.index ];
		else result = UVNode.fragmentDict[ this.index ];

		return builder.format( result, this.getType( builder ), output );

	};

	UVNode.prototype.toJSON = function ( meta ) {

		var data = this.getJSONNode( meta );

		if ( ! data ) {

			data = this.createJSONNode( meta );

			data.index = this.index;

		}

		return data;

	};

	var TextureNode = function ( value, coord, bias, project ) {

		InputNode.call( this, 'v4', { shared: true } );

		this.value = value;
		this.coord = coord || new UVNode();
		this.bias = bias;
		this.project = project !== undefined ? project : false;

	};

	TextureNode.prototype = Object.create( InputNode.prototype );
	TextureNode.prototype.constructor = TextureNode;
	TextureNode.prototype.nodeType = "Texture";

	TextureNode.prototype.getTexture = function ( builder, output ) {

		return InputNode.prototype.generate.call( this, builder, output, this.value.uuid, 't' );

	};

	TextureNode.prototype.generate = function ( builder, output ) {

		if ( output === 'sampler2D' ) {

			return this.getTexture( builder, output );

		}

		var tex = this.getTexture( builder, output );
		var coord = this.coord.build( builder, this.project ? 'v4' : 'v2' );
		var bias = this.bias ? this.bias.build( builder, 'fv1' ) : undefined;

		if ( bias == undefined && builder.requires.bias ) {

			bias = builder.requires.bias.build( builder, 'fv1' );

		}

		var method, code;

		if ( this.project ) method = 'texture2DProj';
		else method = bias ? 'tex2DBias' : 'tex2D';

		if ( bias ) code = method + '(' + tex + ',' + coord + ',' + bias + ')';
		else code = method + '(' + tex + ',' + coord + ')';

		if ( builder.isSlot( 'color' ) ) {

			code = 'mapTexelToLinear(' + code + ')';

		} else if ( builder.isSlot( 'emissive' ) ) {

			code = 'emissiveMapTexelToLinear(' + code + ')';

		} else if ( builder.isSlot( 'environment' ) ) {

			code = 'envMapTexelToLinear(' + code + ')';

		}

		return builder.format( code, this.type, output );

	};

	TextureNode.prototype.toJSON = function ( meta ) {

		var data = this.getJSONNode( meta );

		if ( ! data ) {

			data = this.createJSONNode( meta );

			if ( this.value ) data.value = this.value.uuid;

			data.coord = this.coord.toJSON( meta ).uuid;
			data.project = this.project;

			if ( this.bias ) data.bias = this.bias.toJSON( meta ).uuid;

		}

		return data;

	};

	exports.TextureNode = TextureNode;

	return exports;

}({}));

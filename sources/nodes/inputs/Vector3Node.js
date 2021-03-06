import { InputNode } from '../InputNode.js'
import { Vector3 } from '../../math/Vector3.js'
import { NodeMaterial } from '../NodeMaterial.js'



var Vector3Node = function ( x, y, z ) {

	InputNode.call( this, 'v3' );

	this.type = 'v3';
	this.value = new Vector3( x, y, z );

};

Vector3Node.prototype = Object.create( InputNode.prototype );
Vector3Node.prototype.constructor = Vector3Node;
Vector3Node.prototype.nodeType = "Vector3";

NodeMaterial.addShortcuts( Vector3Node.prototype, 'value', [ 'x', 'y', 'z' ] );

Vector3Node.prototype.generateReadonly = function ( builder, output, uuid, type, ns, needsUpdate ) {

	return builder.format( "vec3( " + this.x + ", " + this.y + ", " + this.z + " )", type, output );

};

Vector3Node.prototype.toJSON = function ( meta ) {

	var data = this.getJSONNode( meta );

	if ( ! data ) {

		data = this.createJSONNode( meta );

		data.x = this.x;
		data.y = this.y;
		data.z = this.z;

		if ( this.readonly === true ) data.readonly = true;

	}

	return data;

};

export { Vector3Node }

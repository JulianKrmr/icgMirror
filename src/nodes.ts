import Visitor from './visitor';
import Vector from './vector';
import {Rotation, Scaling, Transformation, Translation} from './transformation';

/**
 * Class representing a Node in a Scenegraph
 */
export class Node {
	/**
	 * Accepts a visitor according to the visitor pattern
	 * @param visitor - The visitor
	 */
	accept(visitor: Visitor) {
	}
}

/**
 * Class representing a GroupNode in the Scenegraph.
 * A GroupNode holds a transformation and is able
 * to have child nodes attached to it.
 * @extends Node
 */
export class GroupNode extends Node {
	childNodes: Node[];
	guID: string;

	/**
	 * Constructor
	 * @param transform A matrix describing the node's transformation
	 * @param guID
	 */
	constructor(public transform: Transformation, guID?: string) {
		super();
		this.childNodes = [];

		if (!guID) {
			//https://learnersbucket.com/examples/javascript/unique-id-generator-in-javascript/
			//generates random id;
			let s4 = () => {
				return Math.floor((1 + Math.random()) * 0x10000)
					.toString(16)
					.substring(1);
			}
			//return id of format 'aaaaaaaa'-'aaaa'-'aaaa'-'aaaa'-'aaaaaaaaaaaa'
			this.guID = s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();

		} else this.guID = guID;
	}


	/**
	 * Accepts a visitor according to the visitor pattern
	 * @param visitor The visitor
	 */
	accept(visitor: Visitor) {
		visitor.visitGroupNode(this);
	}

	/**
	 * Adds a child node
	 * @param childNode The child node to add
	 */
	add(childNode: Node) {
		this.childNodes.push(childNode);
	}

	toJSON() {
		return {
			"GroupNode": {
				"transform": this.transform.toJSON(),
				"childNodes": this.childNodes,
				"guID": this.guID
			}
		}
	}
}

/**
 * Class representing a Camera in the Scenegraph
 * @extends Node
 */
export class CameraNode extends Node {

	/**
	 * Camera
	 */
	constructor(public active: boolean) {
		super();
	}

	/**
	 * Accepts a visitor according to the visitor pattern
	 * @param visitor The visitor
	 */
	accept(visitor: Visitor) {
		visitor.visitCameraNode(this, this.active);
	}

	setActiveStatus(val: boolean) {
		this.active = val;
	}

	toJSON() {
		return {
			"CameraNode": {
				"active": this.active
			}
		}
	}
}

export class LightNode extends Node {

	/**
	 * Lichtquelle / Light
	 */
	constructor() {
		super();
	}

	/**
	 * Accepts a visitor according to the visitor pattern
	 * @param visitor The visitor
	 */
	accept(visitor: Visitor) {
		visitor.visitLightNode(this);
	}

	toJSON() {
		return {
			"LightNode": {}
		}
	}
}

/**
 * Class representing a Sphere in the Scenegraph
 * @extends Node
 */
export class SphereNode extends Node {

	/**
	 * Creates a new Sphere.
	 * The sphere is defined around the origin
	 * with radius 1.
	 * @param color The colour of the Sphere
	 */
	constructor(
		public color: Vector
	) {
		super();
	}

	/**
	 * Accepts a visitor according to the visitor pattern
	 * @param visitor The visitor
	 */
	accept(visitor: Visitor) {
		visitor.visitSphereNode(this);
	}

	toJSON() {
		return {
			"SphereNode": {
				"color": this.color
			}
		}
	}
}

/**
 * Class representing an Axis Aligned Box in the Scenegraph
 * @extends Node
 */
export class AABoxNode extends Node {

	/**
	 * Creates an axis aligned box.
	 * The box's center is located at the origin
	 * with all edges of length 1
	 * @param color1
	 * @param color2
	 * @param outside if not outside then normals of the box are inversed for lighting in desktop
	 */
	constructor(public color1: Vector, public color2: Vector, public outside: boolean) {
		super();
	}

	/**
	 * Accepts a visitor according to the visitor pattern
	 * @param  {Visitor} visitor - The visitor
	 */
	accept(visitor: Visitor) {
		visitor.visitAABoxNode(this, this.outside);
	}

	toJSON() {
		return {
			"AABoxNode": {
				"color1": this.color1,
				"color2": this.color2,
				"outside": this.outside
			}
		}
	}
}

/**
 * Class representing a Textured Axis Aligned Box in the Scenegraph
 * @extends Node
 */
export class TextureBoxNode extends Node {
  /**
   * Creates an axis aligned box textured box
   * The box's center is located at the origin
   * with all edges of length 1
   * @param texture The image filename for the texture
   * @param normalMap
   */
  constructor(public texture: string, public normalMap: string) {
    super();
  }

	/**
	 * Accepts a visitor according to the visitor pattern
	 * @param visitor The visitor
	 */
	accept(visitor: Visitor) {
		visitor.visitTextureBoxNode(this);
	}

	toJSON() {
		return {
			"TextureBoxNode": {
				"texture": this.texture,
                "normalMap": this.normalMap
			}
		}
	}
}

export class PyramidNode extends Node {
	constructor(public area: Vector, public color1?: Vector, public color2?: Vector) {
		super();
	}

	accept(visitor: Visitor) {
		visitor.visitPyramidNode(this);
	}

	toJSON() {
		return {
			"PyramidNode": {
				"area": this.area,
				"color1": this.color1,
				"color2": this.color2
			}
		}
	}
}

export class CustomShapeNode extends Node {
	constructor(public vertices: number[], public normals: number[], public vertex_indices: number[], public normal_indices: number[], public color: Vector) {
		super();
	}

	accept(visitor: Visitor) {
		visitor.visitCustomShapeNode(this);
	}

	toJSON() {
		return {
			"CustomShapeNode": {
				"vertices": this.vertices,
				"normals": this.normals,
				"vertex_indices": this.vertex_indices,
				"normal_indices": this.normal_indices,
				"color": this.color
			}
		}
	}
}
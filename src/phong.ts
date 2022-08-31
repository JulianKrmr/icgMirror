import Vector from './vector';
import Intersection from './intersection';
import {PhongValues} from "./project-boilerplate";

/**
 * Calculate the colour of an object at the intersection point according to the Phong Lighting model.
 * @param color The colour of the intersected object
 * @param intersection The intersection information
 * @param lightPositions The light positions
 * @param shininess The shininess parameter of the Phong model
 * @param cameraPosition The position of the camera
 * @param phongValues
 * @return The resulting colour
 */

export default function phong(color: Vector, intersection: Intersection, lightPositions: Array<Vector>, cameraPosition: Vector, phongValues: PhongValues): Vector {
	//https://codepen.io/shubniggurath/pen/jRwPKm?editors=1000
	//http://jsfiddle.net/soulwire/vBuTR/
	//reflect function: https://www.khronos.org/registry/OpenGL-Refpages/gl4/html/reflect.xhtml
	const lightColor = new Vector(0.5, 0.5, 0.5, 0);
	const kA = phongValues.kA;
	const kD = phongValues.kD;
	const kS = phongValues.kS;

	color = new Vector(color.r, color.g, color.b, 1);

	let viewDirection = cameraPosition.sub(intersection.point);

	let ambient = color.mul(kA);

	let diff = 0;
	let spec = 0;
	for (let i = 0; i < lightPositions.length; i++) {
		let lightDirection = lightPositions[i].sub(intersection.point);
		let reflectDirection = lightDirection.normalize().mul(-1).sub(intersection.normal.mul(intersection.normal.dot(lightDirection.normalize().mul(-1)) * 2.0));

		diff += Math.max(intersection.normal.dot(lightDirection.normalize()), 0.0);
		if (Math.max(intersection.normal.dot(lightDirection.normalize()), 0.0) > 0.0) {
			spec += Math.pow(Math.max(viewDirection.normalize().dot(reflectDirection.normalize()), 0.0), phongValues.shininess);
		}
	}


	let diffuse = color.mul(diff).mul(kD);
	let specular = color.mul(spec).mul(kS);

	return ambient.add(diffuse).add(specular);
}
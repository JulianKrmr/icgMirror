import Vector from "./vector";
import Intersection from "./intersection";
import { PhongValues } from "./project-boilerplate";

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

export default function phong(
  color: Vector,
  intersection: Intersection,
  lightPositions: Array<Vector>,
  cameraPosition: Vector,
  phongValues: PhongValues
): Vector {
  //https://codepen.io/shubniggurath/pen/jRwPKm?editors=1000
  //http://jsfiddle.net/soulwire/vBuTR/
  //reflect function: https://www.khronos.org/registry/OpenGL-Refpages/gl4/html/reflect.xhtml
  const lightColor = new Vector(0.8, 0.8, 0.8, 0);
  const kA = phongValues.kA;
  console.log(phongValues.kA);

  const kD = phongValues.kD;
  console.log(phongValues.kD);

  const kS = phongValues.kS;
  console.log(phongValues.kS);

  color = new Vector(color.r, color.g, color.b, 1);

  let viewDirection = cameraPosition.sub(intersection.point);

  let sumOfLightsDiffuse: Vector = new Vector(0, 0, 0, 0);
  let sumOfLightsSpecular: Vector = new Vector(0, 0, 0, 0);

  //berechnung für jede lichtquelle
  for (let i = 0; i < lightPositions.length; i++) {
    let s: Vector = lightPositions[i].sub(intersection.point).normalize(); //light vector
    let n: Vector = intersection.normal; //normal vector
    let v: Vector = cameraPosition.sub(intersection.point).normalize(); //camera Vector
    let r: Vector = intersection.normal.mul(s.dot(n)).mul(2).sub(s); //reflection vector

    //berechnung diffuse Anteil
    sumOfLightsDiffuse = sumOfLightsDiffuse.add(
      lightColor.mul(Math.max(0, n.dot(s)))
    );

    //berechnung specular Anteil
    sumOfLightsSpecular = sumOfLightsSpecular.add(
      lightColor.mul(Math.pow(Math.max(0, r.dot(v)), phongValues.shininess))
    );
  }

  let ambient: Vector = color.mul(kA);
  let diffuse: Vector = sumOfLightsDiffuse.mul(kD);
  let specular: Vector = sumOfLightsSpecular.mul(kS);

  return ambient.add(diffuse).add(specular);
}

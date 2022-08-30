import Vector from "./vector";
import Intersection from "./intersection";
import Ray from "./ray";

/**
 * Class representing a plane in 4D space
 */
export default class Plane {
  /**
   * The variable to hold the plane points
   */
  data: [Vector, Vector, Vector];
  normalVector: Vector;

  /**
   * Create a vector
   * @param a The first point
   * @param b The second point
   * @param c The third point
   */
  constructor(a: Vector, b: Vector, c: Vector) {
    this.data = [a, b, c];
  }

  intersect(ray: Ray): Intersection | null {
    const pointsArray = this.data;
    const vectorOneZero = pointsArray[0].sub(pointsArray[1]); //Vector from point 1 to point 0
    const vectorOneTwo = pointsArray[2].sub(pointsArray[1]); //Vector from point 1 to point 2
    const normalVector = vectorOneZero.cross(vectorOneTwo); //Normal vector of the plane

    this.normalVector = normalVector;

    //If the normal vector is zero, the plane is parallel to the ray
    if (normalVector.length === 0) {
      return null;
    }
    //check if plane is parallel to ray
    if (normalVector.dot(ray.direction) === 0) {
      return null;
    }
    //calculate intersection point
    const t =
      normalVector.dot(pointsArray[0].sub(ray.origin)) /
      normalVector.dot(ray.direction);
    if (t < 0) {
      //if t is negative, the ray is pointing away from the plane
      return null;
    }
    const intersectionPoint = ray.origin.add(ray.direction.mul(t));
    return new Intersection(t, intersectionPoint, ray.direction);
  }

  isInside(vertices: Array<Vector>, intersectionPoint: Vector): boolean {
    //a method that checks if the intersection point is inside the polygon given by the vertices
    let inside = true;
    let startDirection;
    for (let i = 0; i < vertices.length; i++) {
      const pointOne = vertices[i];
      const pointTwo = vertices[(i + 1) % vertices.length]; //modulo operator to get the next vertex
      const vectorOneTwo = pointOne.sub(pointTwo); //vector from point 1 to point 2
      const vectorOneIntersection = intersectionPoint.sub(pointOne); //vector from point 1 to intersection point
      const normalVector = this.normalVector;
      const crossVector = vectorOneTwo.cross(normalVector); //cross product of vector 1 to 2 and normal vector

      let cosinus = vectorOneIntersection.dot(crossVector);
      let direction: boolean = cosinus > 0;

      if (i == 0) {
        startDirection = direction;
      } else {
        if (startDirection != direction) {
          inside = false;
          break;
        }
      }
    }
    return inside;
  }
}

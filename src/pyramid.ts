import Vector from "./vector";
import Ray from "./ray";
import Intersection from "./intersection";
import Plane from "./plane";

/**
 * Class representing a Pyramid
 */
export default class Pyramid {
  /**
   * The pyramids vertices
   */
  vertices: Array<Vector>;
  indices: Array<number>;

  /**
   * Creates an axis aligned box
   * @param minPoint The minimum Point
   * @param maxPoint The maximum Point
   * @param color The colour of the cube
   */
  constructor(
    corner1: Vector,
    corner2: Vector,
    corner3: Vector,
    corner4: Vector,
    public color: Vector
  ) {
    this.color = color;
    this.vertices = [corner1, corner2, corner3, corner4];
    this.indices = [0, 1, 2, 0, 2, 3, 0, 3, 1, 1, 3, 2];
  }

  /**
   * Calculates the intersection of the Pyramid with the given ray
   * @param ray The ray to intersect with
   * @return The intersection if there is one, null if there is none
   */
  intersect(ray: Ray): Intersection | null {
    let intersectionMin = null;
    let intersectionTMin = Infinity;
    for (let i = 0; i < this.indices.length; i += 3) {
      const a = this.vertices[this.indices[i]];
      const b = this.vertices[this.indices[i + 1]];
      const c = this.vertices[this.indices[i + 2]];

      //create a plane from the 3 vertices of the pyramid
      const plane = new Plane(a, b, c);
      //calculate the intersection of the ray with the plane
      const intersection = plane.intersect(ray);

      const vertices = [a, b, c];
      // if the intersection is not null and is inside the triangle, return it
      if (
        intersection &&
        plane.isInside(vertices, intersection.point) &&
        intersection.t < intersectionTMin
      ) {
        intersectionMin = intersection;
        intersectionTMin = intersection.t;
      }
    }
    return intersectionMin;
  }
}

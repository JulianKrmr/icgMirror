import Ray from "./ray";
import Intersection from "./intersection";
import Vector from "./vector";

export default class RayTriangleIntersection {
    static intersectTriangles(vertices: number[], ray: Ray, indices?: number[]): Intersection {
        // Möller-Trumbore algorithm
        // https://www.lighthouse3d.com/tutorials/maths/ray-triangle-intersection/
        // https://www.scratchapixel.com/lessons/3d-basic-rendering/ray-tracing-rendering-a-triangle/moller-trumbore-ray-triangle-intersection
        if (indices) {
            vertices = this.getNonIndexedVertices(vertices, indices);
        }
        for (let i = 0; i < vertices.length; i += 9) {
            let point1 = new Vector(vertices[i], vertices[i + 1], vertices[i + 2], 1);
            let point2 = new Vector(vertices[i + 3], vertices[i + 4], vertices[i + 5], 1);
            let point3 = new Vector(vertices[i + 6], vertices[i + 7], vertices[i + 8], 1);

            let edge1 = point2.sub(point1);
            let edge2 = point3.sub(point1);

            let pvec = ray.direction.cross(edge2);
            let determinant = edge1.dot(pvec);

            // this takes culled faces into account
            // epsilon is the smallest number possible that is > 0
            if (determinant > -Number.EPSILON && determinant < Number.EPSILON) {
                continue;
            }

            let invDeterminant = 1 / determinant;

            let tvec = ray.origin.sub(point1);
            let u = tvec.dot(pvec) * invDeterminant;
            if (u < 0 || u > 1) {
                continue;
            }

            let qvec = tvec.cross(edge1);
            let v = ray.direction.dot(qvec) * invDeterminant;
            if (v < 0 || u + v > 1) {
                continue;
            }

            // if this point is reached it does indeed intersect the current triangle and we can determine t to find out where the intersection point is
            let t = edge2.dot(qvec) * invDeterminant;
            const p = ray.origin.add(ray.direction.mul(t));
            return new Intersection(t, p, undefined);
        }
        return null;
    }

    static getNonIndexedVertices(vertices: number[], indices: number[]) {
        let nonIndexedVertices = [];
        for (let i = 0; i < indices.length; i++) {
            nonIndexedVertices.push(vertices[indices[i] * 3 + 0]);
            nonIndexedVertices.push(vertices[indices[i] * 3 + 1]);
            nonIndexedVertices.push(vertices[indices[i] * 3 + 2]);
        }
        return nonIndexedVertices
    }
}
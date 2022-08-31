// https://www.researchgate.net/publication/242453691_An_Efficient_Bounding_Sphere
import Vector from "./vector";
import Sphere from "./sphere";

export default class RitterAlgorithm {
    static createRitterBoundingSphere(vertices: Array<number>): Sphere {
        let max_x = new Vector(-Infinity, undefined, undefined, 1);
        let min_x = new Vector(Infinity, undefined, undefined, 1);
        let max_y = new Vector(undefined, -Infinity, undefined, 1);
        let min_y = new Vector(undefined, Infinity, undefined, 1);
        let max_z = new Vector(undefined, undefined, -Infinity, 1);
        let min_z = new Vector(undefined, undefined, Infinity, 1);

        // first iteration: find 6 points with max and min for all 3 dimensions
        for (let i = 0; i < vertices.length; i += 3) {
            let x = vertices[i];
            let y = vertices[i + 1];
            let z = vertices[i + 2];

            if (max_x.x < x) {
                max_x = new Vector(x, y, z, 1);
            } else if (min_x.x > x) {
                min_x = new Vector(x, y, z, 1);
            }

            if (max_y.y < y) {
                max_y = new Vector(x, y, z, 1);
            } else if (min_y.y > y) {
                min_y = new Vector(x, y, z, 1);
            }

            if (max_z.z < z) {
                max_z = new Vector(x, y, z, 1);
            } else if (min_z.z > z) {
                min_z = new Vector(x, y, z, 1);
            }
        }

        // find the pair (of min/max of the same dimension) with biggest point-to-point separation
        let point1 = min_x;
        let point2 = max_x;
        let diameter = point1.sub(point2).length; // diameter = distance between point1 and point2

        let newDiameter = max_y.sub(min_y).length;
        if (newDiameter > diameter) {
            point1 = min_y;
            point2 = max_y;
            diameter = newDiameter;
        }
        newDiameter = max_z.sub(min_z).length;
        if (newDiameter > point1.sub(point2).length) {
            point1 = min_z;
            point2 = max_z;
            diameter = newDiameter;
        }

        // create a sphere that uses point1 and point2 as diameter
        let center = new Vector((point1.x + point2.x) / 2, (point1.y + point2.y) / 2, (point1.z + point2.z) / 2, 1);
        let boundingSphere = new Sphere(center, diameter / 2, undefined)

        // iterate over all points again to also barely include any points that aren't already inside the sphere
        for (let i = 0; i < vertices.length; i += 3) {
            // basically the vector from new point to current center
            let dx = vertices[i] - boundingSphere.center.x;
            let dy = vertices[i + 1] - boundingSphere.center.y;
            let dz = vertices[i + 2] - boundingSphere.center.z;

            let old_to_p_sq = dx * dx + dy * dy + dz * dz; // old refers to old center
            if (old_to_p_sq > Math.pow(boundingSphere.radius, 2)) {
                // then point is outside current boundingSphere: make sphere bigger to include it
                let old_to_p = Math.sqrt(old_to_p_sq); // TODO why? do i need to Math.sqrt? was not included in pseudocode
                // update radius and center accordingly
                boundingSphere.radius = (boundingSphere.radius + old_to_p) / 2;
                let old_to_new = old_to_p - boundingSphere.radius;
                let newCenter_x = (boundingSphere.radius * boundingSphere.center.x + old_to_new * vertices[i]) / old_to_p;
                let newCenter_y = (boundingSphere.radius * boundingSphere.center.y + old_to_new * vertices[i+1]) / old_to_p;
                let newCenter_z = (boundingSphere.radius * boundingSphere.center.z + old_to_new * vertices[i+2]) / old_to_p;
                boundingSphere.center = new Vector(newCenter_x, newCenter_y, newCenter_z, 1);
            }
        }

        return boundingSphere;
    }
}

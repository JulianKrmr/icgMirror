import Vector from './vector';
import Shader from './shader';
import {RasterObject} from "./rasterObject";
import Sphere from "./sphere";
import Ray from "./ray";
import RitterAlgorithm from "./ritterAlgorithm";
import Intersection from "./intersection";
import RayTriangleIntersection from "./rayTriangleIntersection";


/**
 * A class creating buffers for an axis aligned box to render it with WebGL
 */
// has inverted normals compared to RasterBoxOutside
export default class RasterBoxInside implements RasterObject {
    /**
     * The buffer containing the box's vertices
     */
    vertexBuffer: WebGLBuffer;
    vertices: number[];
    /**
     * The normals on the surface at each vertex location
     */
    normalBuffer: WebGLBuffer;

    colorBuffer: WebGLBuffer;
    /**
     * The amount of indices
     */
    elements: number;
    boundingSphere: Sphere;

    /**
     * Creates all WebGL buffers for the box
     *     6 ------- 7
     *    / |       / |
     *   3 ------- 2  |
     *   |  |      |  |
     *   |  5 -----|- 4
     *   | /       | /
     *   0 ------- 1
     *  looking in negative z axis direction
     * @param gl The canvas' context
     * @param minPoint The minimal x,y,z of the box
     * @param maxPoint The maximal x,y,z of the box
     */
    constructor(private gl: WebGL2RenderingContext, minPoint: Vector, maxPoint: Vector, color1: Vector, color2: Vector) {
        this.gl = gl;
        const mi = minPoint;
        const ma = maxPoint;

        // some vertices are duplicate to give a different normal to the same vertex
        // and since duplicate vertices are actually needed, indexing would lose a lot of its value
        let vertices = [
            // 6*6 = 36 vertices because every side needs 6 vertices (2 triangles)

            // front 012 023
            mi.x, mi.y, ma.z, // 0
            ma.x, mi.y, ma.z, // 1
            ma.x, ma.y, ma.z, // 2
            mi.x, mi.y, ma.z, // 0
            ma.x, ma.y, ma.z, // 2
            mi.x, ma.y, ma.z, // 3

            // back 456 467
            ma.x, mi.y, mi.z,
            mi.x, mi.y, mi.z,
            mi.x, ma.y, mi.z,
            ma.x, mi.y, mi.z,
            mi.x, ma.y, mi.z,
            ma.x, ma.y, mi.z,

            // right 147 172
            ma.x, mi.y, ma.z,
            ma.x, mi.y, mi.z,
            ma.x, ma.y, mi.z,
            ma.x, mi.y, ma.z,
            ma.x, ma.y, mi.z,
            ma.x, ma.y, ma.z,

            // bottom 541 510
            mi.x, mi.y, mi.z,
            ma.x, mi.y, mi.z,
            ma.x, mi.y, ma.z,
            mi.x, mi.y, mi.z,
            ma.x, mi.y, ma.z,
            mi.x, mi.y, ma.z,

            // top 327 376
            mi.x, ma.y, ma.z,
            ma.x, ma.y, ma.z,
            ma.x, ma.y, mi.z,
            mi.x, ma.y, ma.z,
            ma.x, ma.y, mi.z,
            mi.x, ma.y, mi.z,

            // left 503 536
            mi.x, mi.y, mi.z,
            mi.x, mi.y, ma.z,
            mi.x, ma.y, ma.z,
            mi.x, mi.y, mi.z,
            mi.x, ma.y, ma.z,
            mi.x, ma.y, mi.z,
        ];
        this.vertices = vertices;
        this.boundingSphere = RitterAlgorithm.createRitterBoundingSphere(vertices);

        let colors = this.createColorArrayTopBottom(color1, color2);
        // has inverted normals compared to RasterBoxOutside
        let normals = [
            // facing front
            0, 0, -1,
            0, 0, -1,
            0, 0, -1,
            0, 0, -1,
            0, 0, -1,
            0, 0, -1,

            // facing back
            0, 0, 1,
            0, 0, 1,
            0, 0, 1,
            0, 0, 1,
            0, 0, 1,
            0, 0, 1,

            // facing right
            -1, 0, 0,
            -1, 0, 0,
            -1, 0, 0,
            -1, 0, 0,
            -1, 0, 0,
            -1, 0, 0,

            // facing bottom
            0, 1, 0,
            0, 1, 0,
            0, 1, 0,
            0, 1, 0,
            0, 1, 0,
            0, 1, 0,

            // facing top
            0, -1, 0,
            0, -1, 0,
            0, -1, 0,
            0, -1, 0,
            0, -1, 0,
            0, -1, 0,

            // facing left
            1, 0, 0,
            1, 0, 0,
            1, 0, 0,
            1, 0, 0,
            1, 0, 0,
            1, 0, 0,
        ];

        const vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
        this.vertexBuffer = vertexBuffer;
        this.elements = vertices.length / 3;

        const normalBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, normalBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(normals), this.gl.STATIC_DRAW);
        this.normalBuffer = normalBuffer;


        const colorBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
        this.colorBuffer = colorBuffer;
    }

    /**
     * Renders the box
     * @param shader The shader used to render
     */
    render(shader: Shader) {
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);
        const positionLocation = shader.getAttributeLocation("a_position");
        this.gl.enableVertexAttribArray(positionLocation);
        this.gl.vertexAttribPointer(positionLocation, 3, this.gl.FLOAT, false, 0, 0);

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.colorBuffer);
        const colorLocation = shader.getAttributeLocation("a_color");
        this.gl.enableVertexAttribArray(colorLocation);
        this.gl.vertexAttribPointer(colorLocation, 4, this.gl.FLOAT, false, 0, 0);

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.normalBuffer);
        const normalLocation = shader.getAttributeLocation("a_normal");
        this.gl.enableVertexAttribArray(normalLocation);
        this.gl.vertexAttribPointer(normalLocation, 3, this.gl.FLOAT, false, 0, 0);

        this.gl.drawArrays(this.gl.TRIANGLES, 0, this.elements);

        this.gl.disableVertexAttribArray(positionLocation);
        this.gl.disableVertexAttribArray(colorLocation);
        this.gl.disableVertexAttribArray(normalLocation);
    }

    createColorArrayTopBottom(color1: Vector, color2: Vector) {
        // paints every vertex with ma.y in color1
        return [
            color1.r, color1.g, color1.b, color1.a,
            color1.r, color1.g, color1.b, color1.a,
            color2.r, color2.g, color2.b, color2.a,
            color1.r, color1.g, color1.b, color1.a,
            color2.r, color2.g, color2.b, color2.a,
            color2.r, color2.g, color2.b, color2.a,

            color1.r, color1.g, color1.b, color1.a,
            color1.r, color1.g, color1.b, color1.a,
            color2.r, color2.g, color2.b, color2.a,
            color1.r, color1.g, color1.b, color1.a,
            color2.r, color2.g, color2.b, color2.a,
            color2.r, color2.g, color2.b, color2.a,

            color1.r, color1.g, color1.b, color1.a,
            color1.r, color1.g, color1.b, color1.a,
            color2.r, color2.g, color2.b, color2.a,
            color1.r, color1.g, color1.b, color1.a,
            color2.r, color2.g, color2.b, color2.a,
            color2.r, color2.g, color2.b, color2.a,

            color1.r, color1.g, color1.b, color1.a,
            color1.r, color1.g, color1.b, color1.a,
            color1.r, color1.g, color1.b, color1.a,
            color1.r, color1.g, color1.b, color1.a,
            color1.r, color1.g, color1.b, color1.a,
            color1.r, color1.g, color1.b, color1.a,

            color2.r, color2.g, color2.b, color2.a,
            color2.r, color2.g, color2.b, color2.a,
            color2.r, color2.g, color2.b, color2.a,
            color2.r, color2.g, color2.b, color2.a,
            color2.r, color2.g, color2.b, color2.a,
            color2.r, color2.g, color2.b, color2.a,

            color1.r, color1.g, color1.b, color1.a,
            color1.r, color1.g, color1.b, color1.a,
            color2.r, color2.g, color2.b, color2.a,
            color1.r, color1.g, color1.b, color1.a,
            color2.r, color2.g, color2.b, color2.a,
            color2.r, color2.g, color2.b, color2.a,
        ];
    }

    intersectBoundingSphere(ray: Ray) {
        let intersection = this.boundingSphere.intersect(ray);
        return intersection;
    }

    intersectTriangles(ray: Ray): Intersection {
        return RayTriangleIntersection.intersectTriangles(this.vertices, ray);
    }

    updateColor(newColor: Vector, newSecondaryColor: Vector) {
        let colors = this.createColorArrayTopBottom(newColor, newSecondaryColor);

        const colorBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, colorBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(colors), this.gl.STATIC_DRAW);
        this.colorBuffer = colorBuffer;
    }
}
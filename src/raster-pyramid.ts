import Vector from './vector';
import Shader from './shader';
import Sphere from "./sphere";
import RitterAlgorithm from "./ritterAlgorithm";
import Ray from "./ray";
import {RasterObject} from "./rasterObject";
import Intersection from "./intersection";
import RayTriangleIntersection from "./rayTriangleIntersection";


/**
 * A class creating buffers for an axis aligned box to render it with WebGL
 */
export default class RasterPyramid implements RasterObject {
    /**
     * The buffer containing the box's vertices
     */
    vertexBuffer: WebGLBuffer;
    vertices: number[];

    indexBuffer: WebGLBuffer;
    indices: number[];

    normalBuffer: WebGLBuffer;

    colorBuffer: WebGLBuffer;
    /**
     * The amount of indices
     */
    elements: number;

    boundingSphere: Sphere;

    /**
     * Creates all WebGL buffers for the box
     *
     *
     *          4 (Spitze)
     *
     *      3 ------- 2
     *     /         /
     *   0 ------- 1
     *  looking in negative z axis direction
     * @param gl The canvas' context
     * @param minPoint The minimal x,y,z of the box
     * @param maxPoint The maximal x,y,z of the box
     * @param color1
     * @param color2
     */
    constructor(private gl: WebGL2RenderingContext, minPoint: Vector, maxPoint: Vector, color1?: Vector, color2?: Vector) {
        this.gl = gl;
        const mi = minPoint;
        const ma = maxPoint;

        // some vertices are duplicate to give a different normal to the same vertex
        // and since duplicate vertices are actually needed, indexing would lose a lot of its value
        // we will still use indices here to show that we know how to work with them and they still save a few vertices (2 here)
        let vertices = [
            // front
            mi.x, mi.y, ma.z, //0
            ma.x, mi.y, ma.z, // 1
            (mi.x + ma.x) / 2, ma.y, (mi.z + ma.z) / 2, //4

            ma.x, mi.y, mi.z, // 2
            mi.x, mi.y, mi.z, // 3
            (mi.x + ma.x) / 2, ma.y, (mi.z + ma.z) / 2,

            ma.x, mi.y, ma.z, // 1
            ma.x, mi.y, mi.z, // 2
            (mi.x + ma.x) / 2, ma.y, (mi.z + ma.z) / 2,

            mi.x, mi.y, mi.z,
            mi.x, mi.y, ma.z,
            (mi.x + ma.x) / 2, ma.y, (mi.z + ma.z) / 2,

            mi.x, mi.y, ma.z,
            ma.x, mi.y, ma.z,
            ma.x, mi.y, mi.z,
            mi.x, mi.y, mi.z,
        ];
        this.vertices = vertices;
        let indices = [
            0, 1, 2,
            3, 4, 5,
            6, 7, 8,
            9, 10, 11,
            12, 13, 14,
            14, 15, 12
        ];
        this.indices = indices;
        this.boundingSphere = RitterAlgorithm.createRitterBoundingSphere(vertices);

        if (color1 === undefined) {
            color1 = new Vector(Math.random(), Math.random(), Math.random(), 1);
        }

        if (color2 === undefined) {
            color2 = new Vector(Math.random(), Math.random(), Math.random(), 1);
        }

        let colors = [
            color1.r, color1.g, color1.b, color1.a,
            color1.r, color1.g, color1.b, color1.a,
            color2.r, color2.g, color2.b, color2.a,

            color1.r, color1.g, color1.b, color1.a,
            color1.r, color1.g, color1.b, color1.a,
            color2.r, color2.g, color2.b, color2.a,

            color1.r, color1.g, color1.b, color1.a,
            color1.r, color1.g, color1.b, color1.a,
            color2.r, color2.g, color2.b, color2.a,

            color1.r, color1.g, color1.b, color1.a,
            color1.r, color1.g, color1.b, color1.a,
            color2.r, color2.g, color2.b, color2.a,

            color1.r, color1.g, color1.b, color1.a,
            color1.r, color1.g, color1.b, color1.a,
            color1.r, color1.g, color1.b, color1.a,
            color1.r, color1.g, color1.b, color1.a,
            color1.r, color1.g, color1.b, color1.a,
            color1.r, color1.g, color1.b, color1.a,
        ];

        // calculate the normals
        let point0 = new Vector(mi.x, mi.y, ma.z, 1);
        let point1 = new Vector(ma.x, mi.y, ma.z, 1);
        let point2 = new Vector(ma.x, mi.y, mi.z, 1);
        let point3 = new Vector(mi.x, mi.y, mi.z, 1);
        let point4 = new Vector((mi.x + ma.x) / 2, ma.y, (mi.z + ma.z) / 2, 1);

        let vec_0_1 = point1.sub(point0);
        let vec_0_4 = point4.sub(point0);
        let frontUp = vec_0_1.cross(vec_0_4).normalize();

        let vec_3_0 = point0.sub(point3);
        let vec_3_4 = point4.sub(point3);
        let leftUp = vec_3_0.cross(vec_3_4).normalize();

        let vec_2_3 = point3.sub(point2);
        let vec_2_4 = point4.sub(point2);
        let backUp = vec_2_3.cross(vec_2_4).normalize();

        let vec_1_2 = point2.sub(point1);
        let vec_1_4 = point4.sub(point1);
        let rightUp = vec_1_2.cross(vec_1_4).normalize();

        let normals = [
            // facing front and up
            frontUp.x, frontUp.y, frontUp.z,
            frontUp.x, frontUp.y, frontUp.z,
            frontUp.x, frontUp.y, frontUp.z,

            // facing back and up
            backUp.x, backUp.y, backUp.z,
            backUp.x, backUp.y, backUp.z,
            backUp.x, backUp.y, backUp.z,

            rightUp.x, rightUp.y, rightUp.z, // right up
            rightUp.x, rightUp.y, rightUp.z, // right up
            rightUp.x, rightUp.y, rightUp.z, // right up

            leftUp.x, leftUp.y, leftUp.z,
            leftUp.x, leftUp.y, leftUp.z,
            leftUp.x, leftUp.y, leftUp.z,

            0, -1, 0,
            0, -1, 0,
            0, -1, 0,
            0, -1, 0,
            0, -1, 0,
            0, -1, 0,
        ];

        const vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
        this.vertexBuffer = vertexBuffer;

        const indexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
        this.indexBuffer = indexBuffer;
        this.elements = indices.length;

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

        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        this.gl.drawElements(this.gl.TRIANGLES, this.elements, this.gl.UNSIGNED_SHORT, 0);

        this.gl.disableVertexAttribArray(positionLocation);
        this.gl.disableVertexAttribArray(colorLocation);
        this.gl.disableVertexAttribArray(normalLocation);
    }

    intersectBoundingSphere(ray: Ray) {
        let intersection = this.boundingSphere.intersect(ray);
        return intersection;
    }

    intersectTriangles(ray: Ray): Intersection {
        return RayTriangleIntersection.intersectTriangles(this.vertices, ray, this.indices);
    }

    updateColor(newColor: Vector, newSecondaryColor: Vector) {
        let colors = [
            newColor.r, newColor.g, newColor.b, newColor.a,
            newColor.r, newColor.g, newColor.b, newColor.a,
            newSecondaryColor.r, newSecondaryColor.g, newSecondaryColor.b, newSecondaryColor.a,

            newColor.r, newColor.g, newColor.b, newColor.a,
            newColor.r, newColor.g, newColor.b, newColor.a,
            newSecondaryColor.r, newSecondaryColor.g, newSecondaryColor.b, newSecondaryColor.a,

            newColor.r, newColor.g, newColor.b, newColor.a,
            newColor.r, newColor.g, newColor.b, newColor.a,
            newSecondaryColor.r, newSecondaryColor.g, newSecondaryColor.b, newSecondaryColor.a,

            newColor.r, newColor.g, newColor.b, newColor.a,
            newColor.r, newColor.g, newColor.b, newColor.a,
            newSecondaryColor.r, newSecondaryColor.g, newSecondaryColor.b, newSecondaryColor.a,

            newColor.r, newColor.g, newColor.b, newColor.a,
            newColor.r, newColor.g, newColor.b, newColor.a,
            newColor.r, newColor.g, newColor.b, newColor.a,
            newColor.r, newColor.g, newColor.b, newColor.a,
            newColor.r, newColor.g, newColor.b, newColor.a,
            newColor.r, newColor.g, newColor.b, newColor.a,
        ];

        const colorBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, colorBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(colors), this.gl.STATIC_DRAW);
        this.colorBuffer = colorBuffer;
    }
}
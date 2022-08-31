import Shader from "./shader";
import Ray from "./ray";
import Intersection from "./intersection";
import Sphere from "./sphere";

export interface RasterObject{
    boundingSphere: Sphere;
    vertexBuffer: WebGLBuffer;
    vertices: number[];

    render(shader: Shader): void;
    intersectBoundingSphere(ray: Ray): Intersection;
    intersectTriangles(ray: Ray): Intersection;
    /*
    updateColor(newColor: Vector, newSecondaryColor?: Vector): void;
    updateColor(): void;
    updateColor(newTexture: string): void;
     */
    // can't really overload the function so... takes either 2 colors, a texture or nothing depending on the RasterObject
    updateColor(a?: any, b?: any): void;
}
import Matrix from './matrix';
import Vector from './vector';
import Sphere from './sphere';
import Intersection from './intersection';
import Ray from './ray';
import Visitor from './visitor';
import phong from './phong';
import {
    Node, GroupNode, SphereNode,
    AABoxNode, TextureBoxNode, CameraNode, PyramidNode, LightNode, CustomShapeNode
} from './nodes';
import {CameraRaytracer, PhongValues} from "./project-boilerplate";
import {FirstTraversalVisitorRay} from "./firstTraversalVisitorRay";

const UNIT_SPHERE = new Sphere(new Vector(0, 0, 0, 1), 1, new Vector(0, 0, 0, 1));

/**
 * Class representing a Visitor that uses
 * Raytracing to render a Scenegraph
 */
export default class RayVisitor implements Visitor {
    /**
     * The image data of the context to
     * set individual pixels
     */
    imageData: ImageData;
    matrixStack: Matrix[];
    inverseStack: Matrix[];
    intersection: Intersection | null;
    intersectionColor: Vector;
    ray: Ray;
    camera: CameraRaytracer;
    lightPositions: Array<Vector>;
    firstTraversalVisitor: FirstTraversalVisitorRay;
    mouseRay: Ray;
    // saves the intersected Object, the according intersection and the mouseRay in local space of the according object:
    objectIntersections: [Sphere, Intersection, Ray, SphereNode][]; // equivalent to Array<[RasterObject, Intersection, Ray]>


    /**
     * Creates a new RayVisitor
     * @param context The 2D context to render to
     * @param width The width of the canvas
     * @param height The height of the canvas
     */
    constructor(private context: CanvasRenderingContext2D, width: number, height: number) {
        this.imageData = context.getImageData(0, 0, width, height);
    }

    /**
     * Renders the Scenegraph
     * @param rootNode The root node of the Scenegraph
     * @param camera The camera used
     * @param lightPositions The light light positions
     * @param phongValues phong-coefficients
     * @param firstTraversalVisitorRay
     */
    render(
        rootNode: Node,
        camera: { origin: Vector, width: number, height: number, alpha: number, toWorld: Matrix } | null,
        lightPositions: Array<Vector> | null,
        phongValues: PhongValues,
        firstTraversalVisitorRay: FirstTraversalVisitorRay
    ) {
        // clear
        let data = this.imageData.data;
        data.fill(0);

        if (firstTraversalVisitorRay) {
            //first traversal
            firstTraversalVisitorRay.setup(rootNode);
            this.camera = firstTraversalVisitorRay.camera;
            this.lightPositions = firstTraversalVisitorRay.lightPositions;
            this.firstTraversalVisitor = firstTraversalVisitorRay;
            if (firstTraversalVisitorRay.mouseRay) {
                this.mouseRay = firstTraversalVisitorRay.mouseRay;
                // reset
                firstTraversalVisitorRay.mouseRay = undefined;
            }
        } else {
            this.camera = camera;
        }

        // raytrace
        const width = this.imageData.width;
        const height = this.imageData.height;
        for (let x = 0; x < width; x++) {
            for (let y = 0; y < height; y++) {


                this.ray = Ray.makeRay(x, y, this.camera);

                //MatrixStacks hier immer neu leeren, damit firefox nicht crasht
                this.matrixStack = [];
                this.inverseStack = [];

                this.objectIntersections = [];

                this.matrixStack.push(Matrix.identity());
                this.inverseStack.push(Matrix.identity());

                this.intersection = null;
                rootNode.accept(this);

                if (this.intersection) {
                    if (!this.intersectionColor) {
                        data[4 * (width * y + x) + 0] = 0;
                        data[4 * (width * y + x) + 1] = 0;
                        data[4 * (width * y + x) + 2] = 0;
                        data[4 * (width * y + x) + 3] = 255;
                    } else {
                        let color = phong(this.intersectionColor, this.intersection, this.lightPositions, this.camera.origin, phongValues);
                        data[4 * (width * y + x) + 0] = color.r * 255;
                        data[4 * (width * y + x) + 1] = color.g * 255;
                        data[4 * (width * y + x) + 2] = color.b * 255;
                        data[4 * (width * y + x) + 3] = 255;
                    }
                }
            }
        }

        if (this.mouseRay) {
            // sort the boundingSphere intersections by distance to look at the closest hit first
            this.objectIntersections.sort((a, b) => {
                return a[1].t - b[1].t;
            });

            for (let i = 0; i < this.objectIntersections.length; i++) {
                // then check if the actual object (triangles) were hit: if no, keep going down the list
                let object = this.objectIntersections[i][0];
                let localMouseRay = this.objectIntersections[i][2];
                let node = this.objectIntersections[i][3];

                //object.updateColor(new Vector(Math.random(), Math.random(), Math.random(), 1), new Vector(Math.random(), Math.random(), Math.random(), 1)); // TODO delete
                node.color = new Vector(Math.random(), Math.random(), Math.random(), 1);
                break; // TODO delete

                /*
                let triangleIntersection = object.intersectTriangles(localMouseRay);
                if(triangleIntersection){
                    object.updateColor(new Vector(Math.random(), Math.random(), Math.random(), 1));
                    break;
                }

                 */
            }
            // reset
            this.mouseRay = undefined;
        }
        this.context.putImageData(this.imageData, 0, 0);
    }

    /**
     * Visits a group node
     * @param node The node to visit
     */
    visitGroupNode(node: GroupNode) {
        //Stack pushen
        this.matrixStack.push(this.matrixStack[this.matrixStack.length - 1].mul(node.transform.getMatrix()));
        this.inverseStack.push(node.transform.getInverseMatrix().mul(this.inverseStack[this.inverseStack.length - 1]));

        //jedes children accepten lassen -> ruft bei group-node wieder visitGroupNode auf (rekursiv quasi)
        node.childNodes.forEach(node => node.accept(this)); //lambda-Ausdruck von Array

        this.matrixStack.pop();
        this.inverseStack.pop();
    }

    /**
     * Visits a sphere node
     * @param node - The node to visit
     */
    visitSphereNode(node: SphereNode) {
        let toWorld = this.matrixStack[this.matrixStack.length - 1];
        let fromWorld = this.inverseStack[this.inverseStack.length - 1];

        const ray = new Ray(fromWorld.mulVec(this.ray.origin), fromWorld.mulVec(this.ray.direction).normalize());
        let intersection = UNIT_SPHERE.intersect(ray);

        if (intersection) {
            const intersectionPointWorld = toWorld.mulVec(intersection.point);
            const intersectionNormalWorld = toWorld.mulVec(intersection.normal).normalize();
            intersection = new Intersection(
                (intersectionPointWorld.x - ray.origin.x) / ray.direction.x,
                intersectionPointWorld,
                intersectionNormalWorld
            );
            if (this.intersection === null || intersection.closerThan(this.intersection)) {
                this.intersection = intersection;
                this.intersectionColor = node.color;
            }
        }

        if (this.mouseRay) {
            let sphere = UNIT_SPHERE;
            let mouseRayLocal = new Ray(fromWorld.mulVec(this.mouseRay.origin), fromWorld.mulVec(this.mouseRay.direction).normalize());
            let intersection = sphere.intersect(mouseRayLocal);
            if (intersection) {
                let objectIntersection: [Sphere, Intersection, Ray, SphereNode] = [sphere, intersection, mouseRayLocal, node];
                this.objectIntersections.push(objectIntersection);
            }
        }
    }

    /**
     * Visits an axis aligned box node
     * @param node The node to visit
     * @param outside
     */
    visitAABoxNode(node: AABoxNode, outside: boolean): void {
    }

    /**
     * Visits a textured box node
     * @param node The node to visit
     */
    visitTextureBoxNode(node: TextureBoxNode) {
    }

    visitCustomShapeNode(node: CustomShapeNode): void {

    }

    /**
     * Visits a camera node
     * @param node The node to visit
     */
    visitCameraNode(node: CameraNode) {
    }

    visitLightNode(node: LightNode) {
    }

    visitPyramidNode(node: PyramidNode): void {
    }

    castRayFromMouse(mx: number, my: number) {
        let mouseRay = Ray.makeRay(mx, my, this.camera);
        this.firstTraversalVisitor.mouseRay = mouseRay;
    }
}
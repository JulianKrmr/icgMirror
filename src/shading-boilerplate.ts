import 'bootstrap';
import 'bootstrap/scss/bootstrap.scss';
import Vector from './vector';
import {
    GroupNode,
    SphereNode,
    TextureBoxNode
} from './nodes';
import {
    RasterVisitor,
    RasterSetupVisitor
} from './rastervisitor';
import Shader from './shader';
import phongVertexShader from './phong-vertex-shader.glsl';
import phongFragmentShader from './phong-fragment-shader.glsl';
import textureVertexShader from './texture-vertex-shader.glsl';
import textureFragmentShader from './texture-fragment-shader.glsl';
import { Rotation, Scaling, Translation } from './transformation';
import {FirstTraversalVisitorRaster} from "./firstTraversalVisitorRaster";

window.addEventListener('load', () => {
    const canvas = document.getElementById("rasteriser") as HTMLCanvasElement;
    const gl = canvas.getContext("webgl2");

    // construct scene graph
    const sg = new GroupNode(new Scaling(new Vector(1.4, 1.4, 1.4, 1)));
    const sg2 = new GroupNode(new Translation(new Vector(0, 0, 0.4, 0)));
    sg.add(sg2);
    const gn0 = new GroupNode(new Rotation(new Vector(0, 0, 0, 0), 0));
    const gn1 = new GroupNode(new Scaling(new Vector(.3, .3, .3, 0)));
    gn0.add(gn1);
    const gn2 = new GroupNode(new Translation(new Vector(1, 0, -1.9, 0)));
    gn1.add(gn2);
    const sphere = new SphereNode(new Vector(.8, .4, .1, 1));
    gn2.add(sphere);
    let gn3 = new GroupNode(new Translation(new Vector(.5, 0, 0, 0)));
    gn0.add(gn3);
    sg2.add(gn0);
    const cube = new TextureBoxNode('hci-logo.png', 'brickwall_normal.jpg');
    gn3.add(cube);

    // setup for rendering
    const setupVisitor = new RasterSetupVisitor(gl);
    setupVisitor.setup(sg);

    let camera = {
        eye: new Vector(0, 0, 1, 1),
        center: new Vector(0, 0, 0, 1),
        up: new Vector(0, 1, 0, 0),
        fovy: 60,
        aspect: canvas.width / canvas.height,
        near: 0.1,
        far: 100
    };

    const phongShader = new Shader(gl,
        phongVertexShader,
        phongFragmentShader
    );
    const textureShader = new Shader(gl,
        textureVertexShader,
        textureFragmentShader
    );

    const phongValues = {
        shininess: 16.0,
        kA: 0.3,
        kD: 0.6,
        kS: 0.7
    }

    const visitor = new RasterVisitor(gl, phongShader, textureShader, setupVisitor.objects);

    function animate(timestamp: number) {
        gn0.transform = new Rotation(new Vector(0, 0, 1, 0), timestamp / 1000);
        gn3.transform = new Rotation(new Vector(0, 1, 0, 0), timestamp / 1000);
        visitor.render(sg, camera, [], phongValues, null);
        window.requestAnimationFrame(animate);
    }

    phongShader.load();
    textureShader.load();
    window.requestAnimationFrame(animate);
});
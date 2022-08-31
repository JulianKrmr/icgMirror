import 'bootstrap';
import 'bootstrap/scss/bootstrap.scss';
import Vector from './vector';
import {
	AABoxNode,
	GroupNode, PyramidNode, CameraNode, SphereNode,
	TextureBoxNode, LightNode, CustomShapeNode
} from './nodes';
import {
	RasterVisitor,
	RasterSetupVisitor
} from './rastervisitor';
import Shader from './shader';
import {
	RotationNode, TranslationNode, JumperNode, ScalingNode
} from './animation-nodes';
import phongVertexShader from './phong-vertex-perspective-shader.glsl';
import phongFragmentShader from './phong-fragment-shader.glsl';
import textureVertexShader from './texture-vertex-perspective-shader.glsl';
import textureFragmentShader from './texture-fragment-shader.glsl';
import {Rotation, Scaling, Transformation, Translation} from './transformation';
import RayVisitor from "./rayvisitor";
import Matrix from "./matrix";
import {FirstTraversalVisitorRaster} from "./firstTraversalVisitorRaster";
import {FirstTraversalVisitorRay} from "./firstTraversalVisitorRay";

export interface CameraRasteriser {
	eye: Vector,
	center: Vector,
	up: Vector,
	fovy: number,
	aspect: number,
	near: number,
	far: number
}

export interface CameraRaytracer {
	origin: Vector,
	width: number,
	height: number,
	alpha: number,
	toWorld: Matrix
}

export interface PhongValues {
	shininess: number,
	kA: number,
	kD: number,
	kS: number
}

interface AnimationNodes {
	freeFlightNodes: any[],
	controlledAnimationNodes: any[];
	otherAnimationNodes: any[]
}

interface Scene {
	scenegraph: GroupNode;
	animationNodes: AnimationNodes;
	phongValues: PhongValues;
}

//Eigener Canvas für Rendertypen, da ein Canvas nur einen Context unterstützt
let canvasRasteriser: HTMLCanvasElement;
let canvasRaytracer: HTMLCanvasElement;
let gl: WebGL2RenderingContext;
let ctx2d: CanvasRenderingContext2D;
let phongShader: Shader;
let textureShader: Shader;
let cameraRasteriser: CameraRasteriser;
let cameraRaytracer: CameraRaytracer;
let setupVisitor: RasterSetupVisitor;
let visitorRasteriser: RasterVisitor;
let visitorRaytracer: RayVisitor;
let firstTraversalVisitorRaster: FirstTraversalVisitorRaster;
let firstTraversalVisitorRay: FirstTraversalVisitorRay;

let rootNode: GroupNode;
let animationNodes: AnimationNodes; //wenn Array vom Typ AnimationNode, kann die simulate-Methode nicht gefunden werden
let freeFlightAnimationNodes: any[];
let controlledAnimationNodes: any[];
let otherAnimationNodes: any[];
let cameraNodes: any[];
let lightPositions: Array<Vector>;
let phongValues: PhongValues;
let scene: Scene;
let rendertype = "rasteriser";

window.addEventListener('load', () => {
	canvasRasteriser = document.getElementById("rasteriser") as HTMLCanvasElement;
	canvasRaytracer = document.getElementById("raytracer") as HTMLCanvasElement;
	gl = canvasRasteriser.getContext("webgl2");
	ctx2d = canvasRaytracer.getContext("2d");

	phongShader = new Shader(gl,
		phongVertexShader,
		phongFragmentShader
	);
	textureShader = new Shader(gl,
		textureVertexShader,
		textureFragmentShader
	);

	lightPositions = [
		new Vector(1, 1, 1, 1)
	];
	//TODO Änderungen an phongValues auch im project.html für die Slider ändern
	phongValues = {
		shininess: 16.0,
		kA: 0.2,
		kD: 0.7,
		kS: 0.7
	}
	freeFlightAnimationNodes = [];
	controlledAnimationNodes = [];
	otherAnimationNodes = [];
	cameraNodes = [];

	// construct scene graph
	//
	// AnimationNodes stehen in den Klammern
	/*
		   scenegraph

		   gn1			gn3	---------------+-------------------------+------------------+															gn7				gn9 (rotation)		camera1
		   gn2			gn4 (scaling)	gn5 (jumper, rotation)		gn10 (rotation)		gn6 (rotation)------+-----------+							textureCube		light1
		   desktop		pyramid			sphere1			light2		light3				aabox				camera2		gn8 (rotation)--+
																														sphere2			gn11
																																		pyramid2
	 */

	rootNode = new GroupNode(new Translation(new Vector(0, 0, -10, 0)));

	const gn1 = new GroupNode(new Translation(new Vector(2, 0, 8, 0)));
	const gn2 = new GroupNode(new Scaling(new Vector(15, 15, 15, 1)));
	const desktop = new AABoxNode(new Vector(0.7, 0.7, 0.2, 1.0), new Vector(0.3, 0.0, 0.7, 1.0), false);
	rootNode.add(gn1);
	gn1.add(gn2);
	gn2.add(desktop);

	const gn3 = new GroupNode(new Translation(new Vector(-3, 5, 3, 0)));
	const gn4 = new GroupNode(new Rotation(new Vector(1, 0, 0, 0), 1.5708));
	const pyramid = new PyramidNode(new Vector(1, 0.5, 1, 1), new Vector(.1, .4, .8, 1), new Vector(.9, .4, .1, 1));
	rootNode.add(gn3);
	gn3.add(gn4);
	gn4.add(pyramid);
	controlledAnimationNodes.push(
		new ScalingNode(gn4, true));

	const gn5 = new GroupNode(new Translation(new Vector(4, -8, 2, 0)));
	const sphere1 = new SphereNode(new Vector(.5, .2, .2, 1));
	gn3.add(gn5);
	gn5.add(sphere1);
	controlledAnimationNodes.push(
		new JumperNode(gn5, 3, 20));

	const gn6 = new GroupNode(new Translation(new Vector(7, -3, 5, 0)));
	const aaBox = new AABoxNode(new Vector(0.6, 0.4, 0.05, 1.0), new Vector(0.3, 1.0, 0.58, 1.0), true);
	gn3.add(gn6);
	gn6.add(aaBox);
	otherAnimationNodes.push(
		new RotationNode(gn6, new Vector(0, 1, 0, 0), 20));

	const gn7 = new GroupNode(new Translation(new Vector(0, 0, 7, 0)));
	const textureCube = new TextureBoxNode('hci-logo.png', './textures/flowers_normal.jpg');
	rootNode.add(gn7);
	gn7.add(textureCube);
	otherAnimationNodes.push(
		new RotationNode(gn7, new Vector(1, 0, 0, 0), 20));

	const gn8 = new GroupNode(new Translation(new Vector(-3, 0, 0, 0)));
	const sphere2 = new SphereNode(new Vector(0, .7, .2, 1));
	gn6.add(gn8);
	gn8.add(sphere2);

	const gn11 = new GroupNode(new Translation(new Vector(-2.2, 0, 0, 0)));
	const pyramid2 = new PyramidNode(new Vector(1, 2, 1, 1), new Vector(1, 0, 0, 1), new Vector(0, 0, .8, 1));
	gn8.add(gn11);
	gn11.add(pyramid2);
	otherAnimationNodes.push(
		new RotationNode(gn8, new Vector(0, 1, 0, 0), 30));

	const gn9 = new GroupNode(new Translation(new Vector(-2, 0, 0, 0)));
	rootNode.add(gn9);

	const gn10 = new GroupNode(new Translation(new Vector(-2, 0, 0, 0)));
	gn3.add(gn10);

	const lightNode1 = new GroupNode(new Translation(new Vector(-1, -2, 9, 0)));
	const light1 = new LightNode();
	gn9.add(lightNode1);
	lightNode1.add(light1);

	otherAnimationNodes.push(
		new RotationNode(gn9, new Vector(0, 0, 1, 0), 20));

	const lightNode2 = new GroupNode(new Translation(new Vector(1, -1, 2.5, 0)));
	const light2 = new LightNode();
	gn5.add(lightNode2);
	lightNode2.add(light2);
	otherAnimationNodes.push(
		new RotationNode(gn5, new Vector(0, 1, 0, 0), 20));

	const lightNode3 = new GroupNode(new Translation(new Vector(6, -1, 1, 0)));
	const light3 = new LightNode();
	gn10.add(lightNode3)
	lightNode3.add(light3);

	otherAnimationNodes.push(
		new RotationNode(gn10, new Vector(1, 0, 0, 0), 20));

	const cameraNode = new GroupNode(new Translation(new Vector(2, 0, 15, 0)));
	const camera1 = new CameraNode(true);
	rootNode.add(cameraNode);
	cameraNode.add(camera1);

	const cameraNode2 = new GroupNode(new Translation(new Vector(0, 1.5, 2.5, 0)));
	const camera2 = new CameraNode(false);
	gn6.add(cameraNode2);
	cameraNode2.add(camera2);

	//alle cams in array sammeln
	cameraNodes.push(camera1)
	cameraNodes.push(camera2);

	freeFlightAnimationNodes.push(
		//FahrAnimationNodes
		new TranslationNode(cameraNode, new Vector(-50, 0, 0, 0)),
		new TranslationNode(cameraNode, new Vector(50, 0, 0, 0)),
		new TranslationNode(cameraNode, new Vector(0, 0, -50, 0)),
		new TranslationNode(cameraNode, new Vector(0, 0, 50, 0)),
		new TranslationNode(cameraNode, new Vector(0, 50, 0, 0)),
		new TranslationNode(cameraNode, new Vector(0, -50, 0, 0)),
		new RotationNode(cameraNode, new Vector(0, 1, 0, 0), 20),
		new RotationNode(cameraNode, new Vector(0, 1, 0, 0), -20),
		new RotationNode(cameraNode, new Vector(1, 0, 0, 0), 20),
		new RotationNode(cameraNode, new Vector(1, 0, 0, 0), -20));

	//Fahranimationen und ControlledAnimationNodes defaultmäßig aus, nur bei keydown-events
	freeFlightAnimationNodes.forEach(el => el.turnOffActive());
	controlledAnimationNodes.forEach(el => el.turnOffActive());

	//Alle Animationen zusammenführen
	animationNodes = {
		freeFlightNodes: freeFlightAnimationNodes,
		controlledAnimationNodes: controlledAnimationNodes,
		otherAnimationNodes: otherAnimationNodes
	}

	setup(rootNode);

	function setup(rootNode: GroupNode) {
		// setup for rendering
		setupVisitor = new RasterSetupVisitor(gl);
		setupVisitor.setup(rootNode);
		firstTraversalVisitorRaster = new FirstTraversalVisitorRaster();
		firstTraversalVisitorRay = new FirstTraversalVisitorRay();
		visitorRasteriser = new RasterVisitor(gl, phongShader, textureShader, setupVisitor.objects);
		visitorRaytracer = new RayVisitor(ctx2d, canvasRaytracer.width, canvasRaytracer.height);
	}

	function simulate(deltaT: number) {
		for (let animationNode of animationNodes.freeFlightNodes) {
			animationNode.simulate(deltaT);
		}
		for (let animationNode of animationNodes.controlledAnimationNodes) {
			animationNode.simulate(deltaT);
		}
		for (let animationNode of animationNodes.otherAnimationNodes) {
			animationNode.simulate(deltaT);
		}
	}

	let lastTimestamp = performance.now();

	function animate(timestamp: number) {
		simulate(timestamp - lastTimestamp);
		if (rendertype === "rasteriser") visitorRasteriser.render(rootNode, null, null, phongValues, firstTraversalVisitorRaster);
		else if (rendertype === "raytracer") visitorRaytracer.render(rootNode, null, null, phongValues, firstTraversalVisitorRay);

		lastTimestamp = timestamp;
		window.requestAnimationFrame(animate);
	}

	Promise.all(
		[phongShader.load(), textureShader.load()]
	).then(x =>
		window.requestAnimationFrame(animate)
	);

	//SLIDERS
	const kA = document.getElementById("kA") as HTMLInputElement;
	kA.onchange = function () {
		phongValues.kA = Number(kA.value);
	}
	const kD = document.getElementById("kD") as HTMLInputElement;
	kD.onchange = function () {
		phongValues.kD = Number(kD.value);
	}
	const kS = document.getElementById("kS") as HTMLInputElement;
	kS.onchange = function () {
		phongValues.kS = Number(kS.value);
	}
	const shininessElement = document.getElementById("shininess") as HTMLInputElement;
	shininessElement.onchange = function () {
		phongValues.shininess = Number(shininessElement.value);
	}

	//RENDERER-BUTTONS
	let rasterizer_b = document.getElementById('rasterizer_b');
	let raytracer_b = document.getElementById('raytracer_b');

	rasterizer_b.addEventListener('click', function (event) {
		if (rasterizer_b.className === "btn btn-info") {

		} else {
			rendertype = "rasteriser";

			canvasRasteriser.style.zIndex = "1";
			canvasRasteriser.style.visibility = "visible";

			canvasRaytracer.style.zIndex = "0";
			canvasRaytracer.style.visibility = "hidden";

			rasterizer_b.className = "btn btn-info";
			raytracer_b.className = "btn btn-outline-info";
		}
	});

	raytracer_b.addEventListener('click', function (event) {
		if (raytracer_b.className === "btn btn-info") {

		} else {
			rendertype = "raytracer";

			canvasRasteriser.style.zIndex = "0";
			canvasRasteriser.style.visibility = "hidden";

			canvasRaytracer.style.zIndex = "1";
			canvasRaytracer.style.visibility = "visible";

			rasterizer_b.className = "btn btn-outline-info";
			raytracer_b.className = "btn btn-info";
		}
	});

	//IMPORT-OBJ-Files
	let bunnyObjButton = document.getElementById('bunnyObjButton');
	bunnyObjButton.onclick = () => {
		fetch("./obj/stanford_bunny.obj"
		).then(resp => resp.text()
		).then(resp => parseObjData(resp));
	}

	let armadilloObjButton = document.getElementById('armadilloObjButton');
	armadilloObjButton.onclick = () => {
		fetch("./obj/armadillo.obj"
		).then(resp => resp.text()
		).then(resp => parseObjData(resp));
	}

	let tyraObjButton = document.getElementById('tyraObjButton');
	tyraObjButton.onclick = () => {
		fetch("./obj/tyra.obj"
		).then(resp => resp.text()
		).then(resp => parseObjData(resp));
	}

	function parseObjData(string: any) {
		let vertices = [];
		let normals = [];
		let vertex_indices = [];
		let normal_indices = [];

		let lines = string.split('\n');

		let lineValues;
		let identifier;
		for (let i = 0; i < lines.length; i++) {
			lineValues = lines[i].split(' ');
			//remove whitespaces
			lineValues = lineValues.filter((el: any) => el);
			//e.g. v/f/vn
			identifier = lineValues[0];

			switch (identifier) {
				case "v":
					vertices.push(parseFloat(lineValues[1]), parseFloat(lineValues[2]), parseFloat(lineValues[3]));
					break;
				case "vn":
					normals.push(parseFloat(lineValues[1]), parseFloat(lineValues[2]), parseFloat(lineValues[3]));
					break;
				case "f":
					//vertex and normal indices
					if (lineValues[1].includes('//')) {
						vertex_indices.push(parseInt(lineValues[1].split('//')[0]) - 1, parseInt(lineValues[2].split('//')[0]) - 1, parseInt(lineValues[3].split('//')[0]) - 1);
						normal_indices.push(parseInt(lineValues[1].split('//')[1]) - 1, parseInt(lineValues[2].split('//')[1]) - 1, parseInt(lineValues[3].split('//')[1]) - 1);
					}
					//only vertex indices
					else {
						vertex_indices.push(parseInt(lineValues[1]) - 1, parseInt(lineValues[2]) - 1, parseInt(lineValues[3]) - 1);
					}
					break;
				default:
			}
		}
		const customShapeNode = new CustomShapeNode(vertices, normals, vertex_indices, normal_indices, new Vector(Math.random(), Math.random(), Math.random(), 1));

		//check if already a customShape added, if true replace the old one
		let alreadyAddedCustomShape = false;
		if (rootNode.childNodes[rootNode.childNodes.length - 1] instanceof GroupNode) {
			let groupNode = rootNode.childNodes[rootNode.childNodes.length - 1] as GroupNode;
			if (groupNode.childNodes.length > 0) {
				if (groupNode.childNodes[groupNode.childNodes.length - 1] instanceof CustomShapeNode) {
					groupNode.childNodes[groupNode.childNodes.length - 1] = customShapeNode;
					alreadyAddedCustomShape = true;
				}
			}
		}
		if (!alreadyAddedCustomShape) {
			const gnCustomShape = new GroupNode(new Translation(new Vector(-2, 0, 6, 0)));
			rootNode.add(gnCustomShape);
			gnCustomShape.add(customShapeNode);
		}
		setupVisitor.setup(rootNode);
	}

	//DOWNLOAD-SCENEGRAPH
	let downloadButton = document.getElementById('downloadSceneButton');
	downloadButton.onclick = () => {
		//save Scene-Information
		scene = {
			scenegraph: rootNode,
			animationNodes: animationNodes,
			phongValues: phongValues
		}

		//https://stackoverflow.com/questions/34156282/how-do-i-save-json-to-local-text-file
		var a = document.createElement("a");
		var file = new Blob([JSON.stringify(scene)], {type: 'text/plain'});
		a.href = URL.createObjectURL(file);
		a.download = 'scene';
		a.click();
	}

	//IMPORT-SCENEGRAPH
	let importButton = document.getElementById('importSceneButton');
	importButton.addEventListener("change", handleFiles, false);

	//SampleScene
	let sampleSceneButton = document.getElementById('sampleSceneButton');
	sampleSceneButton.onclick = () => {
		fetch("./sample_scene/sample_scene.json"
		).then(resp => resp.json()
		).then(resp => parseSceneData(resp));
	}

	async function handleFiles() {
		let file = await this.files[0].text();
		let jsonFile = JSON.parse(file);
		parseSceneData(jsonFile);
	}

	function parseSceneData(file: any) {
		//reset cameraNodes
		cameraNodes = [];

		//transform Matrix for rootNode
		let transform = parseTransformation(file.scenegraph.GroupNode.transform);

		//save all GroupNodes to search for IDs for GroupNode related AnimationNodes
		let allGroupNodes: GroupNode[] = [];

		//childNodes for rootNode
		let childNodes = parseChildNodes(file.scenegraph.GroupNode.childNodes);

		//initialize rootNode and push childNodes
		rootNode = new GroupNode(transform, file.scenegraph.GroupNode.guID);
		childNodes.forEach(el => rootNode.add(el));
		allGroupNodes.push(rootNode);

		//import Animation Nodes
		animationNodes.freeFlightNodes = parseAnimations(file.animationNodes.freeFlightNodes);
		animationNodes.controlledAnimationNodes = parseAnimations(file.animationNodes.controlledAnimationNodes);
		animationNodes.otherAnimationNodes = parseAnimations(file.animationNodes.otherAnimationNodes);

		//Fahranimationen und ControlledAnimationNodes defaultmäßig aus, nur bei keydown-events
		animationNodes.freeFlightNodes.forEach(el => el.turnOffActive());
		animationNodes.controlledAnimationNodes.forEach(function (el) {
			if (!el.forceActive) el.turnOffActive();
		});

		//import PhongValues
		phongValues = file.phongValues;
		const kA = document.getElementById("kA") as HTMLInputElement;
		kA.value = file.phongValues.kA;
		const kD = document.getElementById("kD") as HTMLInputElement;
		kD.value = file.phongValues.kD;
		const kS = document.getElementById("kS") as HTMLInputElement;
		kS.value = file.phongValues.kS;
		const shininess = document.getElementById("shininess") as HTMLInputElement;
		shininess.value = file.phongValues.shininess;


		//one time setup before first render
		setup(rootNode);

		function parseTransformation(transform: any): Transformation {
			let result;

			if (transform.hasOwnProperty("Translation")) {
				let matrix = new Matrix(transform.Translation.matrix.data);
				let inverse = new Matrix(transform.Translation.inverse.data);
				result = new Translation(null, matrix, inverse);

			} else if (transform.hasOwnProperty("Rotation")) {
				let matrix = new Matrix(transform.Rotation.matrix.data);
				let inverse = new Matrix(transform.Rotation.inverse.data);
				result = new Rotation(null, null, matrix, inverse);

			} else if (transform.hasOwnProperty("Scaling")) {
				let matrix = new Matrix(transform.Scaling.matrix.data);
				let inverse = new Matrix(transform.Scaling.inverse.data);
				result = new Scaling(null, matrix, inverse);
			}

			return result;
		}

		function parseChildNodes(childNodes: any): any[] {
			let result: any[] = [];

			for (let i = 0; i < childNodes.length; i++) {
				if (childNodes[i].hasOwnProperty("GroupNode")) {
					let transform = parseTransformation(childNodes[i].GroupNode.transform);
					let newChildNodes = parseChildNodes(childNodes[i].GroupNode.childNodes);
					let groupNode = new GroupNode(transform, childNodes[i].GroupNode.guID);
					newChildNodes.forEach(el => groupNode.add(el));
					result.push(groupNode);
					allGroupNodes.push(groupNode);

				} else if (childNodes[i].hasOwnProperty("CameraNode")) {
					let camera = new CameraNode(childNodes[i].CameraNode.active);
					result.push(camera);
					cameraNodes.push(camera);

				} else if (childNodes[i].hasOwnProperty("LightNode")) {
					result.push(new LightNode());

				} else if (childNodes[i].hasOwnProperty("SphereNode")) {
					let vector = new Vector(childNodes[i].SphereNode.color.data[0], childNodes[i].SphereNode.color.data[1], childNodes[i].SphereNode.color.data[2], childNodes[i].SphereNode.color.data[3]);
					result.push(new SphereNode(vector));

				} else if (childNodes[i].hasOwnProperty("AABoxNode")) {
					let color1 = new Vector(childNodes[i].AABoxNode.color1.data[0], childNodes[i].AABoxNode.color1.data[1], childNodes[i].AABoxNode.color1.data[2], childNodes[i].AABoxNode.color1.data[3]);
					let color2 = new Vector(childNodes[i].AABoxNode.color2.data[0], childNodes[i].AABoxNode.color2.data[1], childNodes[i].AABoxNode.color2.data[2], childNodes[i].AABoxNode.color2.data[3]);
					result.push(new AABoxNode(color1, color2, childNodes[i].AABoxNode.outside));

				} else if (childNodes[i].hasOwnProperty("TextureBoxNode")) {
					result.push(new TextureBoxNode(childNodes[i].TextureBoxNode.texture, childNodes[i].TextureBoxNode.normalMap));

				} else if (childNodes[i].hasOwnProperty("PyramidNode")) {
					let area = new Vector(childNodes[i].PyramidNode.area.data[0], childNodes[i].PyramidNode.area.data[1], childNodes[i].PyramidNode.area.data[2], childNodes[i].PyramidNode.area.data[3]);
					let color1 = new Vector(childNodes[i].PyramidNode.color1.data[0], childNodes[i].PyramidNode.color1.data[1], childNodes[i].PyramidNode.color1.data[2], childNodes[i].PyramidNode.color1.data[3]);
					let color2 = new Vector(childNodes[i].PyramidNode.color2.data[0], childNodes[i].PyramidNode.color2.data[1], childNodes[i].PyramidNode.color2.data[2], childNodes[i].PyramidNode.color2.data[3]);
					result.push(new PyramidNode(area, color1, color2));

				} else if (childNodes[i].hasOwnProperty("CustomShapeNode")) {
					let color = new Vector(childNodes[i].CustomShapeNode.color.data[0], childNodes[i].CustomShapeNode.color.data[1], childNodes[i].CustomShapeNode.color.data[2], childNodes[i].CustomShapeNode.color.data[3]);
					result.push(new CustomShapeNode(childNodes[i].CustomShapeNode.vertices, childNodes[i].CustomShapeNode.normals, childNodes[i].CustomShapeNode.vertex_indices, childNodes[i].CustomShapeNode.normal_indices, color));
				}
			}
			return result;
		}

		function parseAnimations(animationNodes: any): any[] {
			let result: any[] = [];

			for (let i = 0; i < animationNodes.length; i++) {
				if (animationNodes[i].hasOwnProperty("JumperNode")) {
					let groupNode = findGroupNode(animationNodes[i].JumperNode.guID);
					result.push(new JumperNode(groupNode, animationNodes[i].JumperNode.height, animationNodes[i].JumperNode.speed, animationNodes[i].JumperNode.groupNodeYValue, animationNodes[i].JumperNode.forceActive));

				} else if (animationNodes[i].hasOwnProperty("ScalingNode")) {
					let groupNode = findGroupNode(animationNodes[i].ScalingNode.guID);
					result.push(new ScalingNode(groupNode, animationNodes[i].ScalingNode.scaleUp, animationNodes[i].ScalingNode.groupNodeSizeYDirection));

				} else if (animationNodes[i].hasOwnProperty("TranslationNode")) {
					let groupNode = findGroupNode(animationNodes[i].TranslationNode.guID);
					let translation = new Vector(animationNodes[i].TranslationNode.translation.data[0], animationNodes[i].TranslationNode.translation.data[1], animationNodes[i].TranslationNode.translation.data[2], animationNodes[i].TranslationNode.translation.data[3]);
					result.push(new TranslationNode(groupNode, translation));

				} else if (animationNodes[i].hasOwnProperty("RotationNode")) {
					let groupNode = findGroupNode(animationNodes[i].RotationNode.guID);
					let axis = new Vector(animationNodes[i].RotationNode.axis.data[0], animationNodes[i].RotationNode.axis.data[1], animationNodes[i].RotationNode.axis.data[2], animationNodes[i].RotationNode.axis.data[3]);
					result.push(new RotationNode(groupNode, axis, animationNodes[i].RotationNode.angle));
				}
			}

			return result;
		}

		function findGroupNode(guID: string): GroupNode {
			let result: GroupNode;
			allGroupNodes.forEach(function (el) {
				if (el.guID == guID) {
					result = el;
				}
			});
			if (!result) console.log("NO GROUP NODE FOUND!")
			return result;
		}
	}

	//EVENT-LISTENERS
	window.addEventListener('keydown', function (event) {
		switch (event.key) {
			//switch active camera
			case "c":
				cameraNodes.forEach(function (el) {
					if (el.active) el.setActiveStatus(false);
					else el.setActiveStatus(true);
				})
				break;
			//switch rendertype
			case "k":
				if (rendertype === "rasteriser") {
					rendertype = "raytracer";

					rasterizer_b.className = "btn btn-outline-info";
					raytracer_b.className = "btn btn-info";

					canvasRasteriser.style.zIndex = "0";
					canvasRasteriser.style.visibility = "hidden";

					canvasRaytracer.style.zIndex = "1";
					canvasRaytracer.style.visibility = "visible";
				} else {
					rendertype = "rasteriser";

					rasterizer_b.className = "btn btn-info";
					raytracer_b.className = "btn btn-outline-info";

					canvasRasteriser.style.zIndex = "1";
					canvasRasteriser.style.visibility = "visible";

					canvasRaytracer.style.zIndex = "0";
					canvasRaytracer.style.visibility = "hidden";
				}
				break;
			//controlledAnimationNode[0]
			case "u":
				animationNodes.controlledAnimationNodes[0].turnOnActive();
				break;
			//JumperNode
			case "i":
				animationNodes.controlledAnimationNodes[1].turnOnActive();
				break;
			//nach links fahren
			case "a":
				animationNodes.freeFlightNodes[0].turnOnActive();
				break;
			//nach rechts fahren
			case "d":
				animationNodes.freeFlightNodes[1].turnOnActive();
				break;
			//nach vorne fahren
			case "w":
				animationNodes.freeFlightNodes[2].turnOnActive();
				break;
			//nach hinten fahren
			case "s":
				animationNodes.freeFlightNodes[3].turnOnActive();
				break;
			//nach oben fahren
			case "e":
				animationNodes.freeFlightNodes[4].turnOnActive();
				break;
			//nach unten fahren
			case "q":
				animationNodes.freeFlightNodes[5].turnOnActive();
				break;
			//nach links drehen
			case "ArrowLeft":
				animationNodes.freeFlightNodes[6].turnOnActive();
				break;
			//nach rechts drehen
			case "ArrowRight":
				animationNodes.freeFlightNodes[7].turnOnActive();
				break;
			//nach oben drehen
			case "ArrowUp":
				animationNodes.freeFlightNodes[8].turnOnActive();
				break;
			//nach unten drehen
			case "ArrowDown":
				animationNodes.freeFlightNodes[9].turnOnActive();
				break;
		}
	});

	window.addEventListener('keyup', function (event) {
		switch (event.key) {
			//controlledAnimationNode[0]
			case "u":
				animationNodes.controlledAnimationNodes[0].turnOffActive();
				break;
			//nach links fahren
			case "a":
				animationNodes.freeFlightNodes[0].turnOffActive();
				break;
			//nach rechts fahren
			case "d":
				animationNodes.freeFlightNodes[1].turnOffActive();
				break;
			//nach vorne fahren
			case "w":
				animationNodes.freeFlightNodes[2].turnOffActive();
				break;
			//nach hinten fahren
			case "s":
				animationNodes.freeFlightNodes[3].turnOffActive();
				break;
			//nach oben fahren
			case "e":
				animationNodes.freeFlightNodes[4].turnOffActive();
				break;
			//nach unten fahren
			case "q":
				animationNodes.freeFlightNodes[5].turnOffActive();
				break;
			//nach links drehen
			case "ArrowLeft":
				animationNodes.freeFlightNodes[6].turnOffActive();
				break;
			//nach rechts drehen
			case "ArrowRight":
				animationNodes.freeFlightNodes[7].turnOffActive();
				break;
			//nach oben drehen
			case "ArrowUp":
				animationNodes.freeFlightNodes[8].turnOffActive();
				break;
			//nach unten drehen
			case "ArrowDown":
				animationNodes.freeFlightNodes[9].turnOffActive();
				break;
		}
	});

	canvasRasteriser.addEventListener('mousedown', (event) => {
		let mx = event.offsetX;
		let my = event.offsetY;
		visitorRasteriser.castRayFromMouse(mx, my);
	});

	canvasRaytracer.addEventListener('mousedown', (event) => {
		let mx = event.offsetX;
		let my = event.offsetY;
		visitorRaytracer.castRayFromMouse(mx, my);
	});
});


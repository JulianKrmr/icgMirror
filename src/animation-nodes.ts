import Vector from './vector';
import { GroupNode } from './nodes';
import {Rotation, Scaling, SQT, Translation} from './transformation';
import Quaternion from './quaternion';

/**
 * Class representing an Animation
 */
export class AnimationNode {
  /**
   * Describes if the animation is running
   */
  active: boolean;

  /**
   * Creates a new AnimationNode
   * @param groupNode The GroupNode to attach to
   */
  constructor(public groupNode: GroupNode) {
    this.active = true;
  }

  /**
   * Toggles the active state of the animation node
   */
  toggleActive() {
    this.active = !this.active;
  }

  turnOnActive() {
    this.active = true;
  }

  turnOffActive() {
    this.active = false;
  }
}


/**
 * Class representing a Jumping Animation
 * @extends AnimationNode
 */
export class JumperNode extends AnimationNode {

  /**
   * The height to jump
   */
  height: number;

  /**
   * The speed for jumping
   */
  speed: number;

  /**
   * The translation vector
   */
  vector: Vector;

  up: boolean;//helper
  down: boolean;//helper

  /**
   * initial YValue of the groupnodes' transformation matrix
   */
  groupNodeYValue: number;

  guID: string;
  forceActive: boolean;

  /**
   * Creates a new JumperNode
   * @param groupNode The group node to attach to
   * @param height only positive integers
   * @param speed The speed for jumping
   * @param groupNodeYValue
   * @param forceActive to set the active state to true after importing if animation was still running
   */
  constructor(groupNode: GroupNode, height: number, speed: number, groupNodeYValue?: number, forceActive?: boolean) {
    super(groupNode);
    this.height = height;
    this.speed = speed;
    this.up = true;
    this.down = false;
    this.vector = new Vector(0,  speed, 0, 0);

    if (!groupNodeYValue) {
      this.groupNodeYValue = groupNode.transform.getMatrix().getVal(1, 3);
    }
    else this.groupNodeYValue = groupNodeYValue;

    if (forceActive) this.forceActive = forceActive;

    this.guID = groupNode.guID;
  }

  /**
   * Advances the animation by deltaT
   * @param deltaT The time difference, the animation is advanced by
   */
  simulate(deltaT: number) {
    if (this.active) {
      let matrix = this.groupNode.transform.getMatrix();
      let inverse = this.groupNode.transform.getInverseMatrix();

      let difference = matrix.getVal(1, 3) - this.groupNodeYValue;

      if (!this.down && difference < this.height) {
        this.up = true;
      }
      else {
        this.up = false;
        this.down = true;
      }
      if (!this.up && difference >= 0) {
        this.down = true;
      }
      else {
        if (this.down && difference <= 0) {
          this.turnOffActive();
        }
        this.down = false;
        this.up = true;
      }

      if (this.up) this.vector.y = this.speed;
      else this.vector.y = -this.speed;

      let deltaVector = this.vector.mul(0.0001 * deltaT);
      let translation = new Translation(deltaVector);
      translation.matrix = matrix.mul(translation.getMatrix());
      translation.inverse = translation.getInverseMatrix().mul(inverse);
      this.groupNode.transform = translation;
    }
  }

  toJSON() {
    return {
      "JumperNode": {
        "height": this.height,
        "speed": this.speed,
        "groupNodeYValue": this.groupNodeYValue,
        "forceActive": this.active,
        "guID": this.guID
      }
    }
  }
}

/**
 * Class representing a Scaling Animation
 * @extends AnimationNode
 */
export class ScalingNode extends AnimationNode {
  /**
   * translation The translation vector that shall be expressed by the matrix
   */
  vector: Vector

  /**
   * The initial x Value of the Size of the groupnode
   * (could also use y or z value)
   */
  groupNodeSizeYDirection: number;

  /**
   * Determines if growing or shrinking
   */
  limit: number;

  grow: boolean; // helper
  shrink: boolean; // helper

  scaleUp: boolean;//only used for toJSON()

  guID: string;

  /**
   * Creates a new ScalingNode, scales to triple/third size, scales back -> repeat
   * @param groupNode The group node to attach to
   * @param scaleUp scaleUp or down
   */
  constructor(groupNode: GroupNode, scaleUp: boolean, groupNodeSizeYDirection?: number) {
    super(groupNode);
    this.scaleUp = scaleUp;
    this.vector = new Vector(1, 1, 1, 1);

    if (!groupNodeSizeYDirection) {
      this.groupNodeSizeYDirection = groupNode.transform.getMatrix().getVal(1, 1);
    }
    else this.groupNodeSizeYDirection = groupNodeSizeYDirection;

    this.guID = groupNode.guID;

    if (scaleUp) {
      this.grow = true;
      this.shrink = false;
      this.limit = 3;
    }
    else {
      this.grow = false;
      this.shrink = true;
      this.limit = 1;
    }
  }

  /**
   * Advances the animation by deltaT
   * @param deltaT The time difference, the animation is advanced by
   */
  simulate(deltaT: number) {
    // change the matrix of the attached
    // group node to reflect a translation
    if (this.active) {
      let matrix = this.groupNode.transform.getMatrix();
      let inverse = this.groupNode.transform.getInverseMatrix();

      let difference = matrix.getVal(1, 1) / this.groupNodeSizeYDirection;

      if (!this.shrink && difference < this.limit) {
        this.grow = true;
      }
      else {
        this.grow = false;
        this.shrink = true;
      }
      if (!this.grow && difference >= this.limit / 3) {
        this.shrink = true;
      }
      else {
        this.shrink = false;
        this.grow = true;
      }

      let deltaHelper = new Vector(1, 1, 1, 1).mul(0.0005 * deltaT);
      let deltaVector;
      if (this.grow) deltaVector = this.vector.add(deltaHelper);
      else deltaVector = this.vector.sub(deltaHelper);

      let scaling = new Scaling(deltaVector);
      scaling.matrix = matrix.mul(scaling.getMatrix());
      scaling.inverse = scaling.inverse.mul(inverse);
      this.groupNode.transform = scaling;
    }
  }

  toJSON() {
    return {
      "ScalingNode": {
        "scaleUp": this.scaleUp,
        "groupNodeSizeYDirection": this.groupNodeSizeYDirection,
        "guID": this.guID
      }
    }
  }
}

/**
 * Class representing a Translation Animation
 * @extends AnimationNode
 */
export class TranslationNode extends AnimationNode {
  /**
   * translation The translation vector that shall be expressed by the matrix
   */
  vector: Vector

  guID: string;

  /**
   * Creates a new TranslationNode
   * @param groupNode The group node to attach to
   * @param translation
   */
  constructor(groupNode: GroupNode, translation: Vector) {
    super(groupNode);
    this.vector = translation;
    this.guID = groupNode.guID;
  }

  /**
   * Advances the animation by deltaT
   * @param deltaT The time difference, the animation is advanced by
   */
  simulate(deltaT: number) {
    // change the matrix of the attached
    // group node to reflect a translation
    if (this.active) {
      let matrix = this.groupNode.transform.getMatrix();
      let inverse = this.groupNode.transform.getInverseMatrix();

      let deltaVector = this.vector.mul(0.0001 * deltaT);
      let translation = new Translation(deltaVector);
      translation.matrix = matrix.mul(translation.getMatrix());
      translation.inverse = translation.getInverseMatrix().mul(inverse);
      this.groupNode.transform = translation;
    }
  }

  toJSON() {
    return {
      "TranslationNode": {
        "translation": this.vector.toJSON(),
        "guID": this.guID
      }
    }
  }
}

/**
 * Class representing a Rotation Animation
 * @extends AnimationNode
 */
export class RotationNode extends AnimationNode {
  /**
   * The absolute angle of the rotation
   */
  angle: number;
  /**
   * The vector to rotate around
   */
  axis: Vector;

  guID: string;

  /**
   * Creates a new RotationNode
   * @param groupNode The group node to attach to
   * @param axis The axis to rotate around
   * @param angle The amount of rotation
   */
  constructor(groupNode: GroupNode, axis: Vector, angle: number) {
    super(groupNode);
    this.angle = angle;
    this.axis = axis;

    this.guID = groupNode.guID;
  }

  /**
   * Advances the animation by deltaT
   * @param deltaT The time difference, the animation is advanced by
   */
  simulate(deltaT: number) {
    // change the matrix of the attached
    // group node to reflect a rotation
    if (this.active) {
      //max-value for deltaT ensures, that the rotation of the free-flight-camera in the raytracer is still easy to use
      if (deltaT > 200) deltaT = 200;

      let matrix = this.groupNode.transform.getMatrix();
      let inverse = this.groupNode.transform.getInverseMatrix();

      let rotation = new Rotation(this.axis, 0.0001 * this.angle * deltaT);
      rotation.matrix = matrix.mul(rotation.getMatrix());
      rotation.inverse = rotation.getInverseMatrix().mul(inverse);
      this.groupNode.transform = rotation;
    }
  }

  toJSON() {
    return {
      "RotationNode": {
        "axis": this.axis.toJSON(),
        "angle": this.angle,
        "guID": this.guID
      }
    }
  }
}

/**
 * Class representing a Rotation Animation
 * @extends AnimationNode
 */
export class SlerpNode extends AnimationNode {
  /**
   * The time
   */
  t: number;

  /**
   * The rotations to interpolate between
   */
  rotations: [Quaternion, Quaternion];

  /**
   * Creates a new RotationNode
   * @param groupNode The group node to attach to
   * @param axis The axis to rotate around
   */
  constructor(groupNode: GroupNode, rotation1: Quaternion, rotation2: Quaternion) {
    super(groupNode);
    this.rotations = [rotation1, rotation2];
    this.t = 0;
  }

  /**
   * Advances the animation by deltaT
   * @param deltaT The time difference, the animation is advanced by
   */
  simulate(deltaT: number) {
    if (this.active) {
      this.t += 0.001 * deltaT;
      const rot = this.rotations[0].slerp(this.rotations[1], (Math.sin(this.t) + 1) / 2);
      (this.groupNode.transform as SQT).rotation = rot;
    }
  }
}
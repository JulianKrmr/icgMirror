import Vector from "./vector";
import { GroupNode } from "./nodes";
import { Rotation, SQT } from "./transformation";
import Quaternion from "./quaternion";

/**
 * Class representing an Animation
 */
class AnimationNode {
  /**
   * Describes if the animation is running
   */
  active: boolean;

  /**
   * Creates a new AnimationNode
   * @param groupNode The GroupNode to attach to
   */
  constructor(public groupNode: GroupNode) {
    this.active = false;
  }

  /**
   * Toggles the active state of the animation node
   */
  toggleActive() {
    this.active = !this.active;
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

  /**
   * Creates a new RotationNode
   * @param groupNode The group node to attach to
   * @param axis The axis to rotate around
   */
  constructor(groupNode: GroupNode, axis: Vector) {
    super(groupNode);
    this.angle = 0;
    this.axis = axis;
  }

  /**
   * Advances the animation by deltaT
   * @param deltaT The time difference, the animation is advanced by
   */
  simulate(deltaT: number) {
    if (this.active) {
      //TODO ADD COMMENTS ABOUT THIS PROCESS
      this.angle = Math.PI * 4;

      const matrix = this.groupNode.transform.getMatrix();
      const inverse = this.groupNode.transform.getInverseMatrix();
      let rotation = new Rotation(this.axis, 0.0001 * this.angle * deltaT);
      rotation.matrix = matrix.mul(rotation.getMatrix());
      rotation.inverse = rotation.getInverseMatrix().mul(inverse);
      this.groupNode.transform = rotation;
    }

    // change the matrix of the attached
    // group node to reflect a rotation
    // TODO
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
  constructor(
    groupNode: GroupNode,
    rotation1: Quaternion,
    rotation2: Quaternion
  ) {
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
      const rot = this.rotations[0].slerp(
        this.rotations[1],
        (Math.sin(this.t) + 1) / 2
      );
      (this.groupNode.transform as SQT).rotation = rot;
    }
  }
}

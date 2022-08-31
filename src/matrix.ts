import Vector from "./vector";

/**
 * Class representing a 4x4 Matrix
 */
export default class Matrix {
  /**
   * Data representing the matrix values
   */
  data: Float32Array;

  /**
   * Constructor of the matrix. Expects an array in row-major layout. Saves the data as column major internally.
   * @param mat Matrix values row major
   */
  constructor(mat: Array<number>) {
    this.data = new Float32Array(16);
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++) {
        this.data[row * 4 + col] = mat[col * 4 + row];
      }
    }
  }

  /**
   * Returns the value of the matrix at position row, col
   * @param row The value's row
   * @param col The value's column
   * @return The requested value
   */
  getVal(row: number, col: number): number {
    return this.data[col * 4 + row];
  }

  /**
   * Sets the value of the matrix at position row, col
   * @param row The value's row
   * @param val The value to set to
   * @param col The value's column
   */
  setVal(row: number, col: number, val: number) {
    this.data[col * 4 + row] = val;
  }

  /**
   * Returns a matrix that represents a translation
   * @param translation The translation vector that shall be expressed by the matrix
   * @return The resulting translation matrix
   */
  static translation(translation: Vector): Matrix {
    let newMatrix = this.identity();
    newMatrix.setVal(0, 3, translation.x);
    newMatrix.setVal(1, 3, translation.y);
    newMatrix.setVal(2, 3, translation.z);
    return newMatrix;
  }

  /**
   * Returns a matrix that represents a rotation. The rotation axis is either the x, y or z axis (either x, y, z is 1).
   * @param axis The axis to rotate around
   * @param angle The angle to rotate
   * @return The resulting rotation matrix
   */
  static rotation(axis: Vector, angle: number): Matrix {
    let newMatrix = this.identity();
    for (let row = 0; row < 4; row++) {
      let cos = Math.cos(angle);
      let sin = Math.sin(angle);

      if (axis.x == 1) {
        newMatrix.setVal(2, 2, cos);
        newMatrix.setVal(1, 2, -1 * sin);
        newMatrix.setVal(2, 1, sin);
        newMatrix.setVal(1, 1, cos);
      } else if (axis.y == 1) {
        newMatrix.setVal(0, 0, cos);
        newMatrix.setVal(0, 2, sin);
        newMatrix.setVal(2, 0, -1 * sin);
        newMatrix.setVal(2, 2, cos);
      } else if (axis.z == 1) {
        newMatrix.setVal(0, 0, cos);
        newMatrix.setVal(0, 1, -1 * sin);
        newMatrix.setVal(1, 0, sin);
        newMatrix.setVal(1, 1, cos);
      }
    }
    return newMatrix;
  }

  /**
   * Returns a matrix that represents a scaling
   * @param scale The amount to scale in each direction
   * @return The resulting scaling matrix
   */
  static scaling(scale: Vector): Matrix {
    var newMatrix = this.identity();
    newMatrix.setVal(0, 0, scale.x);
    newMatrix.setVal(1, 1, scale.y);
    newMatrix.setVal(2, 2, scale.z);
    return newMatrix;
  }

  /**
   * Constructs a lookat matrix
   * @param eye The position of the viewer
   * @param center The position to look at
   * @param up The up direction
   * @return The resulting lookat matrix
   */
  static lookat(eye: Vector, center: Vector, up: Vector): Matrix {
    let result = Matrix.identity();
    var f = center.sub(eye).div(center.sub(eye).length).normalize();
    var s = f.cross(up).normalize();
    var u = s.cross(f).normalize();

    result.setVal(0, 0, s.x);
    result.setVal(0, 1, s.y);
    result.setVal(0, 2, s.z);
    result.setVal(1, 0, u.x);
    result.setVal(1, 1, u.y);
    result.setVal(1, 2, u.z);
    result.setVal(2, 0, -f.x);
    result.setVal(2, 1, -f.y);
    result.setVal(2, 2, -f.z);

    let helpMatrix = Matrix.identity();
    helpMatrix.setVal(0, 3, -eye.x);
    helpMatrix.setVal(1, 3, -eye.y);
    helpMatrix.setVal(2, 3, -eye.z);

    return result.mul(helpMatrix);
  }

  /**
   * Constructs a new matrix that represents a projection normalisation transformation
   * @param left Camera-space left value of lower near point
   * @param right Camera-space right value of upper right far point
   * @param bottom Camera-space bottom value of lower lower near point
   * @param top Camera-space top value of upper right far point
   * @param near Camera-space near value of lower lower near point
   * @param far Camera-space far value of upper right far point
   * @return The rotation matrix
   */
  static frustum(
    left: number,
    right: number,
    bottom: number,
    top: number,
    near: number,
    far: number
  ): Matrix {
    return new Matrix([
      (2 * near) / (right - left),
      0,
      (right + left) / (right - left),
      0,
      0,
      (2 * near) / (top - bottom),
      (top + bottom) / (top - bottom),
      0,
      0,
      0,
      -(far + near) / (far - near),
      -(2 * far * near) / (far - near),
      0,
      0,
      -1,
      0,
    ]);
  }

  /**
   * Constructs a new matrix that represents a projection normalisation transformation.
   * @param fovy Field of view in y-direction
   * @param aspect Aspect ratio between width and height
   * @param near Camera-space distance to near plane
   * @param far Camera-space distance to far plane
   * @return The resulting matrix
   */
  static perspective(
    fovy: number,
    aspect: number,
    near: number,
    far: number
  ): Matrix {
    var top = near * Math.tan((fovy * Math.PI) / 360);
    var right = top * aspect;
    return Matrix.frustum(-right, right, -top, top, near, far);
  }

  /**
   * Returns the identity matrix
   * @return A new identity matrix
   */
  static identity(): Matrix {
    return new Matrix([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
  }

  /**
   * Matrix multiplication
   * @param other The matrix to multiply with
   * @return The result of the multiplication this*other
   */
  mul(other: Matrix): Matrix {
    const result = new Matrix([]);
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++) {
        let sum = 0;
        for (let i = 0; i < 4; i++) {
          sum += this.getVal(row, i) * other.getVal(i, col);
        }
        result.setVal(row, col, sum);
      }
    }
    return result;
  }

  /**
   * Matrix-vector multiplication
   * @param other The vector to multiply with
   * @return The result of the multiplication this*other
   */
  mulVec(other: Vector): Vector {
    const result = new Vector(0, 0, 0, 0);
    for (let row = 0; row < 4; row++) {
      let sum = 0;
      for (let col = 0; col < 4; col++) {
        sum += this.getVal(row, col) * other.data[col];
      }
      result.data[row] = sum;
    }
    return result;
  }

  /**
   * Returns the transpose of this matrix
   * @return A new matrix that is the transposed of this
   */
  transpose(): Matrix {
    let result = new Matrix([]);
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++) {
        result.setVal(col, row, this.getVal(row, col));
      }
    }
    return result;
  }
  toJSON() {
    let array = [];
    //transposed array because constructor of Matrix will transpose it back later
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++) {
        array[col * 4 + row] = this.data[row * 4 + col];
      }
    }
    return {
      "data": array
    }
  }
  /**
   * Debug print to console
   */
  print() {
    for (let row = 0; row < 4; row++) {
      console.log(
        "> " +
          this.getVal(row, 0) +
          "\t" +
          this.getVal(row, 1) +
          "\t" +
          this.getVal(row, 2) +
          "\t" +
          this.getVal(row, 3)
      );
    }
  }
}

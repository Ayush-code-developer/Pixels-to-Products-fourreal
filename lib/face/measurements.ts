import type {
  FaceAnalysis,
  FaceLandmarks,
  FaceMeasurement,
  Point,
} from "./types";

const distance = (a: Point, b: Point) => {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = (a.z ?? 0) - (b.z ?? 0);

  return Math.sqrt(dx * dx + dy * dy + dz * dz);
};

const midpoint = (a: Point, b: Point): Point => ({
  x: (a.x + b.x) / 2,
  y: (a.y + b.y) / 2,
  z: ((a.z ?? 0) + (b.z ?? 0)) / 2,
});

/*
 * MediaPipe Face Landmarker landmark indices.
 *
 * These are intentionally kept in one place so that if we
 * change landmark definitions later, we don't have to search
 * through the calculation code.
 */
const LANDMARKS = {
  forehead: 10,
  chin: 152,

  leftFace: 234,
  rightFace: 454,

  leftEyeOuter: 33,
  leftEyeInner: 133,
  rightEyeInner: 362,
  rightEyeOuter: 263,

  noseLeft: 129,
  noseRight: 358,
  noseTop: 168,
  noseBottom: 2,

  mouthLeft: 61,
  mouthRight: 291,

  leftCheek: 116,
  rightCheek: 345,
} as const;

function getLandmark(
  landmarks: FaceLandmarks,
  index: number
): Point | null {
  return landmarks[index] ?? null;
}

export function calculateFaceAnalysis(
  landmarks: FaceLandmarks
): FaceAnalysis {
  const forehead = getLandmark(landmarks, LANDMARKS.forehead);
  const chin = getLandmark(landmarks, LANDMARKS.chin);

  const leftFace = getLandmark(landmarks, LANDMARKS.leftFace);
  const rightFace = getLandmark(landmarks, LANDMARKS.rightFace);

  const leftEyeOuter = getLandmark(
    landmarks,
    LANDMARKS.leftEyeOuter
  );

  const rightEyeOuter = getLandmark(
    landmarks,
    LANDMARKS.rightEyeOuter
  );

  const leftEyeInner = getLandmark(
    landmarks,
    LANDMARKS.leftEyeInner
  );

  const rightEyeInner = getLandmark(
    landmarks,
    LANDMARKS.rightEyeInner
  );

  const noseLeft = getLandmark(
    landmarks,
    LANDMARKS.noseLeft
  );

  const noseRight = getLandmark(
    landmarks,
    LANDMARKS.noseRight
  );

  const noseTop = getLandmark(
    landmarks,
    LANDMARKS.noseTop
  );

  const noseBottom = getLandmark(
    landmarks,
    LANDMARKS.noseBottom
  );

  const mouthLeft = getLandmark(
    landmarks,
    LANDMARKS.mouthLeft
  );

  const mouthRight = getLandmark(
    landmarks,
    LANDMARKS.mouthRight
  );

  /*
   * These are normalized MediaPipe coordinates.
   * They aren't physical measurements such as centimeters.
   */

  const faceWidth =
    leftFace && rightFace
      ? distance(leftFace, rightFace)
      : 0;

  const faceHeight =
    forehead && chin
      ? distance(forehead, chin)
      : 0;

  const faceRatio =
    faceHeight > 0
      ? faceWidth / faceHeight
      : 0;

  const eyeDistance =
    leftEyeInner && rightEyeInner
      ? distance(leftEyeInner, rightEyeInner)
      : 0;

  const noseWidth =
    noseLeft && noseRight
      ? distance(noseLeft, noseRight)
      : 0;

  const noseLength =
    noseTop && noseBottom
      ? distance(noseTop, noseBottom)
      : 0;

  const mouthWidth =
    mouthLeft && mouthRight
      ? distance(mouthLeft, mouthRight)
      : 0;

  /*
   * Divide the face vertically into three sections.
   *
   * These represent geometric thirds, not a judgement
   * about attractiveness or facial quality.
   */

  const upperThird = 0.333;
  const middleThird = 0.333;
  const lowerThird = 0.334;

  /*
   * Basic left/right symmetry.
   *
   * We compare corresponding points around the vertical
   * centerline of the face.
   */

  let symmetry = 100;

  if (leftFace && rightFace && faceWidth > 0) {
    const centerX = (leftFace.x + rightFace.x) / 2;

    const leftDeviation = Math.abs(
      centerX - leftFace.x
    );

    const rightDeviation = Math.abs(
      rightFace.x - centerX
    );

    const difference =
      Math.abs(leftDeviation - rightDeviation);

    symmetry = Math.max(
      0,
      Math.min(
        100,
        100 - (difference / faceWidth) * 100
      )
    );
  }

  return {
    faceWidth,
    faceHeight,
    faceRatio,
    eyeDistance,
    noseWidth,
    noseLength,
    mouthWidth,
    upperThird,
    middleThird,
    lowerThird,
    symmetry,
  };
}

export function createMeasurements(
  analysis: FaceAnalysis
): FaceMeasurement[] {
  const percentage = (value: number, base: number) =>
    base > 0 ? (value / base) * 100 : 0;

  return [
    {
      id: "face-ratio",
      label: "Face Width / Height",
      value: analysis.faceRatio,
      unit: "ratio",
      description:
        "Ratio between the detected face width and face height.",
    },

    {
      id: "eye-distance",
      label: "Eye Distance",
      value: percentage(
        analysis.eyeDistance,
        analysis.faceWidth
      ),
      unit: "%",
      description:
        "Distance between the inner corners of the eyes relative to face width.",
    },

    {
      id: "nose-width",
      label: "Nose Width",
      value: percentage(
        analysis.noseWidth,
        analysis.faceWidth
      ),
      unit: "%",
      description:
        "Nose width relative to detected face width.",
    },

    {
      id: "nose-length",
      label: "Nose Length",
      value: percentage(
        analysis.noseLength,
        analysis.faceHeight
      ),
      unit: "%",
      description:
        "Nose length relative to detected face height.",
    },

    {
      id: "mouth-width",
      label: "Mouth Width",
      value: percentage(
        analysis.mouthWidth,
        analysis.faceWidth
      ),
      unit: "%",
      description:
        "Mouth width relative to detected face width.",
    },

    {
      id: "symmetry",
      label: "Left / Right Symmetry",
      value: analysis.symmetry,
      unit: "%",
      description:
        "Geometric similarity between selected left and right facial landmarks.",
    },
  ];
}

export function analyzeFace(
  landmarks: FaceLandmarks
): {
  analysis: FaceAnalysis;
  measurements: FaceMeasurement[];
} {
  const analysis = calculateFaceAnalysis(landmarks);

  const measurements = createMeasurements(analysis);

  return {
    analysis,
    measurements,
  };
}
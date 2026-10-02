export type Point = {
  x: number;
  y: number;
  z?: number;
};

export type FaceLandmarks = Point[];

export type FaceMeasurement = {
  id: string;
  label: string;
  value: number;
  unit: "px" | "%" | "ratio";
  description?: string;
};

export type FaceAnalysis = {
  faceWidth: number;
  faceHeight: number;
  faceRatio: number;

  eyeDistance: number;
  noseWidth: number;
  noseLength: number;
  mouthWidth: number;

  upperThird: number;
  middleThird: number;
  lowerThird: number;

  symmetry: number;
};

export type FaceAnalysisResult = {
  landmarks: FaceLandmarks;
  measurements: FaceMeasurement[];
  analysis: FaceAnalysis;
};
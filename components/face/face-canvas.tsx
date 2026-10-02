"use client";

import {
  useEffect,
  useRef,
} from "react";

import type {
  FaceLandmarks,
  Point,
} from "../../lib/face/types";

type Props = {
  landmarks: FaceLandmarks;
  imageWidth: number;
  imageHeight: number;
  className?: string;
};

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
} as const;

const FACE_OUTLINE = [
  10,
  338,
  297,
  332,
  284,
  251,
  389,
  356,
  454,
  323,
  361,
  288,
  397,
  365,
  379,
  378,
  400,
  377,
  152,
  148,
  176,
  149,
  150,
  136,
  172,
  58,
  132,
  93,
  234,
  127,
  162,
  21,
  54,
  103,
  67,
  109,
  10,
];

const LEFT_EYE = [
  33,
  7,
  163,
  144,
  145,
  153,
  154,
  155,
  133,
  173,
  157,
  158,
  159,
  160,
  161,
  246,
];

const RIGHT_EYE = [
  362,
  382,
  381,
  380,
  374,
  373,
  390,
  249,
  263,
  466,
  388,
  387,
  386,
  385,
  384,
  398,
];

const MOUTH_OUTLINE = [
  61,
  146,
  91,
  181,
  84,
  17,
  314,
  405,
  321,
  375,
  291,
  308,
  324,
  318,
  402,
  317,
  14,
  87,
  178,
  88,
  95,
  185,
  40,
  39,
  37,
  0,
  267,
  269,
  270,
  409,
  415,
  310,
  311,
  312,
  13,
  82,
  81,
  80,
  191,
  78,
  61,
];

function drawPoint(
  ctx: CanvasRenderingContext2D,
  point: Point,
  width: number,
  height: number,
  radius = 3
) {
  const x = point.x * width;
  const y = point.y * height;

  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);

  ctx.fill();
}

function drawPath(
  ctx: CanvasRenderingContext2D,
  landmarks: FaceLandmarks,
  indices: number[],
  width: number,
  height: number,
  close = false
) {
  if (!indices.length) return;

  ctx.beginPath();

  indices.forEach((index, i) => {
    const point = landmarks[index];

    if (!point) return;

    const x = point.x * width;
    const y = point.y * height;

    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  });

  if (close) {
    ctx.closePath();
  }

  ctx.stroke();
}

export default function FaceCanvas({
  landmarks,
  imageWidth,
  imageHeight,
  className = "",
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas || !landmarks.length) return;

    const ctx = canvas.getContext("2d");

    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;

    canvas.width = imageWidth * dpr;
    canvas.height = imageHeight * dpr;

    canvas.style.width = `${imageWidth}px`;
    canvas.style.height = `${imageHeight}px`;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    ctx.clearRect(
      0,
      0,
      imageWidth,
      imageHeight
    );

    /*
     * Face outline
     */
    ctx.strokeStyle = "rgba(71, 115, 236, 0.9)";
    ctx.lineWidth = 2;

    drawPath(
      ctx,
      landmarks,
      FACE_OUTLINE,
      imageWidth,
      imageHeight,
      false
    );

    /*
     * Eyes
     */
    ctx.strokeStyle = "rgba(71, 115, 236, 0.85)";
    ctx.lineWidth = 1.5;

    drawPath(
      ctx,
      landmarks,
      LEFT_EYE,
      imageWidth,
      imageHeight,
      true
    );

    drawPath(
      ctx,
      landmarks,
      RIGHT_EYE,
      imageWidth,
      imageHeight,
      true
    );

    /*
     * Mouth
     */
    ctx.strokeStyle = "rgba(71, 115, 236, 0.8)";

    drawPath(
      ctx,
      landmarks,
      MOUTH_OUTLINE,
      imageWidth,
      imageHeight,
      true
    );

    /*
     * Important measurement points.
     */
    const importantPoints = [
      LANDMARKS.forehead,
      LANDMARKS.chin,

      LANDMARKS.leftFace,
      LANDMARKS.rightFace,

      LANDMARKS.leftEyeOuter,
      LANDMARKS.leftEyeInner,
      LANDMARKS.rightEyeInner,
      LANDMARKS.rightEyeOuter,

      LANDMARKS.noseLeft,
      LANDMARKS.noseRight,
      LANDMARKS.noseTop,
      LANDMARKS.noseBottom,

      LANDMARKS.mouthLeft,
      LANDMARKS.mouthRight,
    ];

    ctx.fillStyle = "#4773ec";

    for (const index of importantPoints) {
      const point = landmarks[index];

      if (!point) continue;

      drawPoint(
        ctx,
        point,
        imageWidth,
        imageHeight,
        4
      );
    }

    /*
     * Face width measurement line.
     */
    const leftFace = landmarks[LANDMARKS.leftFace];
    const rightFace = landmarks[LANDMARKS.rightFace];

    if (leftFace && rightFace) {
      ctx.strokeStyle = "rgba(71, 115, 236, 0.65)";
      ctx.lineWidth = 1;

      ctx.beginPath();

      ctx.moveTo(
        leftFace.x * imageWidth,
        leftFace.y * imageHeight
      );

      ctx.lineTo(
        rightFace.x * imageWidth,
        rightFace.y * imageHeight
      );

      ctx.stroke();
    }

    /*
     * Face height measurement line.
     */
    const forehead = landmarks[LANDMARKS.forehead];
    const chin = landmarks[LANDMARKS.chin];

    if (forehead && chin) {
      ctx.strokeStyle = "rgba(71, 115, 236, 0.65)";
      ctx.lineWidth = 1;

      ctx.beginPath();

      ctx.moveTo(
        forehead.x * imageWidth,
        forehead.y * imageHeight
      );

      ctx.lineTo(
        chin.x * imageWidth,
        chin.y * imageHeight
      );

      ctx.stroke();
    }

    /*
     * Eye distance line.
     */
    const leftEye = landmarks[LANDMARKS.leftEyeInner];
    const rightEye = landmarks[LANDMARKS.rightEyeInner];

    if (leftEye && rightEye) {
      ctx.strokeStyle = "rgba(34, 197, 94, 0.8)";
      ctx.lineWidth = 2;

      ctx.beginPath();

      ctx.moveTo(
        leftEye.x * imageWidth,
        leftEye.y * imageHeight
      );

      ctx.lineTo(
        rightEye.x * imageWidth,
        rightEye.y * imageHeight
      );

      ctx.stroke();
    }

    /*
     * Nose width line.
     */
    const noseLeft = landmarks[LANDMARKS.noseLeft];
    const noseRight = landmarks[LANDMARKS.noseRight];

    if (noseLeft && noseRight) {
      ctx.strokeStyle = "rgba(245, 158, 11, 0.9)";
      ctx.lineWidth = 2;

      ctx.beginPath();

      ctx.moveTo(
        noseLeft.x * imageWidth,
        noseLeft.y * imageHeight
      );

      ctx.lineTo(
        noseRight.x * imageWidth,
        noseRight.y * imageHeight
      );

      ctx.stroke();
    }

    /*
     * Mouth width line.
     */
    const mouthLeft = landmarks[LANDMARKS.mouthLeft];
    const mouthRight = landmarks[LANDMARKS.mouthRight];

    if (mouthLeft && mouthRight) {
      ctx.strokeStyle = "rgba(236, 72, 153, 0.85)";
      ctx.lineWidth = 2;

      ctx.beginPath();

      ctx.moveTo(
        mouthLeft.x * imageWidth,
        mouthLeft.y * imageHeight
      );

      ctx.lineTo(
        mouthRight.x * imageWidth,
        mouthRight.y * imageHeight
      );

      ctx.stroke();
    }
  }, [
    landmarks,
    imageWidth,
    imageHeight,
  ]);

  return (
    <canvas
      ref={canvasRef}
      className={`pointer-events-none absolute left-0 top-0 ${className}`}
      aria-hidden="true"
    />
  );
}
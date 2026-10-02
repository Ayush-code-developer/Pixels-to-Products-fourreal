"use client";

if (typeof window !== "undefined") {
  const originalConsoleError = console.error;

  console.error = (...args: unknown[]) => {
    const message = args
      .map((arg) => String(arg))
      .join(" ");

    if (
      message.includes(
        "Created TensorFlow Lite XNNPACK delegate for CPU"
      )
    ) {
      return;
    }

    originalConsoleError(...args);
  };
}

import { useEffect, useRef, useState } from "react";

import type {
  FaceLandmarker,
  FaceLandmarkerResult,
} from "@mediapipe/tasks-vision";

import FaceCanvas from "./face-canvas";
import MeasurementCard from "./measurement-card";

import { analyzeFace } from "../../lib/face/measurements";
import type { FaceMeasurement, Point } from "../../lib/face/types";

const WASM_URL =
  "/mediapipe";

const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";

export default function FaceAnalyzer() {
  const imageRef = useRef<HTMLImageElement | null>(null);
  const landmarkerRef = useRef<FaceLandmarker | null>(null);

  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [landmarks, setLandmarks] = useState<Point[] | null>(null);
  const [measurements, setMeasurements] = useState<FaceMeasurement[]>([]);

  const [imageSize, setImageSize] = useState({
    width: 0,
    height: 0,
  });

  const [loadingModel, setLoadingModel] = useState(true);
  const [detecting, setDetecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /*
   * Load MediaPipe only in the browser.
   *
   * This is intentionally a dynamic import instead of:
   *
   * import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";
   *
   * at the top of the file.
   *
   * That avoids Turbopack trying to evaluate MediaPipe's browser-specific
   * bundle during the Next.js build/module evaluation phase.
   */
  useEffect(() => {
    let cancelled = false;

    async function loadModel() {
      try {
        setLoadingModel(true);
        setError(null);

        if (typeof window === "undefined") {
          return;
        }

        const {
          FaceLandmarker,
          FilesetResolver,
        } = await import("@mediapipe/tasks-vision");

        if (cancelled) {
          return;
        }

        const vision = await FilesetResolver.forVisionTasks(WASM_URL);

        if (cancelled) {
          return;
        }

        /*
         * Start with CPU instead of GPU.
         *
         * GPU delegates can introduce browser/WebGL-specific failures.
         * Once everything works reliably, we can add GPU back as an
         * optional optimization.
         */
        const landmarker = await FaceLandmarker.createFromOptions(
          vision,
          {
            baseOptions: {
              modelAssetPath: MODEL_URL,
              delegate: "GPU",
            },

            runningMode: "IMAGE",
            numFaces: 1,

            minFaceDetectionConfidence: 0.5,
            minFacePresenceConfidence: 0.5,
            minTrackingConfidence: 0.5,
          }
        );

        if (cancelled) {
          landmarker.close();
          return;
        }

        landmarkerRef.current = landmarker;

        setLoadingModel(false);
      } catch (err) {
        console.error("Failed to load MediaPipe:", err);

        if (!cancelled) {
          setLoadingModel(false);

          setError(
            "Face detection could not be initialized. Check your internet connection and reload the page."
          );
        }
      }
    }

    loadModel();

    return () => {
      cancelled = true;

      if (landmarkerRef.current) {
        landmarkerRef.current.close();
        landmarkerRef.current = null;
      }
    };
  }, []);

  /*
   * Keep the canvas overlay synchronized with the actual displayed
   * dimensions of the image.
   */
  useEffect(() => {
    const image = imageRef.current;

    if (!image) {
      return;
    }

    const updateSize = () => {
      const rect = image.getBoundingClientRect();

      setImageSize({
        width: rect.width,
        height: rect.height,
      });
    };

    updateSize();

    const observer = new ResizeObserver(updateSize);
    observer.observe(image);

    window.addEventListener("resize", updateSize);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateSize);
    };
  }, [imageUrl]);

  async function analyzeImage(file: File) {
    setError(null);
    setLandmarks(null);
    setMeasurements([]);

    const landmarker = landmarkerRef.current;

    if (!landmarker) {
      setError("Face detection is still loading. Please try again in a moment.");
      return;
    }

    const nextUrl = URL.createObjectURL(file);

    /*
     * Revoke the previous object URL.
     */
    if (imageUrl) {
      URL.revokeObjectURL(imageUrl);
    }

    setImageUrl(nextUrl);
    setDetecting(true);

    try {
      /*
       * Wait for the image to actually decode before giving it to
       * MediaPipe.
       */
      const image = new Image();

      image.src = nextUrl;

      await new Promise<void>((resolve, reject) => {
        image.onload = () => resolve();
        image.onerror = () =>
          reject(new Error("Failed to load the selected image."));
      });

      const result: FaceLandmarkerResult = landmarker.detect(image);

      if (!result.faceLandmarks || result.faceLandmarks.length === 0) {
        setError(
          "No face was detected. Try a clear, front-facing photo with good lighting."
        );

        return;
      }

      const detectedLandmarks = result.faceLandmarks[0];

      const convertedLandmarks: Point[] = detectedLandmarks.map(
        (landmark) => ({
          x: landmark.x,
          y: landmark.y,
          z: landmark.z,
        })
      );

      const analysisResult = analyzeFace(convertedLandmarks);

      setLandmarks(convertedLandmarks);
      setMeasurements(analysisResult.measurements);
    } catch (err) {
      console.error("Face analysis failed:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while analyzing the image."
      );
    } finally {
      setDetecting(false);
    }
  }

  function handleFileChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError("Please select an image file.");
      return;
    }

    analyzeImage(file);

    /*
     * Allow selecting the same image again.
     */
    event.target.value = "";
  }

  return (
    <div className="space-y-8">
      {/* Upload area */}
      <div className="rounded-3xl border border-[#dce5fa] bg-white p-6 shadow-[0_20px_60px_#183c7308]">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#4773ec]">
              Face Scanner
            </p>

            <h2 className="mt-2 text-xl font-medium tracking-tight text-[#080e2b]">
              Upload a front-facing photo
            </h2>

            <p className="mt-2 max-w-xl text-sm leading-6 text-[#7a87aa]">
              For the most consistent measurements, use a clear photo with
              your face looking directly toward the camera.
            </p>
          </div>

          <label
            className={`inline-flex cursor-pointer items-center justify-center rounded-xl px-5 py-3 text-sm font-medium transition ${
              loadingModel || detecting
                ? "cursor-not-allowed bg-[#eef2fb] text-[#9aa7c2]"
                : "bg-[#4773ec] text-white shadow-[0_10px_30px_#4773ec30] hover:bg-[#3d67d8]"
            }`}
          >
            {detecting
              ? "Analyzing..."
              : loadingModel
                ? "Loading scanner..."
                : "Choose photo"}

            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              disabled={loadingModel || detecting}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm leading-6 text-red-700">
          {error}
        </div>
      )}

      {/* Image + overlay */}
      {imageUrl && (
        <div className="rounded-3xl border border-[#dce5fa] bg-white p-4 shadow-[0_20px_60px_#183c7308] sm:p-6">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#4773ec]">
                Landmark Map
              </p>

              <h2 className="mt-1 text-lg font-medium text-[#080e2b]">
                Facial geometry
              </h2>
            </div>

            {landmarks && (
              <span className="rounded-full bg-[#edf3ff] px-3 py-1 text-xs font-medium text-[#4773ec]">
                Face detected
              </span>
            )}
          </div>

          <div className="flex justify-center overflow-hidden rounded-2xl bg-[#f4f7fd] p-3">
            <div className="relative inline-block max-w-full">
              <img
                ref={imageRef}
                src={imageUrl}
                alt="Uploaded face"
                className="block max-h-[720px] max-w-full rounded-xl object-contain"
                onLoad={() => {
                  const image = imageRef.current;

                  if (!image) {
                    return;
                  }

                  const rect = image.getBoundingClientRect();

                  setImageSize({
                    width: rect.width,
                    height: rect.height,
                  });
                }}
              />

              {landmarks &&
                imageSize.width > 0 &&
                imageSize.height > 0 && (
                  <FaceCanvas
                    landmarks={landmarks}
                    imageWidth={imageSize.width}
                    imageHeight={imageSize.height}
                    className="pointer-events-none absolute left-0 top-0"
                  />
                )}
            </div>
          </div>
        </div>
      )}

      {/* Measurements */}
      {measurements.length > 0 && (
        <section>
          <div className="mb-5">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#4773ec]">
              Measurements
            </p>

            <h2 className="mt-1 text-2xl font-medium tracking-tight text-[#080e2b]">
              Your facial proportions
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#7a87aa]">
              These values describe the geometry detected from the image.
              They are relative measurements rather than physical
              measurements in centimeters or millimeters.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {measurements.map((measurement) => (
              <MeasurementCard
                key={measurement.id}
                measurement={measurement}
              />
            ))}
          </div>
        </section>
      )}

      {/* Empty state */}
      {!imageUrl && !error && (
        <div className="rounded-3xl border border-dashed border-[#cbd8f0] bg-white/60 px-6 py-16 text-center">
          <div className="mx-auto max-w-md">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#edf3ff] text-[#4773ec]">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="h-7 w-7"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path
                  d="M12 3C7.5 3 4 6.8 4 11.5S7.5 20 12 20s8-3.8 8-8.5S16.5 3 12 3Z"
                  strokeLinecap="round"
                />

                <circle cx="9" cy="10" r="1" fill="currentColor" />
                <circle cx="15" cy="10" r="1" fill="currentColor" />

                <path
                  d="M8.5 15c1.1.9 2.2 1.3 3.5 1.3s2.4-.4 3.5-1.3"
                  strokeLinecap="round"
                />
              </svg>
            </div>

            <h3 className="mt-5 text-lg font-medium text-[#080e2b]">
              Nothing analyzed yet
            </h3>

            <p className="mt-2 text-sm leading-6 text-[#7a87aa]">
              Upload a face photo and Orbit Studio will map the facial
              landmarks and calculate the available geometric measurements.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
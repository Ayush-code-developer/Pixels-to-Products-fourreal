# Pixels to Products

A visual creation toolkit built with Next.js, Cloudinary, Supabase, MediaPipe, and Three.js.

Pixels to Products brings several image-focused workflows into one studio: optimize and transform product imagery, analyze facial geometry, and turn six box-face images into an interactive 3D model.

## Live App

**[Open Pixels to Products →](https://pixels-to-products-fourreal.vercel.app/)**

> The live application is deployed on Vercel.

---

## Features

### 1. Image Studio

The Image Studio is the main image-processing workspace.

Upload an image and create optimized variations using predefined visual styles and output sizes.

#### What it does

- Upload images directly to the studio
- Process images through Cloudinary
- Apply predefined visual treatments
- Generate different output sizes
- Preview the original and processed result
- Compare before and after
- Download the generated image
- Work with the processed image without manually configuring image transformations

#### How to use it

1. Open the [live app](https://pixels-to-products-fourreal.vercel.app/).
2. Open **Studio**.
3. Upload an image.
4. Select the desired visual style.
5. Select an output size.
6. Add a scene or transformation prompt if applicable.
7. Process the image.
8. Review the before/after result.
9. Download the final image.

The image processing pipeline uses Cloudinary, allowing transformations to be performed without requiring the application itself to store the uploaded image locally.

---

# 2. Facial Geometry & Proportion Analysis

The Face Analysis tool uses computer vision to detect facial landmarks and calculate relative facial measurements.

It is designed around **facial geometry and proportions**, rather than subjective attractiveness scoring.

### Measurements

The analyzer currently calculates values including:

- Face width
- Face height
- Face width-to-height ratio
- Eye-to-eye distance
- Nose width
- Nose length
- Mouth width
- Facial symmetry
- Relative facial proportions

The application uses facial landmarks detected by MediaPipe Face Landmarker.

### How it works

1. Open **Face Analysis**.
2. Upload a clear, front-facing face photograph.
3. The browser loads the MediaPipe Face Landmarker.
4. Facial landmarks are detected from the image.
5. The application calculates geometric distances between relevant landmarks.
6. The results are displayed as measurement cards.
7. A visual overlay is rendered on top of the image to show the detected facial geometry.

### Example measurements

The system uses landmarks around areas such as:

- Forehead
- Chin
- Left and right sides of the face
- Eyes
- Nose
- Mouth
- Cheeks

Measurements are primarily relative values rather than physical measurements.

For example, the application can determine that one feature occupies a certain percentage of the face width, but it cannot determine that a person's nose is physically `4.2 cm` wide from a normal photograph without a real-world scale reference.

### Privacy

Face analysis is performed using the uploaded image and the browser-based computer vision pipeline. The application is intended to analyze facial geometry rather than identify a person.

---

# 3. Box to 3D

**Box to 3D** converts six images representing the faces of a box into an interactive 3D model.

This is useful for visualizing packaging, product boxes, game assets, mockups, and other six-sided objects.

### Supported faces

You can provide images for:

- Front
- Back
- Left
- Right
- Top
- Bottom

### How to use it

1. Open **Box to 3D**.
2. Upload an image for each available box face.
3. Adjust the image perspective using the corner picker when necessary.
4. The application warps the image to fit the selected face.
5. Set the desired box dimensions.
6. Preview the resulting 3D box.
7. Drag the model to rotate it.
8. Enable the idle rotation if desired.
9. Export the finished model as a `.glb` file.

### Perspective correction

The box editor includes a corner-picking workflow.

When an uploaded image does not perfectly match the perspective of the box face, the corners can be adjusted manually.

The selected quadrilateral is then warped to the corresponding rectangular face.

This makes it possible to use photographs or images that were not originally prepared as perfectly rectangular textures.

### 3D rendering

The interactive preview uses:

- Three.js
- React Three Fiber
- WebGL

The resulting geometry can also be exported using the GLTF/GLB format.
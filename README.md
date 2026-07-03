# Vue Image Editor

[DEMO LINK](https://live-art-test.vercel.app/)

A browser-based image editor test task built with a clean Vue 3 architecture, non-destructive editing state, live preview, crop support, image export, and operations JSON export.

## Stack

- Vue 3
- TypeScript
- Vite
- Vuetify 3
- Pinia
- CropperJS

## How to Run

```bash
npm i
npm run dev
```

Useful scripts:

```bash
npm run typecheck
npm run build
npm run preview
```

## Implemented Features

- Image upload by button or drag and drop
- Image type validation with toast feedback
- Non-destructive editor state
- Live image preview
- Crop mode with visual crop area
- Brightness, contrast, and saturation sliders
- Filter selection: none, greyscale, sepia
- Original/current preview switcher
- Reset all edits and reset crop
- Remove image and re-upload flow
- Image export as a downloadable file
- Operations JSON export as a downloadable file
- Loading, success, warning, and error feedback via top-right toasts
- Responsive layout for desktop and smaller screens

## Key Decisions

The original image is preserved as the immutable source. The app stores the uploaded file metadata and object URL separately from all edit operations. Crop, adjustments, and filter state are modeled as independent operation data rather than mutations to the source image.

The preview is derived from Pinia state. CSS filters are used for responsive live feedback while editing brightness, contrast, saturation, and filters. Applied crop is represented as serializable geometry and reflected in the preview without changing the original image.

Final image export uses a Canvas pipeline. The app loads the original image, applies crop first, applies adjustments and filter through the canvas filter pipeline, and then exports the result as a downloadable image.

Operations JSON export describes how to reproduce the result from the original image. It does not include image binary data.

## Operation JSON Model

The exported JSON uses an explicit ordered operation model:

```json
{
  "schemaVersion": 1,
  "source": {
    "fileName": "image.jpg",
    "mimeType": "image/jpeg",
    "width": 1920,
    "height": 1080
  },
  "operations": [
    {
      "type": "crop",
      "x": 100,
      "y": 80,
      "width": 800,
      "height": 600
    },
    {
      "type": "adjust",
      "brightness": 110,
      "contrast": 95,
      "saturation": 120
    },
    {
      "type": "filter",
      "name": "sepia"
    }
  ],
  "exportedAt": "2026-07-02T12:00:00.000Z"
}
```

Operations are ordered to match the export pipeline: crop, adjustments, then filter.

## Trade-offs

- CSS filters are used for live preview because they are fast, simple, and responsive for interactive editing.
- Canvas is used for final export because it produces a real edited image file from the original source and operation state.
- Crop is stored as geometry rather than a generated image, keeping the model serializable and non-destructive.
- Object URLs are used for local image preview and revoked when images are replaced or removed.

## Bonus Notes

The bonus filter feature is implemented with none, greyscale, and sepia options. Filters affect both live preview and final image export.

The bonus operations JSON export is implemented as a separate download. It includes source metadata, ordered operations, schema version, and export timestamp, while intentionally excluding image binary data.

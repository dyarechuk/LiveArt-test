<template>
  <v-dialog
    v-if="editor.canRefineMask"
    v-model="isDialogOpen"
    class="mask-refinement"
    :fullscreen="smAndDown"
    max-width="1200"
    width="min(1200px, calc(100vw - 32px))"
  >
    <v-card class="mask-refinement__card">
      <v-card-title class="mask-refinement__header">
        <div>
          <h2>Refine Mask</h2>
          <p>Paint foreground back in or remove leftover background.</p>
        </div>
        <v-btn
          aria-label="Cancel mask refinement"
          icon="mdi-close"
          variant="text"
          @click="cancel"
        />
      </v-card-title>

      <v-card-text class="mask-refinement__body">
        <div class="mask-refinement__toolbar">
          <div class="mask-refinement__tool">
            <span>Tool</span>
            <v-btn-toggle
              class="mask-refinement__tool-toggle"
              density="compact"
              divided
              mandatory
              :model-value="editor.maskBrushMode"
              variant="outlined"
              @update:model-value="setBrushMode"
            >
              <v-btn value="restore">Restore Foreground</v-btn>
              <v-btn value="erase">Remove Background</v-btn>
            </v-btn-toggle>
          </div>

          <div class="mask-refinement__brush">
            <div class="mask-refinement__brush-label">
              <span>Brush Size</span>
              <strong>{{ editor.maskBrushSize }} px</strong>
            </div>
            <v-slider
              hide-details
              :max="300"
              :min="5"
              :model-value="editor.maskBrushSize"
              :step="5"
              thumb-label
              @update:model-value="setBrushSize"
            />
          </div>

          <div class="mask-refinement__toolbar-actions">
            <v-btn
              :disabled="!editor.canUndoMaskStroke || isPreparing || isApplying"
              prepend-icon="mdi-undo"
              variant="tonal"
              @click="undo"
            >
              Undo
            </v-btn>
            <v-btn
              :disabled="isApplying"
              prepend-icon="mdi-close"
              variant="tonal"
              @click="cancel"
            >
              Cancel
            </v-btn>
            <v-btn
              color="primary"
              :disabled="isPreparing || !editableImageData"
              :loading="isApplying"
              prepend-icon="mdi-check"
              @click="apply"
            >
              Apply
            </v-btn>
          </div>
        </div>

        <div ref="canvasShell" class="mask-refinement__canvas-shell">
          <canvas
            ref="canvasElement"
            aria-label="Mask refinement canvas"
            class="mask-refinement__canvas"
            role="img"
            :style="canvasDisplayStyle"
            @pointercancel="finishStroke"
            @pointerdown="startStroke"
            @pointerleave="finishStroke"
            @pointermove="continueStroke"
            @pointerup="finishStroke"
          />
          <span
            v-if="cursor"
            class="mask-refinement__cursor"
            :class="`mask-refinement__cursor--${editor.maskBrushMode}`"
            :style="cursorStyle"
          />
          <div v-if="isPreparing" class="mask-refinement__status">
            Preparing mask editor...
          </div>
        </div>

        <v-alert
          v-if="localError"
          density="compact"
          type="error"
          variant="tonal"
        >
          {{ localError }}
        </v-alert>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { useDisplay } from 'vuetify'
import { useEditorStore } from '@/features/editor/store/useEditorStore'
import type { MaskBrushMode } from '@/features/editor/types/editor'
import {
  applyMaskBrushSegment,
  createUndoPatch,
  createMaskRefinementImageData,
  drawImageDataToCanvas,
  getBrushSegmentRect,
  imageDataToPngBlob,
  putImageDataRegion,
  restoreUndoPatch,
  type MaskDirtyRect,
  type MaskBrushPoint,
  type MaskUndoPatch
} from '@/features/editor/utils/maskRefinement'

interface BrushCursor {
  diameter: number
  x: number
  y: number
}

interface CanvasDisplaySize {
  height: number
  width: number
}

interface CanvasGeometry {
  canvasRect: DOMRect
  shellRect: DOMRect
}

interface StrokeUndoEntry {
  patches: MaskUndoPatch[]
}

interface ActiveStroke {
  lastPaintedPoint: MaskBrushPoint | null
  patches: MaskUndoPatch[]
  pendingPoints: MaskBrushPoint[]
  pointerId: number
}

interface CursorPosition {
  clientX: number
  clientY: number
}

const editor = useEditorStore()
const { smAndDown } = useDisplay()
const canvasElement = ref<HTMLCanvasElement>()
const canvasShell = ref<HTMLElement>()
const editableImageData = ref<ImageData | null>(null)
const canvasDisplaySize = ref<CanvasDisplaySize | null>(null)
const cursor = ref<BrushCursor | null>(null)
const isPreparing = ref(false)
const isApplying = ref(false)
const localError = ref<string | null>(null)

let loadRequestId = 0
let activeStroke: ActiveStroke | null = null
let canvasGeometry: CanvasGeometry | null = null
let pendingCursorPosition: CursorPosition | null = null
let paintFrame = 0
let resizeObserver: ResizeObserver | null = null
let fitFrame = 0
const undoHistory: StrokeUndoEntry[] = []
const undoHistoryLimit = 20

const isDialogOpen = computed({
  get: () => editor.isMaskRefinementOpen,
  set: (value: boolean) => {
    if (!value) {
      editor.closeMaskRefinement()
    }
  }
})

const canvasDisplayStyle = computed(() => {
  if (!canvasDisplaySize.value) {
    return {}
  }

  return {
    height: `${canvasDisplaySize.value.height}px`,
    width: `${canvasDisplaySize.value.width}px`
  }
})

const cursorStyle = computed(() => {
  if (!cursor.value) {
    return {}
  }

  return {
    height: `${cursor.value.diameter}px`,
    left: `${cursor.value.x - cursor.value.diameter / 2}px`,
    top: `${cursor.value.y - cursor.value.diameter / 2}px`,
    width: `${cursor.value.diameter}px`
  }
})

watch(
  () => ({
    isOpen: editor.isMaskRefinementOpen,
    originalUrl: editor.originalImage?.objectUrl,
    resultUrl: editor.backgroundRemovalResult?.resultUrl
  }),
  async (state) => {
    if (!state.isOpen) {
      resetLocalState()
      return
    }

    await prepareCanvas()
  },
  { immediate: true }
)

onBeforeUnmount(() => {
  resetLocalState()
})

async function prepareCanvas() {
  const requestId = ++loadRequestId
  const originalUrl = editor.originalImage?.objectUrl
  const resultUrl = editor.backgroundRemovalResult?.resultUrl

  if (!originalUrl || !resultUrl) {
    localError.value = 'Remove the background before refining the mask.'
    return
  }

  isPreparing.value = true
  localError.value = null
  undoHistory.length = 0
  editor.setCanUndoMaskStroke(false)

  try {
    await nextTick()
    await waitForAnimationFrame()
    observeCanvasWorkspace()
    await waitForCanvasWorkspace()

    const imageData = await createMaskRefinementImageData({
      originalUrl,
      resultUrl
    })

    if (requestId !== loadRequestId) {
      return
    }

    editableImageData.value = imageData
    await nextTick()
    renderCanvas()
    await waitForAnimationFrame()

    if (!updateCanvasDisplaySize()) {
      scheduleCanvasFit(1)
    }
  } catch (error) {
    if (requestId === loadRequestId) {
      localError.value = error instanceof Error ? error.message : 'Mask refinement could not be prepared.'
    }
  } finally {
    if (requestId === loadRequestId) {
      isPreparing.value = false
    }
  }
}

function startStroke(event: PointerEvent) {
  if (!editableImageData.value || isPreparing.value || isApplying.value) {
    return
  }

  updateCanvasGeometry()
  const point = getCanvasPoint(event)

  if (!point) {
    return
  }

  event.preventDefault()
  canvasElement.value?.setPointerCapture(event.pointerId)
  activeStroke = {
    lastPaintedPoint: null,
    patches: [],
    pendingPoints: [point],
    pointerId: event.pointerId
  }
  queueCursorPosition(event)
  schedulePaintFrame()
}

function continueStroke(event: PointerEvent) {
  queueCursorPosition(event)

  if (!activeStroke || !editableImageData.value) {
    schedulePaintFrame()
    return
  }

  const point = getCanvasPoint(event)

  if (!point) {
    return
  }

  event.preventDefault()
  activeStroke.pendingPoints.push(point)
  schedulePaintFrame()
}

function finishStroke(event: PointerEvent) {
  if (!activeStroke) {
    hideCursor()
    return
  }

  if (canvasElement.value?.hasPointerCapture(event.pointerId)) {
    canvasElement.value.releasePointerCapture(event.pointerId)
  }

  event.preventDefault()
  flushPaintQueue()

  if (activeStroke.patches.length > 0) {
    undoHistory.push({
      patches: activeStroke.patches
    })

    if (undoHistory.length > undoHistoryLimit) {
      undoHistory.shift()
    }
  }

  activeStroke = null
  editor.setCanUndoMaskStroke(undoHistory.length > 0)

  if (event.type === 'pointerleave' || event.type === 'pointercancel') {
    hideCursor()
    return
  }

  queueCursorPosition(event)
  schedulePaintFrame()
}

function hideCursor() {
  if (!activeStroke) {
    pendingCursorPosition = null
    cursor.value = null
  }
}

function undo() {
  if (!editableImageData.value || !canvasElement.value) {
    return
  }

  const undoEntry = undoHistory.pop()

  if (!undoEntry) {
    editor.setCanUndoMaskStroke(false)
    return
  }

  for (let index = undoEntry.patches.length - 1; index >= 0; index -= 1) {
    const patch = undoEntry.patches[index]
    restoreUndoPatch(editableImageData.value, patch)
    putImageDataRegion(canvasElement.value, editableImageData.value, patch.rect)
  }

  editor.setCanUndoMaskStroke(undoHistory.length > 0)
}

async function apply() {
  if (!editableImageData.value) {
    return
  }

  flushPaintQueue()
  isApplying.value = true
  localError.value = null

  try {
    const blob = await imageDataToPngBlob(editableImageData.value)
    editor.applyMaskRefinementResult(blob)
  } catch (error) {
    localError.value = error instanceof Error ? error.message : 'Mask refinement could not be applied.'
  } finally {
    isApplying.value = false
  }
}

function cancel() {
  editor.closeMaskRefinement()
}

function setBrushMode(value: MaskBrushMode | null) {
  if (value === 'restore' || value === 'erase') {
    editor.setMaskBrushMode(value)
  }
}

function setBrushSize(value: number | number[]) {
  const nextValue = Array.isArray(value) ? value[0] : value
  editor.setMaskBrushSize(nextValue)
}

function renderCanvas() {
  if (!canvasElement.value || !editableImageData.value) {
    return
  }

  drawImageDataToCanvas(canvasElement.value, editableImageData.value)
}

function queueCursorPosition(event: PointerEvent) {
  pendingCursorPosition = {
    clientX: event.clientX,
    clientY: event.clientY
  }
}

function schedulePaintFrame() {
  if (paintFrame) {
    return
  }

  paintFrame = requestAnimationFrame(() => {
    paintFrame = 0
    flushPaintQueue()
  })
}

function flushPaintQueue() {
  if (paintFrame) {
    cancelAnimationFrame(paintFrame)
    paintFrame = 0
  }

  paintQueuedStrokePoints()
  updateQueuedCursor()
}

function paintQueuedStrokePoints() {
  if (!activeStroke || !editableImageData.value || !canvasElement.value) {
    return
  }

  const points = activeStroke.pendingPoints.splice(0)

  if (points.length === 0) {
    return
  }

  const segments: Array<{ from: MaskBrushPoint, to: MaskBrushPoint }> = []
  let frameDirtyRect: MaskDirtyRect | null = null

  for (const point of points) {
    const from = activeStroke.lastPaintedPoint ?? point
    const dirtyRect = getBrushSegmentRect(
      from,
      point,
      editor.maskBrushSize,
      editableImageData.value.width,
      editableImageData.value.height
    )

    if (dirtyRect) {
      frameDirtyRect = mergeDirtyRects(frameDirtyRect, dirtyRect)
      segments.push({ from, to: point })
    }

    activeStroke.lastPaintedPoint = point
  }

  if (!frameDirtyRect || segments.length === 0) {
    return
  }

  activeStroke.patches.push(createUndoPatch(editableImageData.value, frameDirtyRect))

  for (const segment of segments) {
    applyMaskBrushSegment(
      editableImageData.value,
      segment.from,
      segment.to,
      editor.maskBrushSize,
      editor.maskBrushMode
    )
  }

  putImageDataRegion(canvasElement.value, editableImageData.value, frameDirtyRect)
}

function mergeDirtyRects(
  currentRect: MaskDirtyRect | null,
  nextRect: MaskDirtyRect
): MaskDirtyRect {
  if (!currentRect) {
    return nextRect
  }

  const x = Math.min(currentRect.x, nextRect.x)
  const y = Math.min(currentRect.y, nextRect.y)
  const maxX = Math.max(currentRect.x + currentRect.width, nextRect.x + nextRect.width)
  const maxY = Math.max(currentRect.y + currentRect.height, nextRect.y + nextRect.height)

  return {
    height: maxY - y,
    width: maxX - x,
    x,
    y
  }
}

function updateQueuedCursor() {
  if (!pendingCursorPosition || !canvasElement.value) {
    return
  }

  const geometry = canvasGeometry ?? updateCanvasGeometry()

  if (!geometry || geometry.canvasRect.width === 0) {
    cursor.value = null
    pendingCursorPosition = null
    return
  }

  cursor.value = {
    diameter: editor.maskBrushSize * (geometry.canvasRect.width / canvasElement.value.width),
    x: pendingCursorPosition.clientX - geometry.shellRect.left,
    y: pendingCursorPosition.clientY - geometry.shellRect.top
  }
  pendingCursorPosition = null
}

function observeCanvasWorkspace() {
  disconnectCanvasWorkspace()

  if (!canvasShell.value) {
    return
  }

  resizeObserver = new ResizeObserver((entries) => {
    if (entries.some((entry) => entry.contentRect.width > 0 && entry.contentRect.height > 0)) {
      scheduleCanvasFit()
    }
  })
  resizeObserver.observe(canvasShell.value)
  window.addEventListener('resize', handleCanvasWorkspaceResize)
}

function disconnectCanvasWorkspace() {
  if (resizeObserver) {
    resizeObserver.disconnect()
    resizeObserver = null
  }

  window.removeEventListener('resize', handleCanvasWorkspaceResize)

  if (fitFrame) {
    cancelAnimationFrame(fitFrame)
    fitFrame = 0
  }

  canvasGeometry = null
}

function handleCanvasWorkspaceResize() {
  scheduleCanvasFit()
}

function waitForAnimationFrame() {
  return new Promise<void>((resolve) => {
    requestAnimationFrame(() => {
      resolve()
    })
  })
}

async function waitForCanvasWorkspace() {
  if (hasCanvasWorkspaceSize()) {
    return
  }

  await waitForAnimationFrame()

  if (hasCanvasWorkspaceSize()) {
    return
  }

  await waitForAnimationFrame()
}

function hasCanvasWorkspaceSize() {
  if (!canvasShell.value) {
    return false
  }

  return canvasShell.value.clientWidth > 0 && canvasShell.value.clientHeight > 0
}

function scheduleCanvasFit(retryCount = 0) {
  if (fitFrame) {
    cancelAnimationFrame(fitFrame)
  }

  fitFrame = requestAnimationFrame(() => {
    fitFrame = 0
    const didFit = updateCanvasDisplaySize()

    if (!didFit && retryCount > 0) {
      scheduleCanvasFit(retryCount - 1)
    }
  })
}

function updateCanvasDisplaySize() {
  if (!canvasShell.value || !canvasElement.value || !editableImageData.value) {
    canvasDisplaySize.value = null
    return false
  }

  const availableWidth = canvasShell.value.clientWidth
  const availableHeight = canvasShell.value.clientHeight
  const imageWidth = editableImageData.value.width
  const imageHeight = editableImageData.value.height

  if (availableWidth <= 0 || availableHeight <= 0 || imageWidth <= 0 || imageHeight <= 0) {
    return false
  }

  const scale = Math.min(
    availableWidth / imageWidth,
    availableHeight / imageHeight,
    1
  )

  if (!Number.isFinite(scale) || scale <= 0) {
    return false
  }

  canvasDisplaySize.value = {
    height: Math.max(1, Math.floor(imageHeight * scale)),
    width: Math.max(1, Math.floor(imageWidth * scale))
  }
  nextTick(() => {
    requestAnimationFrame(() => {
      updateCanvasGeometry()
    })
  })

  return true
}

function getCanvasPoint(event: PointerEvent): MaskBrushPoint | null {
  if (!canvasElement.value) {
    return null
  }

  const geometry = canvasGeometry ?? updateCanvasGeometry()

  if (!geometry || geometry.canvasRect.width === 0 || geometry.canvasRect.height === 0) {
    return null
  }

  return {
    x: ((event.clientX - geometry.canvasRect.left) / geometry.canvasRect.width) * canvasElement.value.width,
    y: ((event.clientY - geometry.canvasRect.top) / geometry.canvasRect.height) * canvasElement.value.height
  }
}

function updateCanvasGeometry() {
  if (!canvasElement.value || !canvasShell.value) {
    canvasGeometry = null
    return null
  }

  const canvasRect = canvasElement.value.getBoundingClientRect()
  const shellRect = canvasShell.value.getBoundingClientRect()

  if (canvasRect.width === 0 || canvasRect.height === 0 || shellRect.width === 0 || shellRect.height === 0) {
    canvasGeometry = null
    return null
  }

  canvasGeometry = {
    canvasRect,
    shellRect
  }

  return canvasGeometry
}

function resetLocalState() {
  loadRequestId += 1
  disconnectCanvasWorkspace()
  flushPaintQueue()
  activeStroke = null
  pendingCursorPosition = null
  undoHistory.length = 0
  editableImageData.value = null
  canvasDisplaySize.value = null
  cursor.value = null
  localError.value = null
  isPreparing.value = false
  isApplying.value = false
  editor.setCanUndoMaskStroke(false)
}
</script>

<style scoped>
.mask-refinement__card {
  display: flex;
  flex-direction: column;
  width: min(1200px, calc(100vw - 32px));
  height: min(900px, calc(100dvh - 32px));
  max-height: calc(100dvh - 32px);
  min-width: 0;
  overflow: hidden;
  background: rgb(var(--v-theme-surface));
}

.mask-refinement__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  min-width: 0;
  padding: 16px 18px 10px;
}

.mask-refinement__header h2,
.mask-refinement__header p {
  margin: 0;
}

.mask-refinement__header h2 {
  font-size: 1.18rem;
  line-height: 1.25;
}

.mask-refinement__header p {
  margin-top: 4px;
  color: rgb(var(--v-theme-on-surface), 0.62);
  font-size: 0.88rem;
  line-height: 1.35;
}

.mask-refinement__body {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  gap: 12px;
  min-height: 0;
  min-width: 0;
  overflow: hidden;
  padding: 10px 18px 18px;
}

.mask-refinement__toolbar {
  display: grid;
  flex: 0 0 auto;
  grid-template-columns: minmax(270px, 0.85fr) minmax(220px, 1fr) auto;
  align-items: end;
  gap: 10px 14px;
  min-width: 0;
}

.mask-refinement__tool,
.mask-refinement__brush {
  display: grid;
  gap: 8px;
  min-width: 0;
}

.mask-refinement__tool > span,
.mask-refinement__brush-label {
  color: rgb(var(--v-theme-on-surface), 0.72);
  font-size: 0.82rem;
  font-weight: 650;
}

.mask-refinement__brush-label {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  min-width: 0;
}

.mask-refinement__tool-toggle {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  width: 100%;
  min-width: 0;
}

.mask-refinement__tool-toggle :deep(.v-btn) {
  min-width: 0;
  padding-inline: 8px;
  font-size: 0.86rem;
}

.mask-refinement__tool-toggle :deep(.v-btn__content) {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mask-refinement__toolbar-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: flex-end;
  min-width: 0;
}

.mask-refinement__toolbar-actions :deep(.v-btn) {
  min-width: 0;
}

.mask-refinement__toolbar-actions :deep(.v-btn__content) {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mask-refinement__canvas-shell {
  position: relative;
  display: flex;
  flex: 1 1 auto;
  align-items: center;
  justify-content: center;
  min-width: 0;
  min-height: 240px;
  overflow: hidden;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.16);
  border-radius: 8px;
  background-color: rgba(var(--v-theme-surface), 0.48);
  background-image:
    linear-gradient(45deg, rgba(var(--v-theme-on-surface), 0.1) 25%, transparent 25%),
    linear-gradient(-45deg, rgba(var(--v-theme-on-surface), 0.1) 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, rgba(var(--v-theme-on-surface), 0.1) 75%),
    linear-gradient(-45deg, transparent 75%, rgba(var(--v-theme-on-surface), 0.1) 75%);
  background-position:
    0 0,
    0 10px,
    10px -10px,
    -10px 0;
  background-size: 20px 20px;
}

.mask-refinement__canvas {
  flex-shrink: 0;
  display: block;
  max-width: 100%;
  max-height: 100%;
  opacity: 1;
  position: static;
  touch-action: none;
  user-select: none;
  visibility: visible;
}

.mask-refinement__cursor {
  position: absolute;
  z-index: 2;
  pointer-events: none;
  border: 2px solid rgb(var(--v-theme-primary));
  border-radius: 50%;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.38);
  transform: translateZ(0);
}

.mask-refinement__cursor--erase {
  border-color: rgb(var(--v-theme-error));
}

.mask-refinement__status {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  background: rgba(var(--v-theme-surface), 0.72);
  color: rgb(var(--v-theme-on-surface), 0.76);
  font-size: 0.92rem;
}

@media (max-width: 768px) {
  .mask-refinement__card {
    width: 100vw;
    height: 100dvh;
    max-height: 100dvh;
    border-radius: 0;
  }

  .mask-refinement__header {
    padding: 14px 12px 8px;
  }

  .mask-refinement__header h2 {
    font-size: 1rem;
  }

  .mask-refinement__header p {
    font-size: 0.76rem;
  }

  .mask-refinement__body {
    gap: 10px;
    min-width: 0;
    overflow: hidden;
    padding: 8px 12px;
  }

  .mask-refinement__toolbar {
    grid-template-columns: 1fr;
    align-items: stretch;
    gap: 8px;
  }

  .mask-refinement__tool-toggle :deep(.v-btn) {
    padding-inline: 4px;
    font-size: clamp(0.7rem, 2vw, 0.82rem);
  }

  .mask-refinement__canvas-shell {
    min-height: 180px;
    overflow: hidden;
  }

  .mask-refinement__toolbar-actions {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 6px;
  }

  .mask-refinement__toolbar-actions :deep(.v-btn) {
    width: 100%;
    padding-inline: 4px;
    font-size: clamp(0.7rem, 2vw, 0.82rem);
  }
}

@media (max-width: 420px) {
  .mask-refinement__toolbar-actions {
    grid-template-columns: 1fr;
  }
}
</style>

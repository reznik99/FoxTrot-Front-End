# Video Message Implementation Plan (Option A — Client-Side Compression)

## Overview

Keep the existing architecture (base64 → JSON → AES-256-GCM encrypt → single HTTP POST) but add aggressive client-side compression before encoding. Two new dependencies: `react-native-compressor` (compression) and `react-native-video` (playback).

## New Dependencies

| Package | Purpose |
|---|---|
| `react-native-compressor` | Compress video (and images) before base64 encoding |
| `react-native-video` | Video playback in preview screen and chat view |

## Changes by File

### 1. `CameraView.tsx` — Add Video Recording Mode

- Add `video={true}` to Camera component props
- Add recording state: `isRecording`, `recordingDuration`
- Add `startRecording()` / `stopRecording()` using vision-camera's API
- UI: toggle between photo/video mode (or press-and-hold for video)
- Show recording indicator with timer
- Preview: if video, use `<Video>` component instead of `<Image>` for preview with play/pause
- Send: compress video with `react-native-compressor` → read as base64 → wrap as `{type: 'VIDEO', message: base64, duration: ms}` → dispatch sendMessage
- Compression target: 480p, ~1Mbps bitrate, H.264

### 2. `Conversation.tsx` — Gallery Picker + Render

**Gallery picker (`handleImageSelect`):**
- Change `mediaType: 'photo'` → `'mixed'`
- Check `assets[0].type` to determine if image or video
- Pass media type info to CameraView so it knows which preview to show
- For videos, also pass `assets[0].duration`

**Message rendering (`renderMessage` switch):**
- Add `case 'VIDEO':` 
- Display: video thumbnail/placeholder + play icon overlay + duration label
- On tap: open full-screen video player

### 3. `ConversationPeek.tsx` — Preview Text

Add to the switch:
```typescript
case 'VIDEO':
  return { text: 'Video', icon: 'video', isMedia: true };
```

### 4. `FullScreenImage.tsx` → `FullScreenMedia.tsx`

- Rename/extend to handle both images and video
- Accept a `mediaType` prop (`'image' | 'video'`)
- If video: render `<Video>` component with controls (play/pause/seek)
- Download: save as `.mp4` instead of `.jpeg` for videos

### 5. Compression Utility (new file, e.g. `src/global/media.ts`)

Shared compression functions:

```typescript
// Video: compress to 480p, ~1Mbps, H.264
async function compressVideo(uri: string): Promise<string>

// Image: resize to max 1280px, compress JPEG
async function compressImage(uri: string): Promise<string>
```

This also retroactively improves image sizes (currently 200KB-800KB → target ~100-200KB).

### 6. `Messaging.tsx` — (Optional)

No changes required unless you want to add a video recording shortcut from the message input bar.

## Constraints

- **Max video duration**: Enforce a limit on the client (e.g., 60 seconds) to keep payloads manageable
- **Compression target**: Videos should land at ~1-3MB post-compression (before base64)
- **Progress indicator**: Show compression progress in UI since it may take a few seconds
- **Permissions**: Already handled — `getCameraAndMicrophonePermissions` requests both camera + mic

## Expected Payload Sizes (Post-Compression)

| Media | Raw | Compressed | As Base64 | As Encrypted |
|---|---|---|---|---|
| Image | 2-5MB | ~100-200KB | ~130-270KB | ~170-360KB |
| Video (15s) | ~15MB | ~1-2MB | ~1.3-2.7MB | ~1.7-3.6MB |
| Video (30s) | ~30MB | ~2-4MB | ~2.7-5.3MB | ~3.6-7MB |
| Video (60s) | ~60MB | ~4-8MB | ~5.3-10.7MB | ~7-14MB |

## Order of Implementation

1. Add dependencies (`react-native-compressor`, `react-native-video`)
2. Create compression utility (`media.ts`)
3. Add `VIDEO` case to `ConversationPeek.tsx` (simplest change)
4. Extend `FullScreenImage` → `FullScreenMedia` for video playback
5. Add `VIDEO` rendering in `Conversation.tsx` renderMessage switch
6. Update gallery picker in `Conversation.tsx` to allow mixed media
7. Add video recording to `CameraView.tsx`
8. Wire up compression in both paths (camera + gallery) before sending

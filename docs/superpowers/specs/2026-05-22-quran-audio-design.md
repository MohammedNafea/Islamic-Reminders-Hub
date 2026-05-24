# Quran Audio Recitation Design Specification

This specification documents the design and architecture for Phase 1 of the Islamic Reminders Hub enhancements: **Quran Audio Recitation**.

## 1. Overview
The goal of this enhancement is to provide a premium, interactive Quran audio player in the `Quran.tsx` page. The player will support five specific reciters (excluding Mishary Alafasy) and operate in a dual-mode configuration depending on whether the reciter's audio source is available at the verse (Ayah) or chapter (Surah) level.

### Reciters List
*   **Mahmoud Khalil Al-Husary** (محمود خليل الحصري) - Ayah-by-Ayah & Surah-by-Surah
*   **Saad Al-Ghamdi** (سعد الغامدي) - Ayah-by-Ayah & Surah-by-Surah
*   **Fares Abbad** (فارس عباد) - Ayah-by-Ayah & Surah-by-Surah
*   **Muhammad Al-Muhaisni** (محمد المحيسني) - Surah-by-Surah only
*   **Haitham Al-Dukhin** (هيثم الدخين) - Surah-by-Surah only

---

## 2. Component & Interface Design

### 2.1. Reciter Selector
*   **Location:** Integrated into the toolbar header of the active Surah page (`Quran.tsx`).
*   **UI Element:** A stylized select dropdown matching the app's existing theme, with Arabic/English options representing the Qaris.
*   **Default Selection:** Mahmoud Khalil Al-Husary (`husary`).

### 2.2. Floating Audio Player Bar
*   **Location:** Fixed at the bottom of the viewport (`fixed bottom-6 left-1/2 -translate-x-1/2`), hovering above the reading content.
*   **Aesthetics:** Dark/Light theme glassmorphism panel (`bg-card/85 backdrop-blur-md border border-primary/10 shadow-lg`), rounded corners (`rounded-[2rem]`), and responsive size.
*   **Dynamic Controls:**
    *   **Ayah Mode:** Play/Pause button, Next Ayah button, Previous Ayah button, and an Auto-Scroll toggle.
    *   **Surah Mode:** Play/Pause button, Skip Forward 10s, Skip Backward 10s, current time progress text, total duration text, and a custom seekbar slider.

---

## 3. Data Flow & Technical Architecture

### 3.1. Reciter Definition Registry
A static registry will be defined in a new file `src/data/reciters.ts` or directly in `src/pages/Quran.tsx` mapping each reciter to their metadata:

```typescript
export interface Reciter {
  id: string;
  name: string;
  englishName: string;
  type: "ayah" | "surah";
  audioEditionId?: string; // For Alquran.cloud API
  surahBaseUrl?: string; // For MP3Quran direct downloads
}
```

### 3.2. Playback State Machine
The page will maintain the following reactive states:
*   `currentReciter`: Active `Reciter` object, persisted to `localDB`.
*   `isPlaying`: Boolean indicating audio playing status.
*   `activeAyahNumber`: Number of the currently playing Ayah (1-indexed inside the Surah).
*   `audioProgress`: Elapsed time in seconds (for Surah Mode).
*   `audioDuration`: Total duration in seconds (for Surah Mode).
*   `autoScrollEnabled`: Boolean flag to control automatic smooth-scrolling to the active Ayah.

### 3.3. API Integration & URL Construction
1.  **Ayah-by-Ayah Mode (Husary, Ghamdi, Abbad):**
    *   When fetching a Surah, we fetch the audio metadata from Alquran.cloud: `https://api.alquran.cloud/v1/surah/${surahNumber}/${reciter.audioEditionId}`.
    *   Each Ayah's direct audio file is loaded from: `https://cdn.islamic.network/quran/audio/{bitrate}/{edition}/{ayahGlobalNumber}.mp3`.
2.  **Surah-by-Surah Mode (Al-Muhaisni, Al-Dukhin):**
    *   Since these reciters are only available at the Surah level, we load text/translation editions via a fallback text identifier (`quran-simple`) and load the audio files directly from MP3Quran servers:
        *   Muhammad Al-Muhaisni: `https://server11.mp3quran.net/mhsny/${surahNumberPad3}.mp3`
        *   Haitham Al-Dukhin: `https://server16.mp3quran.net/h_dukhain/Rewayat-Hafs-A-n-Assem/${surahNumberPad3}.mp3`

---

## 4. Edge Cases & Error Handling

### 4.1. Reciter Switching
*   If changing between two Ayah-mode reciters (e.g. Husary to Ghamdi), playback continues from the current `activeAyahNumber`.
*   If changing to/from a Surah-mode reciter, the playing audio pauses, and the player re-initializes to the new mode.

### 4.2. Network Interruption / Offline Mode
*   An error listener (`audio.onerror`) will monitor loading states.
*   If a network request fails, a local toast alert will display: *"عذراً، فشل تشغيل الصوت. يرجى التحقق من اتصالك بالإنترنت."* and the UI is reset gracefully to the paused state.

---

## 5. Verification & Testing Plan

### 5.1. Manual Verification
*   **Reciter Selection:** Verify changing reciters updates the UI and plays the correct audio file.
*   **Mishary Alafasy Exclusion:** Ensure no trace of Alafasy remains in the options or settings defaults.
*   **Ayah Highlights:** In Ayah mode, verify that the card matching the playing verse highlights with a premium glowing border.
*   **Auto-Scroll:** Verify that when the audio progresses to the next Ayah, the page scrolls smoothly to center the new Ayah card.
*   **Surah Seekbar:** In Surah mode, verify dragging the slider changes the playback position correctly.
*   **Offline Failure:** Disconnect network and ensure the failure toast displays instead of crashing.

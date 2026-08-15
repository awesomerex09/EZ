這是一份針對影片 00:10 處的 Splatter 轉場、精準影格時間軸，以及 WebGL 實時參數綁定所修正的 `Implementation Plan`。

這次的架構設計會專注在**打通編輯器設定與前端渲染引擎（Canvas/WebGL）之間的數據連動**，並確保你能在後台以「所見即所得」的方式一格格精準控制。

### 一、 目錄結構與資料流程 (Directory Structure & Data Flow)

為了支援影格級別的操作與 Splatter 特效，我們需要在原本的結構中新增專屬的素材與元件。

```text
project-root/
│
├── /builder-editor/          # 後台介面
│   └── /src/
│       ├── /components/
│       │   ├── FrameScrubber.js  # 【新增】視覺化影格選擇器 (Frame-by-frame 播放軌)
│       │   └── ...
│       └── /utils/
│           └── sequenceFetcher.js# 【新增】負責讀取 /public/sequence/ 中的圖片供編輯器預覽
│
└── /client-renderer/         # 前端渲染引擎
    ├── /public/
    │   └── /masks/
    │       └── splatter.mp4      # 【新增】黑白對比的墨水擴散影片 (或 sprite sheet)
    └── /src/
        ├── /effects/
        │   ├── SplatterTransition.js # 【新增】處理開頭的遮罩動畫
        │   └── CursorWebGL.js        # 【修正】負責接收並更新 Shader Uniforms
        └── configObserver.js         # 【新增】監聽 JSON 變動並實時派發更新事件

```

**資料流程修正 (Data Flow)：**

1. **Splatter 轉場流程**：網站載入時，`SplatterTransition.js` 會建立一個覆蓋全螢幕的頂層圖層，並使用 `/public/masks/splatter.mp4` 作為 CSS `mask-image`。配合 JavaScript 控制播放進度，達成黑色斑點拉開露出底部 Canvas 內容的效果。
2. **精準影格映射流程**：
* **後台**：`FrameScrubber` 組件會將 `[0% - 100%]` 的進度條，改為 `[Frame 1 - Frame N]` 的刻度。使用者滑動時間軸時，背景的毛玻璃底下會即時預覽對應的 WebP 圖片。字卡的時機將直接存為 `timing: { startFrame: 45, endFrame: 120 }`。
* **前端**：GSAP ScrollTrigger 的進度將直接對應到 Canvas 的影格索引。當觸發到 `Frame 45` 時，字卡動畫進場；觸發到 `Frame 120` 時，字卡退場。


3. **Cursor Hover 參數連動流程**：目前設定無效是因為 JSON 數值沒有正確傳遞給 WebGL 的 Shader（著色器）。後台更新數值時，`configObserver` 會攔截變動，並透過 `gl.uniform3f()` 或 `gl.uniform1f()` 直接將顏色與流體壓力寫入 GPU 記憶體中，讓畫布產生變化。

---

### 二、 核心模組虛擬碼 (Pseudocode)

以下針對你提到的三個痛點，提供核心的解決方案虛擬碼，供批次實作參考。

**1. Splatter 轉場特效 (`SplatterTransition.js`)**
使用 CSS Mask 結合影片/序列圖達成影片 00:10 的視覺效果。

```javascript
MODULE SplatterTransition:
  DEFINE overlay AS CREATE_ELEMENT('div')
  
  FUNCTION init():
    overlay.STYLE = {
      position: 'fixed',
      top: 0, left: 0, width: '100vw', height: '100vh',
      backgroundColor: '#000',      // 轉場前的底色
      maskImage: 'url(/masks/splatter.mp4)', // 黑白遮罩影片
      maskSize: 'cover',
      zIndex: 9999
    }
    APPEND overlay TO DOCUMENT.BODY
    
    // 監聽遮罩影片播放結束，移除圖層
    START_MASK_ANIMATION().ON_COMPLETE(() => {
      overlay.STYLE.display = 'none'
    })

```

**2. 影格級別時間軸 (`FrameScrubber.js`)**
讓編輯器可以直接檢視與選取影格。

```javascript
MODULE FrameScrubber:
  DEFINE totalFrames = AWAIT sequenceFetcher.getTotalFrames()
  DEFINE state = { startFrame: 0, endFrame: 100 }

  FUNCTION onScrubberDrag(currentFrameIndex):
    // 1. 預覽背景即時切換至該影格
    EDITOR_BACKGROUND.setImage(`/sequence/frame_${currentFrameIndex}.webp`)
    
  FUNCTION setCardTiming(cardId, action):
    IF action IS 'SET_START':
      UPDATE_JSON_CONFIG(cardId, { startFrame: getCurrentScrubberFrame() })
    IF action IS 'SET_END':
      UPDATE_JSON_CONFIG(cardId, { endFrame: getCurrentScrubberFrame() })

```

**3. WebGL 參數熱更新 (`CursorWebGL.js`)**
解決參數設定無效的問題，確保流體擴散與顏色能動態生效。

```javascript
MODULE CursorWebGL:
  DEFINE glContext AS INIT_WEBGL_CANVAS()
  DEFINE program AS COMPILE_SHADERS() // 包含流體模擬的 Shader

  // 提供一個更新介面給外部 (JSON Config) 呼叫
  FUNCTION updateSettings(fluidSettings):
    // 將 Hex 顏色轉換為 RGB (0.0 ~ 1.0) 傳入 GPU
    DEFINE rgb = HEX_TO_RGB(fluidSettings.color)
    glContext.uniform3f(program.uniforms.u_color, rgb.r, rgb.g, rgb.b)
    
    // 注入壓力與擴散範圍
    glContext.uniform1f(program.uniforms.u_pressure, fluidSettings.pressure)
    glContext.uniform1f(program.uniforms.u_radius, fluidSettings.radius)

  // 監聽設定檔改變事件
  EVENT_LISTENER('onConfigChange', (newConfig) => {
    updateSettings(newConfig.effects.cursorHover.fluidSettings)
  })

```

---

### 三、 執行步驟清單 (Medium-sized Modules for Batch Coding)

**Phase 1: 實作 Splatter 遮罩轉場 (Splatter Implementation)**

* 在 `/public/masks/` 中準備一個黑白斑點擴散的素材（影片或 Sprite 圖片）。
* 在前端引擎實作一個全螢幕的 `div` 遮罩層，套用 CSS `mask-image` 與 `-webkit-mask-image`。
* 在後台 UI 新增一個開關：當「啟用 Splatter 轉場」為 True 時，前端才在載入時渲染此遮罩層並執行轉場動畫。

**Phase 2: 開發精準影格時間軸 (Frame-level Timeline Scrubber)**

* 在後台編輯器新增一個橫向的時間軸元件。
* 撰寫一支小程式讀取 `/public/sequence/` 內的檔案數量，將時間軸的 `max` 值設為總影格數（例如 300 幀）。
* 當使用者拖動時間軸時，編輯器背景立刻載入並顯示對應的 `frame_xxxx.webp`。
* 在字卡設定面板中，加入「標記為開始影格」與「標記為結束影格」的按鈕，點擊後直接讀取當前時間軸的幀數並存入 JSON 設定檔的 `timing` 區塊。

**Phase 3: WebGL 實時參數綁定 (WebGL Parameter Sync)**

* 檢查目前的 WebGL Shader，確保裡面有宣告對應的 `uniform vec3 u_color;` 與 `uniform float u_radius;`。
* 實作狀態管理器（如 Zustand 或原生 EventBus），當後台編輯器的顏色選擇器（Color Picker）或滑桿（Slider）數值變更時，立即發送事件。
* 前端渲染引擎攔截事件後，調用 `gl.uniform...` 方法更新 GPU 記憶體，確保滑鼠再次移動時，流體的顏色與擴散效果會立刻依照新設定渲染。
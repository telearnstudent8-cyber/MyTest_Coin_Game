# 宇宙巡航機 - 網頁版部署說明 (GitHub Pages)

這是一個將原始 Pygame 遊戲完整移植至 HTML5/JavaScript 的版本。它專為 GitHub Pages 最佳化，具備極佳的視覺效果與流暢的操作體驗。

## 部署步驟

1. **建立新的 GitHub 儲存庫 (Repository)**：
   - 到 GitHub 建立一個新的專案，例如 `space-catch-game`。

2. **上傳檔案**：
   - 將 `web/` 資料夾內的所有內容（`index.html`、`assets/`、`css/`、`js/`）上傳到儲存庫的 **根目錄 (root)**。

3. **啟用 GitHub Pages**：
   - 進入儲存庫的 **Settings** 標籤。
   - 在左側選單選擇 **Pages**。
   - 在 **Build and deployment** 下的 **Branch**，選擇 `main` (或 `master`) 分支，資料夾選擇 `/ (root)`。
   - 點擊 **Save**。

4. **完成**：
   - 稍等幾分鐘後，GitHub 會提供一個網址（例如 `https://yourname.github.io/space-catch-game/`），你就可以直接在瀏覽器遊玩了！

## 技術特點

- **純 Vanilla JS**: 無需 node.js 或複雜的編譯過程。
- **Canvas API**: 實現高效能的 60FPS 遊戲渲染。
- **Glassmorphism UI**: 現代感的毛玻璃視窗設計。
- **Responsive Layout**: 自動適應主流桌面瀏覽器視窗。
- **SEO 最佳化**: 包含 meta 標籤與語意化 HTML。

## 操作說明

- **左右方向鍵**: 移動角色
- **空白鍵**: 跳躍
- **X 鍵**: 啟動護盾 (需從商店購買)
- **F 鍵**: 戰術格擋 (需從商店購買)
- **S 鍵**: 開啟/關閉商城

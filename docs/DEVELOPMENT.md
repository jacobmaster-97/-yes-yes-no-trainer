# 持續修改方式

## 直接在 GitHub 改文字或簡單設定

1. 開啟 `yes-yes-no-trainer.html`，按鉛筆圖示編輯。
2. 只修改需要的部分，寫清楚提交說明；較大的改動可開新分支及 Pull Request。
3. 透過提交紀錄檢查前後差異；如發現問題，可回復先前版本。
4. 下載新版 HTML 到本機，以瀏覽器驗證操作。

## 讓 Codex 繼續修改

在可存取此倉庫的 Codex 對話指定 GitHub 倉庫連結，說明要改的行為，例如：

> 在 yes-yes-no-trainer 保留單一離線 HTML，調整第一身視角或個人紀錄欄位，更新說明並跑測試。

GitHub 保存原始碼及版本；程式仍是本機執行。之前下載到裝置的 HTML 不會自動更新，需要重新下載。

## 在電腦測試

直接練習只需打開 HTML，不需要 Node.js。只有修改及跑自動化測試才需要以下工具。

1. 安裝 Node.js 20 或以上。
2. 在專案資料夾執行 `npm ci`。
3. 執行 `npx playwright install chromium`；Linux 缺系統依賴時按 Playwright 提示安裝。
4. 執行 `npm test`。

測試優先使用 `CHROMIUM_PATH` 指定的執行檔、其次 Linux 常見 Chromium 路徑；其餘使用 Playwright 的 Chromium。
例如 Linux：`CHROMIUM_PATH=/usr/bin/chromium npm test`。

測試會以本機來源攔截載入 HTML，並在離線狀態檢查完整流程、輸入、時間及匯出。這種方法兼容會封鎖 `file://` 的受管理瀏覽器；仍應在實際目標裝置手動檢查本機檔案開啟方式。產物放在 `.test-artifacts/`，不提交至 Git。

## 檔案

- `yes-yes-no-trainer.html`：程式本體，所有畫面、樣式和邏輯都內嵌。
- `README.md`：操作、評分、資料儲存、球速換算及限制。
- `CHANGELOG.md`：功能版本紀錄。
- `docs/specification.md`：V1 原始規格，實際需求以使用者最新指示為準。
- `docs/v2-design.md`：V2 第一身、物理及投後自評設計。
- `tests/`：完整流程、km/h 及暫停／逾時等回歸測試。
- `package.json`、`package-lock.json`：只用於開發測試，不是離線訓練的依賴。

## 網頁入口

`index.html` 是 GitHub Pages 入口，會以相對路徑開啟根目錄的單一 HTML；`.nojekyll` 關閉 Jekyll 處理。訓練程式仍只有一份，修改時改 `yes-yes-no-trainer.html` 即可。

Pages 必須由 GitHub 成功啟用（Settings → Pages → Deploy from a branch → main / root）才會發布；只有入口檔不代表網站已上線。可用性及設定權限由 GitHub 帳戶決定。

尚未提供雲端紀錄同步。不同網站來源／本機檔案的 localStorage 不共用，移到網頁版前可先匯出原有紀錄。

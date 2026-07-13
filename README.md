# 傳火計畫 Lit Fire

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/xieyaozhong/Lit-fire)

> 點擊上方按鈕，登入 Render 後確認 Blueprint，即可建立 HTTPS 網站。

這是一個手機優先的互動網頁：

1. 在中央圓形點火區，以不同節奏點擊至少 3 次。
2. 系統會依照速度、穩定度與長短變化，生成不同顏色與稀有度的火焰。
3. 兩支手機加入同一個 5 碼房間。
4. 傳火者選擇「我要傳火」，接收者選擇「我要接火」。
5. 兩台手機都啟用動作感測，輕碰手機邊緣或同時做一下短促晃動，即會傳遞同一組火焰資料。

## PWA 安裝

本專案已包含：

- `manifest.webmanifest`
- `service-worker.js`
- 主畫面圖示
- iPhone 加入主畫面提示
- Android／桌面瀏覽器安裝提示
- App Shell 離線快取

### iPhone／iPad

1. 使用 Safari 開啟部署後的 HTTPS 網址。
2. 點擊分享按鈕。
3. 選擇「加入主畫面」。
4. 從主畫面開啟「傳火」，即可使用獨立全螢幕模式。

### Android／桌面 Chrome

開啟網站後，點擊畫面下方的「立即安裝」，或使用瀏覽器選單的「安裝應用程式」。

> PWA 的畫面與點火功能可被快取；建立房間、加入房間及手機互傳仍需要網路連線與 Node.js 伺服器。

## 直接啟動

本專案不需要安裝任何第三方套件，只需要 Node.js 18 或更新版本。

```bash
npm start
```

瀏覽器開啟：

```text
http://localhost:3000
```

Windows 也可雙擊 `啟動傳火計畫.bat`；macOS / Linux 可執行：

```bash
chmod +x 啟動傳火計畫.command
./啟動傳火計畫.command
```

## 用兩支手機測試

### 方法一：部署到 HTTPS 網址（推薦）

把整個專案部署到支援 Node.js 的雲端服務，啟動指令設為：

```bash
npm start
```

服務會自動讀取雲端平台提供的 `PORT`。專案內含 `render.yaml` 與 `Dockerfile`，可用於雲端部署。HTTPS 網址最適合手機動作感測。

> GitHub Pages 只能提供靜態網頁，無法執行本專案的房間配對伺服器；完整的手機互傳功能需要 Node.js 主機。

### 方法二：同一個 Wi-Fi 內測試

1. 電腦與兩支手機連接同一個 Wi-Fi。
2. 電腦執行 `npm start`。
3. 查出電腦區域網路 IP，例如 `192.168.1.10`。
4. 兩支手機都開啟 `http://192.168.1.10:3000`。
5. 若瀏覽器因為非 HTTPS 而不提供動作感測，可先用畫面中的「模擬碰撞」測試完整傳火流程。

## 為什麼不是直接使用 NFC？

目前手機網頁的 Web NFC 主要用來讀寫 NDEF NFC 標籤，且瀏覽器支援度有限，無法保證 iPhone 與 Android 瀏覽器之間直接進行穩定的點對點 NFC 傳輸。因此本版本採用：

- 手機加速度感測器判定「碰撞」
- 同一房間中的兩個碰撞事件在 1.7 秒內配對
- 伺服器將傳火者的火焰資料複製給接收者

使用者體驗仍是「兩支手機輕碰後傳火」，而且可以跨 iPhone／Android 測試。

## 火焰規則

- **疾風火**：平均點擊間隔很短，藍色系。
- **夢燼**：平均點擊間隔很長，紫粉色系。
- **恆星火**：節奏穩定，橙紅色系。
- **森靈火**：長短間隔差異明顯，綠色系。
- **星火**：有變化但不極端，金白色系。

## 專案結構

```text
Lit-fire/
├─ server.js
├─ package.json
├─ Dockerfile
├─ render.yaml
├─ 啟動傳火計畫.bat
├─ 啟動傳火計畫.command
├─ .github/workflows/package-pwa.yml
└─ public/
   ├─ index.html
   ├─ styles.css
   ├─ app.js
   ├─ pwa-install.js
   ├─ service-worker.js
   ├─ manifest.webmanifest
   └─ icon.svg
```

## 自動產生完整 ZIP

GitHub Actions 會在 PWA 分支建立 Pull Request 時執行語法檢查，並產生：

```text
Lit-fire-PWA-complete.zip
```

可在該次 GitHub Actions 執行頁面的 Artifacts 區域下載。

## 注意事項

- 房間資料儲存在伺服器記憶體，伺服器重新啟動後會清除。
- 本版本適合活動原型、展覽互動與概念驗證。
- 真正公開活動若有大量使用者，可再把房間資料改存 Redis 或資料庫。
- 請讓手機邊緣輕碰即可，不要用力撞擊螢幕。

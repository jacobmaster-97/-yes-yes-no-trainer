# V2 設計及資料

## 最新用途

個人訓練紀錄，使用者在每球後自行判定正確／錯誤。系統獨立分類好壞球，自評後才揭示；預設球速範圍 50–80 km/h。不以遊戲分數或搶答為核心。

## 狀態

`READY → WINDUP → BALL_IN_FLIGHT → REVIEW`

- `WINDUP` 為 1100 ms，過渡時保留多出的時間，避免以重設時間拖慢來球。
- `BALL_IN_FLIGHT` 依數值物理的實際秒數播放，最後保留很短、按到壘速度計算的過壘段。
- `REVIEW` 先保存 `selfRating: null` 及客觀分類；使用者自評後解鎖下一球。
- 暫停凍結同一條軌跡；重看不新增紀錄。畫面靜止時不反覆重繪 Canvas。
- 自評使用明確修改入口，避免重複按鍵覆蓋第一個選擇。每球資料按 id 唯一保存。

## 座標與物理

右手座標：x 左右、y 離地高度、z 向投手延伸；本壘平面為 z=0。相機位於本壘後方，依中性／左右打及眼高投影。

設定的 km/h 是初速向量的長度。水平方向以放球點至落點的水平向量決定；解低仰角初始方向，使球在固定速度、重力和可選阻力下到達落點。

使用 RK4 與二分求解初始角度；最終位置只修正數值積分的微小殘差，不會按自評／出棒選擇改動球路。每步軌跡以時間內插至瀏覽器當前時刻。球與區域共用透視投影，縮放或旋轉不改變米制判定。

## 每球資料（主要欄位）

```js
{
  id: 'p001', sequence: 1,
  endpoint: { x: 0.1, y: 0.9 },
  release: { x: 0.22, y: 1.8, z: 16.64 },
  releaseSpeedKmh: 65,
  arrivalSpeedKmh: 61,
  pitchDurationMs: 1000,
  releaseDistanceM: 16.64,
  dragCoefficient: 0.006,
  initialVelocity: { x: 0, y: 3, z: -17 },
  arrivalVelocity: { x: 0, y: -6, z: -15 },
  isStrike: true,
  isAttackable: true,
  isProtectable: true,
  dangerous: false,
  systemRecommendation: 'GO',
  selfRating: null, // 由使用者改為 true / false
  userAction: null, // 投後選填 GO / NO
  note: '',
  pitchedAt: '...', ratedAt: null
}
```

上例數字為欄位示意，實際速度及時間必須由求解器計算。歷史及匯出不包含逐幀 samples；當組重看及草稿續練按相同設定與種子重建。

`systemRecommendation` 只是區域策略參考；不是使用者自評，不能用它改寫 `selfRating`。

## 儲存兼容

V2 用獨立 key 保存設定、40 組完整／部分歷史及一組草稿。V1 資料只讀及備份，不把原有 `correct` 欄位遷移成自評。頁面關閉前尚未通過本壘的球不視為已投，重新繼續會重投該球。

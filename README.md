# Arcade的航海星球 · 公开演示

这是“Arcade的航海星球”的静态公开演示版，适合部署到 GitHub Pages。首页、日程、听歌画像、三餐、日记和航海报告可在浏览器中体验。首次访问使用虚构的示例数据；访客修改的内容仅保存在自己的浏览器 `localStorage` 中。打印可保存 PDF，Word 按钮导出 `.doc` 文件。

本机版本中的网易云、番茄 ToDo、一本日记自动同步需要运行在用户电脑上的 Node.js 服务，未包含在此静态版本中。公开仓库不包含私人记录、登录凭据、Cookie 或同步配置。

## 本地预览

在本目录运行 `python3 -m http.server 8080`，访问 `http://127.0.0.1:8080/`。

## GitHub Pages

将本目录作为独立仓库推送到 GitHub，然后在仓库 Settings → Pages 中选择 Deploy from a branch、`main`、`/(root)`。

背景素材来自原项目的 Unsplash 图库。演示数据中的歌曲、歌手和日记内容均为虚构。

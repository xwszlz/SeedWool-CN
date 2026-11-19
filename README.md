# SeedWool .cn 中国站 · V3（战略重构版）

## 目录
- 12 个正式页 + 404：`index / substrate / rice / seedling / other / rockwool / yaas / standards / global / about / contact / verify / privacy / 404`
- `assets/css/tokens.css`：设计令牌与全部组件样式（单一文件，无构建）
- `assets/js/app.js`：渲染层（占比条 / 产品 / 批次验真 / 询盘弹层）
- `assets/data/*.json`：sectors / products / assets_ip / yaas / exports / route_map / indicators / batches
- `assets/img/`：WebP + JPEG fallback

## 部署
1. 把本目录**全部文件**复制到 `xwszlz/SeedWool-CN` 仓库根目录（index.html 必须在根）
2. `git add . && git commit -m "..." && git push` → Vercel 自动发布
3. 提交 `https://seedwool.cn/sitemap.xml` 到百度站长平台

## 数据更新（不需要改 HTML）
产品/板块/批次等数据在 `assets/data/*.json`，改完 push 即生效。
页面同时内联一份数据（`<script type="application/json">`）以保证首屏与 SEO，
若改 JSON 需同步重新运行生成器，或直接改内联块（二选一，勿只改一处造成不一致）。

### 口径铁律（改动时务必遵守）
- `ledger: A` 才计入 14 万吨 / 20 亿口径；`ledger: B`（建筑岩棉）单列，**禁止混算**
- `target_vs_actual` 必填；2029 产能/营收一律标 `target`
- 专利身份：经专利权人授权使用，**不得写成"自主拥有"**
- 农用基质与建筑绝热岩棉分属不同标准体系，不可互作验收依据

## 待办
- ICP 备案号下来后，把全站页脚「ICP 备案办理中 · 过渡期展示」替换为真实号并链接 beian.miit.gov.cn

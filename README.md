# SeedWool seedwool.cn 静态站上线包

## 一、上线步骤（Vercel）
1. 把本目录内**所有文件**复制到仓库 `xwszlz/SeedWool-CN` 的 `main` 分支根目录（index.html 必须在根）。
2. `git add . && git commit -m "site: SeedWool UI v2" && git push origin main`。
3. Vercel 会自动构建发布（纯静态，无需 build 命令）；确认域名 `seedwool.cn` 指向该项目。
4. 上线后提交 `https://seedwool.cn/sitemap.xml` 到百度站长平台。

## 二、备案（重要）
- 当前页脚为「ICP 备案办理中 · 过渡期展示」，**没有放假备案号**。
- 备案通过后：把每个页面 footer 里的 `icp-pending` 那一行替换为真实备案号并链接到 https://beian.miit.gov.cn（搜索 `ICP 备案办理中` 即可定位，共 6 个页面）。
- 备案需要境内服务器：过渡期用 Vercel，通过后请迁至境内 ECS/轻量服务器；本目录文件可直接上传，无需改动。

## 三、内容更新
- 产品：编辑 `assets/data/products.json`（一期图来自阿里，二期换自有系统导出同结构 JSON，前端零改动）。
- 指标 / 批次 / 论文：分别编辑 `indicators.json` / `batches.json` / `papers.json`。
- 数据看板与验真的接口抽象层在 `assets/js/data-adapter.js`；未来接 API 只改 `DataSource.type` 与 `base`，页面不用改。
- **所有指标均标注"工程示意值"，请勿把示意值改成未经检测认证的"实测"数据对外宣传。**

## 四、询盘
- 全站询盘统一走邮件：1207560536@qq.com（弹层、吸底条、页脚三处）。当前无在线表单、无二维码。
- 目前没有微信二维码，也没有在线报价；报价一律邮件人工回复。

## 五、文件结构
```
index.html  rice.html  soon-*.html（4 个占位页）
assets/css/tokens.css + blocks.css（两站同源）
assets/js/data-adapter.js + app.js
assets/data/products.json + indicators.json + batches.json + papers.json
assets/img/*.webp + *.jpg（原图 fallback）
sitemap.xml  robots.txt  vercel.json
```

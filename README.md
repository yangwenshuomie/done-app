# Done App

个人效率追踪工具。记录已完成的事项、管理待办、查看统计分析。支持多用户，Google 账号登录，数据安全隔离。

线上地址：**https://donelist-app.web.app/**

---

## 技术栈

- 前端：Vite + React + TypeScript
- 后端：Firebase Firestore（数据存储）、Firebase Auth（Google 登录）、Firebase Hosting（部署）

---

## 功能说明

### 日程页

- **左栏**：当天已完成事项，按记录时间倒序排列
- **右栏**：待办事项列表
- **顶部日期条**：点击切换日期，有记录的日期下方有圆点；右侧日历图标可打开月历选择器

### 记录完成事项

点击右下角 **+** 按钮，打开记录面板：

- 填写事项内容
- 可选分类标签（支持自定义分类，长按可删除）
- 时长：手动输入（小时 / 分钟），或点击计时器按钮开始秒表计时
- 保存后显示在当天已完成列表

### 管理已完成事项

长按（移动端）或右键（桌面端）已完成事项，弹出操作菜单：

- **编辑**：修改内容、分类、时长
- **恢复为待办**：将该条记录转回待办列表
- **删除**：永久删除该条记录

### 添加待办

点击待办栏底部"添加待办…"按钮：

- 填写待办内容
- 可选分类标签
- 可选提醒时间（hh:mm）
- 点击待办左侧圆形按钮 → 标记完成，移入已完成列表
- 点击右侧 × → 删除待办

### 统计页

底部导航切换至统计页：

- **时间段**：今天 / 近7天 / 本月 / 今年
- **摘要卡片**：完成件数、总时长、连续打卡天数
- **图表类型**：
  - 圆弧图：各分类时长占比 + 件数占比
  - 条形图：各分类时长对比 + 件数对比

### 顶部数据

Header 右侧实时显示今天完成数 / 全部历史总计数。

### 数据管理

点击右上角 **···** 菜单：

| 选项 | 说明 |
|------|------|
| 备份数据 | 导出完整 JSON 备份文件至本地 |
| 从备份恢复 | 从 JSON 文件恢复（**替换**当前所有数据） |
| 导出 Widget 数据 | 导出供 Scriptable iOS 小组件使用的 JSON |
| 退出登录 | 注销当前 Google 账号 |

---

## 多用户数据隔离

所有数据存储在 `users/{uid}/...` 路径下。Firestore 安全规则强制要求：

- 必须登录（`request.auth != null`）
- 只能读写自己的数据（`request.auth.uid == userId`）

不同账号的数据完全隔离，互不可见。

---

## 部署指南

### 环境变量

在项目根目录创建 `.env`（参考 `.env.example`）：

```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=donelist-app.web.app
VITE_FIREBASE_PROJECT_ID=donelist-app
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

> **注意**：`VITE_FIREBASE_AUTH_DOMAIN` 必须填写 Firebase Hosting 的 `.web.app` 域名，不能使用 `.firebaseapp.com`（原因见下方登录修复记录）。

### 一次性配置

```bash
# 1. 部署 Firestore 安全规则
npx firebase-tools deploy --only firestore:rules

# 2. Firebase Console → Authentication → Sign-in method → Google → 启用

# 3. GCP Console → APIs & Services → Credentials → OAuth 2.0 Client
#    Authorized redirect URIs 添加：
#    https://donelist-app.web.app/__/auth/handler
```

### 构建并部署

```bash
npm run build
npx firebase-tools deploy --only hosting
```

---

## 登录问题修复记录

### 症状

Google 登录后，App 内容短暂闪现，随即跳回登录页面。

### 根本原因

Chrome 的**存储分区（Storage Partitioning）**机制。

Firebase Auth 内部通过一个隐藏 iframe（来源：`donelist-app.firebaseapp.com`）读取和持久化认证 session。当 App 托管在 `donelist-app.web.app` 时，该 iframe 属于跨域第三方，Chrome 阻断其存储访问。结果：认证状态短暂建立后立即被清除，触发 `onAuthStateChanged` 回调由 `User` → `null`，导致 App 跳回登录页。

### 修复步骤

**① 修改 `authDomain`**，使其与托管域名一致，消除跨域问题：

```
# .env
VITE_FIREBASE_AUTH_DOMAIN=donelist-app.web.app
```

Firebase Auth 的隐藏 iframe 将从同域加载，Chrome 不再限制其存储访问。

**② 将登录方式改为 `signInWithRedirect`**（`src/hooks/useAuth.ts`）：

相比 `signInWithPopup`，redirect 方式在移动端及受限浏览器环境中更稳定。

**③ 在 GCP 注册新的 Redirect URI**：

`authDomain` 变更后，Google OAuth 回调地址随之从 `donelist-app.firebaseapp.com/__/auth/handler` 变为 `donelist-app.web.app/__/auth/handler`，必须在 GCP 注册才能通过 Google 的 OAuth 验证。

GCP Console → APIs & Services → Credentials → OAuth 2.0 Client ID → Authorized redirect URIs → 添加：

```
https://donelist-app.web.app/__/auth/handler
```

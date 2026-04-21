# 当前开发状态

## 部署状态

线上地址：https://donelist-app.web.app/

- Firestore rules 已部署 ✓
- Firebase Auth Google 已启用 ✓
- Firebase Hosting 已部署 ✓
- 登录问题已修复 ✓

## 多用户隔离

`useFirestore(userId)` — 所有路径用 `users/${userId}/...`

Firestore rules（已部署）：
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## 登录修复关键配置

`.env` 须用 `.web.app` 域名作 authDomain：
```
VITE_FIREBASE_AUTH_DOMAIN=donelist-app.web.app
```

GCP Console 已注册 redirect URI：
```
https://donelist-app.web.app/__/auth/handler
```

## 精通页面

底部导航第四 tab「精通」。最多 5 目标，每目标可绑定多个分类（`tags: string[]`），显示 1000 格横向拖拽矩阵（1格=10小时，末格显示半填充进度）。

改动文件：
- `src/types.ts` — `MasteryGoal.tag→tags[]`
- `src/hooks/useFirestore.ts` — goals 加载时迁移旧 `tag` 字段
- `src/components/MasteryView.tsx` — 横向拖拽网格、半格进度、多分类选择
- `src/styles.css` — grid 横向滚动样式

## 本地开发模式

`VITE_LOCAL_MODE=true`（`.env.development.local`）跳过 Firebase Auth，用 localStorage 存数据，首次自动注入种子数据。

- `src/hooks/useLocalStore.ts` — localStorage 实现，与 `useFirestore` 接口一致
- `src/App.tsx` — `LOCAL_MODE` 标志切换 hook

待办：本次改动部署至 Firebase Hosting（`firebase deploy`）。

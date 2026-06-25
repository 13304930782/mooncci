# Mooncci Blog / Mooncci 博客

Mooncci is a personal blog and classroom video review system. It includes article publishing, comments, media management, announcements, admin tools, and a class-based video scoring workflow for Software 24-7 to Software 24-10.

Mooncci 是一个个人博客与课堂视频评审系统，包含文章发布、评论、媒体库、公告、后台管理，以及面向软件 24-7 到软件 24-10 四个班级的视频评分流程。

## Features / 功能

- Blog posts, comments, announcements, media library, and site settings.
- Admin roles, teacher video-review role, user management, password reset, user/IP blocking.
- Class video entrances for Software 24-7, 24-8, 24-9, and 24-10.
- Public classroom scoring with name, class, group number, duplicate-checking, and self-group scoring prevention.
- Teacher/admin scoring controls, score details, group-based ranking, CSV export, and operation logs.
- Video sources: local upload, direct MP4 link, or third-party embed.
- API rate-limit configuration and province-level IP location display.

- 博客文章、评论、公告、媒体库和站点设置。
- 后台角色、教师视频评审角色、用户管理、密码重置、用户/IP 屏蔽。
- 软件 24-7、24-8、24-9、24-10 四个班级视频入口。
- 免登录课堂评分，支持姓名、班级、组号、重复评分检查和禁止本组自评。
- 教师/管理员评分开关、评分明细、按组统计、CSV 导出和操作日志。
- 视频来源支持本地上传、外部 MP4 直链、第三方嵌入。
- API 限流配置和省份级 IP 属地显示。

## Tech Stack / 技术栈

- Frontend: React, Vite, Tailwind CSS
- Backend: Node.js, Express
- Database: MySQL
- Process manager: PM2

- 前端：React、Vite、Tailwind CSS
- 后端：Node.js、Express
- 数据库：MySQL
- 进程管理：PM2

## Local Development / 本地开发

Install frontend dependencies:

安装前端依赖：

```bash
npm install
```

Install backend dependencies:

安装后端依赖：

```bash
cd server
npm install
cp .env.example .env
cd ..
```

Start frontend:

启动前端：

```bash
npm run dev
```

Start backend:

启动后端：

```bash
cd server
npm run dev
```

The backend listens on port `3001` by default. API routes are under `/api`.

后端默认监听 `3001` 端口，API 路径前缀为 `/api`。

## Build / 构建

```bash
npm install
cd server && npm install && cd ..
npm run build
```

## Server Deployment / 服务器部署

Pull the latest code:

拉取最新代码：

```bash
cd /www/wwwroot/mooncci-source
git checkout main
git pull origin main
```

Install backend dependencies and check syntax:

安装后端依赖并检查语法：

```bash
cd server
npm install
node -c src/index.js
node -c src/routes/videos.js
```

Build frontend and sync static files:

构建前端并同步静态文件：

```bash
cd /www/wwwroot/mooncci-source
npm install
npm run build
rsync -a --delete --exclude='.user.ini' /www/wwwroot/mooncci-source/dist/ /www/wwwroot/mooncci.site/
```

Restart backend:

重启后端：

```bash
su -s /bin/bash mooncci -c "cd /www/wwwroot/mooncci-source/server && pm2 restart mooncci-api --update-env"
```

## Environment Variables / 环境变量

The backend reads `server/.env`. Do not commit `.env`.

后端读取 `server/.env`，不要提交 `.env`。

Common variables:

常用变量：

```env
PORT=3001
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=mooncci_site
DB_PASSWORD=your_password
DB_NAME=mooncci_site
DB_CONNECTION_LIMIT=40
API_RATE_LIMIT_MAX=2000
API_RATE_LIMIT_WINDOW_MS=60000
SITE_URL=https://mooncci.site
COOKIE_DOMAIN=.mooncci.site
```

## Notes / 说明

- Keep `server/.env`, PM2 config, Nginx config, and deployment secrets out of Git.
- For classroom use, keep videos on the media server or external direct links instead of serving large videos from the 3 Mbps web server.
- If IP locations look stale, restart the backend after installing dependencies because province lookup uses the `ip2region` package.

- 请勿把 `server/.env`、PM2 配置、Nginx 配置和部署密钥提交到 Git。
- 课堂视频建议放在媒体服务器或外部直链，不要让 3Mbps 的网站服务器直接承载大视频流量。
- 如果 IP 属地显示仍然旧，安装依赖后重启后端；省份识别依赖 `ip2region`。

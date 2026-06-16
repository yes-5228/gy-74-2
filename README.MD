# 美容院护理套餐系统

FastAPI + React 实现的美容院护理套餐管理系统，覆盖套餐项目管理、护理套餐组合、疗程次数管理、预约服务和到期提醒。

## 功能模块

- 套餐项目管理：维护护理项目名称、分类、时长、价格和说明。
- 护理套餐：组合项目并设置套餐价格、有效期和包含次数。
- 疗程次数管理：为客户开通疗程卡，记录总次数、已用次数、剩余次数和到期日。
- 预约服务：创建护理预约，关联护理项目、客户疗程和美容师。
- 到期提醒：按有效期筛选即将到期或已过期的客户疗程。

## 项目结构

```text
.
├── backend
│   ├── app
│   │   ├── api          # FastAPI 路由模块
│   │   ├── core         # 配置和数据库连接
│   │   ├── models       # SQLAlchemy 模型
│   │   ├── schemas      # Pydantic 入参/出参
│   │   └── services     # 业务逻辑
│   ├── Dockerfile
│   └── requirements.txt
├── frontend
│   ├── src
│   │   ├── api          # API 客户端
│   │   ├── components   # 通用组件
│   │   └── pages        # 业务页面
│   ├── Dockerfile
│   └── package.json
└── docker-compose.yml
```

## Docker 启动

```bash
docker compose up --build
```

Docker 构建后端镜像时默认使用清华 PyPI 镜像，减少 `pip install` 因官方 PyPI 访问不稳定导致的 SSL/超时失败。如需改回官方源或公司内网源：

```bash
set PIP_INDEX_URL=https://pypi.org/simple
set PIP_TRUSTED_HOST=
docker compose build --no-cache backend
docker compose up -d
```

如果仍然超时，优先确认 Docker Desktop 的网络代理/DNS 配置，或替换为可访问的 pip 镜像源。

访问地址：

- 前端：http://localhost:5173
- 后端健康检查：http://localhost:8000/health
- API 文档：http://localhost:8000/docs

注意：业务页面在前端端口 `5173`，不要用 `8000` 端口打开页面。`8000` 是后端 API 服务，业务接口统一带 `/api` 前缀，例如 `http://localhost:8000/api/service-items`。

## 本地开发启动

后端：

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

前端：

```bash
cd frontend
npm install
npm run dev -- --host 127.0.0.1 --port 5173
```

## 主要接口

- `GET /api/service-items`：护理项目列表
- `POST /api/service-items`：新增护理项目
- `GET /api/packages`：套餐列表
- `POST /api/packages`：新增套餐
- `GET /api/treatment-plans`：疗程卡列表
- `PATCH /api/treatment-plans/{id}/consume`：扣减一次疗程
- `GET /api/appointments`：预约列表
- `POST /api/appointments`：创建预约
- `GET /api/reminders?days=30`：到期提醒

应用首次启动会自动创建 SQLite 数据库并写入演示数据。

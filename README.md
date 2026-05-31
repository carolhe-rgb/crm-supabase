# 移民代理 CRM

基于 Next.js + Supabase 的移民代理客户管理系统。

## 功能

- 客户管理（Client Management）
- 签证类型追踪（Visa Type Tracking）
- 申请状态管理（Application Status）
- 服务费追踪（Service Fee Tracking）
- 紧急标记（Urgent Flag）
- 报表导出（CSV / Excel）
- 代理业绩统计（Agent Performance Dashboard）
- 权限管理（Manager / Agent）

## 签证类型支持

- Subclass 500 - Student
- Subclass 189 - Skilled Independent
- Subclass 190 - Skilled Nominated
- Subclass 491 - Skilled Regional
- Subclass 482 - Temporary Skill Shortage
- Subclass 186 - Employer Nomination
- Subclass 820/801 - Partner Onshore
- Subclass 309/100 - Partner Offshore
- Subclass 143 - Contributory Parent
- Subclass 485 - Temporary Graduate
- Subclass 600 - Visitor
- Subclass 417/462 - Working Holiday
- Other

## 申请状态

- Consultation → Contract Signed → Application Lodged → Processing → Further Information Required → Granted / Refused / Withdrawn

## 部署

### 数据库迁移

从留学招生 CRM 迁移到移民代理 CRM，需要在 Supabase SQL Editor 执行：

```sql
-- 创建新表 clients
CREATE TABLE IF NOT EXISTS clients (
  id TEXT PRIMARY KEY,
  client_name TEXT NOT NULL,
  agent TEXT,
  visa_type TEXT,
  status TEXT DEFAULT 'Consultation',
  lodgement_date DATE,
  decision_date DATE,
  service_fee INTEGER DEFAULT 0,
  payment_status TEXT DEFAULT 'Unpaid',
  paid_at TIMESTAMPTZ,
  source TEXT DEFAULT 'Referral',
  notes TEXT,
  is_urgent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 启用行级安全
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Allow all" ON clients FOR ALL USING (true) WITH CHECK (true);
```

### 环境变量

在 Vercel 项目设置中添加：

- `NEXT_PUBLIC_SUPABASE_URL` = 你的 Supabase Project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` = 你的 Supabase Anon Key

### 本地开发

```bash
npm install
npm run dev
```

## 登录账号

| 角色 | 用户名 | 密码 |
|------|--------|------|
| 管理员 | Manager | admin123 |
| 代理 | David | ozsky2022 |
| 代理 | Ming | ozsky0722 |
| 代理 | Jett | Ozsky2025 |

## 技术栈

- Next.js 13.5
- React 18
- Supabase
- Tailwind CSS

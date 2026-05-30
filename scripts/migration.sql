-- 移民代理 CRM - 数据库迁移
-- 创建新表 clients，保留旧表 students 作为备份

CREATE TABLE IF NOT EXISTS clients (
  id TEXT PRIMARY KEY,
  client_name TEXT NOT NULL,
  agent TEXT,
  visa_type TEXT,
  status TEXT DEFAULT 'Enquiry',
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

-- 为现有数据创建备份表（如果还没有）
CREATE TABLE IF NOT EXISTS students_backup AS SELECT * FROM students WHERE 1=0;

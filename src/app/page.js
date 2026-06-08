'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

// ==================== Mock 数据 ====================
const MOCK_DATA = [
  { id: "IMM-2025-0001", client_name: "张三", agent: "David GUO", visa_type: "Subclass 189 - Skilled Independent", source: "Client Referral", status: "Application Lodged", lodgement_date: "2025-03-15", due_date: "", service_fee: 5500, gst_free: false, payment_status: "Deposit Paid", paid_at: null, notes: "IT 职业评估已完成", is_urgent: false, created_at: "2025-03-10T08:00:00Z" },
  { id: "IMM-2025-0002", client_name: "李四", agent: "Yulan HE", visa_type: "Subclass 500 - Student", source: "Walk-in / Call-in", status: "Consultation", lodgement_date: "", due_date: "", service_fee: 3000, gst_free: false, payment_status: "Unpaid", paid_at: null, notes: "等待成绩单", is_urgent: true, created_at: "2025-03-12T10:00:00Z" },
  { id: "IMM-2025-0003", client_name: "王五", agent: "Shuoren CHEN", visa_type: "Subclass 820/801 - Partner Onshore", source: "Walk-in / Call-in", status: "Granted", lodgement_date: "2024-11-20", due_date: "2025-02-28", service_fee: 4500, gst_free: true, payment_status: "Fully Paid", paid_at: "2025-01-15T09:00:00Z", notes: "配偶签证顺利下签", is_urgent: false, created_at: "2024-11-15T08:00:00Z" },
  { id: "IMM-2025-0004", client_name: "赵六", agent: "David GUO", visa_type: "Subclass 190 - Skilled Nominated", source: "Walk-in / Call-in", status: "Processing", lodgement_date: "2025-01-10", due_date: "2025-06-30", service_fee: 6000, gst_free: false, payment_status: "Partially Paid", paid_at: null, notes: "塔州州担保已获邀", is_urgent: false, created_at: "2025-01-05T08:00:00Z" },
  { id: "IMM-2025-0005", client_name: "陈七", agent: "Yulan HE", visa_type: "Subclass 143 - Contributory Parent", source: "Client Referral", status: "Consultation", lodgement_date: "", due_date: "", service_fee: 8000, gst_free: false, payment_status: "Unpaid", paid_at: null, notes: "初步咨询，等待材料清单", is_urgent: false, created_at: "2025-03-20T14:00:00Z" }
]

const USE_MOCK = false  // 设置为 true 使用 mock 数据，false 连接 Supabase

// ==================== 常量配置 ====================
const STATUSES = [
  "Consultation",
  "Contract Signed",
  "Application Lodged",
  "Processing",
  "Further Information Required",
  "Granted",
  "Refused",
  "Withdrawn"
]

const VISA_TYPES = [
  "Subclass 500 - Student",
  "Subclass 189 - Skilled Independent",
  "Subclass 190 - Skilled Nominated",
  "Subclass 491 - Skilled Regional",
  "Subclass 482 - Temporary Skill Shortage",
  "Subclass 186 - Employer Nomination",
  "Subclass 820/801 - Partner Onshore",
  "Subclass 309/100 - Partner Offshore",
  "Subclass 143 - Contributory Parent",
  "Subclass 485 - Temporary Graduate",
  "Subclass 600 - Visitor",
  "Subclass 417/462 - Working Holiday",
  "Skill Assessment",
  "Subclass 101 - Child (Offshore)",
  "Subclass 802 - Child (Onshore)",
  "Subclass 445 - Dependent Child (Temporary)",
  "Subclass 102 - Adoption",
  "Subclass 117 - Orphan Relative",
  "Subclass 835 - Remaining Relative",
  "Subclass 115 - Remaining Relative (Offshore)",
  "Subclass 010 - Bridging Visa A",
  "Subclass 020 - Bridging Visa B",
  "Subclass 030 - Bridging Visa C",
  "Subclass 050 - Bridging Visa E",
  "ART Review",
  "Other"
]

const SOURCES = [
  "Walk-in / Call-in",
  "Internal Office Referral",
  "Agent / Partner Referral",
  "Client Referral",
  "Previous Client",
  "Sunnybank David",
  "Sunnybank Jett",
  "Sunnybank Ming",
  "Gold Coast Office",
  "Adelaide Office",
  "Brisbane Bill",
  "Other"
]

const AGENTS = ["David GUO", "Yulan HE", "Shuoren CHEN", "Susie YANG"]

const PAYMENT_STATUSES = ["Unpaid", "Deposit Paid", "Partially Paid", "Fully Paid", "Refunded"]

function verifyLogin(name, password) {
  if (name === "Manager" && password === "admin123") {
    return { role: "manager", agent: null }
  }
  const agentPasswords = {
    "David GUO": "ozsky2022",
    "Yulan HE": "ozsky0722",
    "Shuoren CHEN": "Ozsky2025",
    "Susie YANG": "Ozsky2025"
  }
  if (AGENTS.includes(name) && agentPasswords[name] === password) {
    return { role: "agent", agent: name }
  }
  return null
}

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [loginForm, setLoginForm] = useState({ name: "", password: "" })
  const [loginError, setLoginError] = useState("")
  const [user, setUser] = useState({ role: "", agent: "" })
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("clients")
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [filters, setFilters] = useState({ 
    search: "", 
    status: "All", 
    source: "All", 
    visaType: "All",
    agent: "All",
    year: "All", 
    paymentStatus: "All" 
  })

  const [formData, setFormData] = useState({
    id: "", clientName: "", agent: "", visaType: "",
    source: "Walk-in / Call-in", status: "Consultation", lodgementDate: "", 
    dueDate: "", serviceFee: "", gstFree: false, paymentStatus: "Unpaid",
    notes: "", isUrgent: false
  })

  useEffect(() => {
    const savedUser = localStorage.getItem("crm_user")
    if (savedUser) {
      const parsed = JSON.parse(savedUser)
      setUser(parsed)
      setIsLoggedIn(true)
    }
  }, [])

  function handleLogin(e) {
    e.preventDefault()
    const result = verifyLogin(loginForm.name, loginForm.password)
    if (result) {
      setUser(result)
      setIsLoggedIn(true)
      localStorage.setItem("crm_user", JSON.stringify(result))
      setLoginError("")
    } else {
      setLoginError("用户名或密码错误")
    }
  }

  function handleLogout() {
    setIsLoggedIn(false)
    setUser({ role: "", agent: "" })
    localStorage.removeItem("crm_user")
  }

  useEffect(() => {
    if (isLoggedIn) {
      loadData()
    }
  }, [isLoggedIn])

  async function loadData() {
    setLoading(true)
    
    if (USE_MOCK) {
      // Mock 数据模式
      let data = [...MOCK_DATA]
      if (user.role === "agent") {
        data = data.filter(c => c.agent === user.agent)
      }
      setClients(data)
      setLoading(false)
      return
    }
    
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false })

    if (!error) {
      let filtered = data || []
      if (user.role === "agent") {
        filtered = filtered.filter(c => c.agent === user.agent)
      }
      setClients(filtered)
    }
    setLoading(false)
  }

  async function saveClient(client) {
    if (USE_MOCK) {
      const saveAgent = user.role === "manager" ? client.agent : user.agent
      const shouldCancelUrgent = ["Granted", "Refused", "Withdrawn"].includes(client.status)
      const today = new Date().toISOString().slice(0, 10)
      const autoLodgementDate = (client.status === "Application Lodged" && !client.lodgementDate) ? today : (client.lodgementDate || null)
      const autoDueDate = (client.status === "Further Information Required" && !client.dueDate) ? new Date(Date.now() + 28*86400000).toISOString().slice(0, 10) : (client.dueDate || null)
      const newId = client.id || await generateClientID()
      const newClient = {
        id: newId,
        client_name: client.clientName,
        agent: saveAgent,
        visa_type: client.visaType,
        source: client.source,
        status: client.status,
        lodgement_date: autoLodgementDate,
        due_date: autoDueDate,
        service_fee: Number(client.serviceFee || 0),
        payment_status: client.paymentStatus || "Unpaid",
        paid_at: null,
        notes: client.notes,
        is_urgent: shouldCancelUrgent ? false : (client.status === "Further Information Required" ? true : (client.isUrgent || false)),
        created_at: new Date().toISOString()
      }
      
      if (editingId) {
        const existing = clients.find(c => c.id === editingId)
        if (existing) {
          newClient.created_at = existing.created_at
        }
        setClients(clients.map(c => c.id === editingId ? newClient : c))
      } else {
        setClients([newClient, ...clients])
      }
      setModalOpen(false)
      return
    }
    
    const old = editingId ? clients.find(c => c.id === editingId) : null
    const saveAgent = user.role === "manager" ? client.agent : user.agent
    const shouldCancelUrgent = ["Granted", "Refused", "Withdrawn"].includes(client.status)
    const finalIsUrgent = shouldCancelUrgent ? false : (client.status === "Further Information Required" ? true : (client.isUrgent || false))
    
    // Auto-fill lodgement date when status becomes Application Lodged
    const today = new Date().toISOString().slice(0, 10)
    const autoLodgementDate = (client.status === "Application Lodged" && !client.lodgementDate) ? today : (client.lodgementDate || null)
    const autoDueDate = (client.status === "Further Information Required" && !client.dueDate) ? new Date(Date.now() + 28*86400000).toISOString().slice(0, 10) : (client.dueDate || null)

    // 新增记录时，从数据库查询生成唯一ID
    const finalId = editingId ? client.id : (client.id || await generateClientID())

    const payload = {
      id: finalId,
      client_name: client.clientName,
      agent: saveAgent,
      visa_type: client.visaType,
      source: client.source,
      status: client.status,
      lodgement_date: autoLodgementDate,
      due_date: autoDueDate,
      service_fee: Number(client.serviceFee || 0),
      gst_free: client.gstFree || false,
      payment_status: client.paymentStatus || "Unpaid",
      paid_at: old?.paid_at || null,
      notes: client.notes,
      is_urgent: finalIsUrgent
    }

    const { error } = await supabase.from('clients').upsert(payload, { onConflict: 'id' })
    if (!error) {
      await loadData()
      setModalOpen(false)
    }
  }

  async function deleteClient(id) {
    if (!confirm('确定删除？')) return
    
    if (USE_MOCK) {
      setClients(clients.filter(c => c.id !== id))
      return
    }
    
    await supabase.from('clients').delete().eq('id', id)
    await loadData()
  }

  function exportToCSV(data, filename) {
    if (data.length === 0) { alert('没有数据可导出'); return }
    const headers = ['ID', 'Client Name', 'Agent', 'Visa Type', 'Source', 'Status',
      'Lodgement Date', 'Due Date', 'Service Fee (AUD)', 'GST Free',
      'Payment Status', 'Paid At', 'Notes', 'Is Urgent', 'Created At']
    const rows = data.map(c => [
      c.id, c.client_name, c.agent, c.visa_type, c.source, c.status,
      c.lodgement_date || '', c.due_date || '', c.service_fee || 0,
      c.gst_free ? 'Yes' : 'No',
      c.payment_status || 'Unpaid', c.paid_at ? fmtDateTime(c.paid_at) : '',
      c.payment_status || 'Unpaid', c.paid_at ? fmtDateTime(c.paid_at) : '',
      (c.notes || '').replace(/"/g, '""'), c.is_urgent ? 'Yes' : 'No',
      fmtDateTime(c.created_at)
    ])
    const csv = [headers, ...rows].map(row => row.map(cell => {
      const str = String(cell || '')
      if (str.includes(',') || str.includes('\n') || str.includes('"')) {
        return `"${str.replace(/"/g, '""')}"`
      }
      return str
    }).join(',')).join('\n')
    downloadFile(csv, `${filename}.csv`, 'text/csv;charset=utf-8;')
  }

  function exportToExcel(data, filename) {
    if (data.length === 0) { alert('没有数据可导出'); return }
    const headers = ['ID', 'Client Name', 'Agent', 'Visa Type', 'Source', 'Status',
      'Lodgement Date', 'Due Date', 'Service Fee (AUD)', 'GST Free',
      'Payment Status', 'Paid At', 'Notes', 'Created At']
    const rows = data.map(c => `<tr>
      <td>${c.id}</td><td>${c.client_name}</td><td>${c.agent}</td>
      <td>${c.visa_type || ''}</td><td>${c.source}</td><td>${c.status}</td>
      <td>${c.lodgement_date || ''}</td><td>${c.due_date || ''}</td>
      <td>${c.service_fee || 0}</td><td>${c.gst_free ? 'Yes' : 'No'}</td>
      <td>${c.payment_status || 'Unpaid'}</td><td>${c.paid_at ? fmtDateTime(c.paid_at) : ''}</td>
      <td>${(c.notes || '').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</td>
      <td>${fmtDateTime(c.created_at)}</td>
    </tr>`).join('')
    const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head><meta charset="UTF-8"><style>
        table { border-collapse: collapse; }
        th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
        th { background-color: #2563eb; color: white; font-weight: bold; }
        tr:nth-child(even) { background-color: #f8fafc; }
      </style></head><body>
      <table><thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>
      <tbody>${rows}</tbody></table></body></html>`
    downloadFile(html, `${filename}.xls`, 'application/vnd.ms-excel;charset=utf-8;')
  }

  function downloadFile(content, filename, mimeType) {
    const blob = new Blob(['\ufeff' + content], { type: mimeType })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(link.href)
  }

  async function markPaymentStatus(id, newStatus) {
    const c = clients.find(x => x.id === id)
    if (user.role === "agent" && c.agent !== user.agent) return
    
    if (USE_MOCK) {
      setClients(clients.map(item => item.id === id ? {
        ...item,
        payment_status: newStatus,
        paid_at: newStatus === "Fully Paid" ? new Date().toISOString() : null
      } : item))
      return
    }
    
    await supabase.from('clients').update({
      payment_status: newStatus,
      paid_at: newStatus === "Fully Paid" ? new Date().toISOString() : null
    }).eq('id', id)
    await loadData()
  }

  async function toggleUrgent(id) {
    const c = clients.find(x => x.id === id)
    if (user.role === "agent" && c.agent !== user.agent) { alert("您只能标记自己的客户"); return }
    
    if (USE_MOCK) {
      setClients(clients.map(item => item.id === id ? { ...item, is_urgent: !item.is_urgent } : item))
      return
    }
    
    const { error } = await supabase.from('clients').update({ is_urgent: !c.is_urgent }).eq('id', id)
    if (error) { alert('更新失败: ' + error.message); return }
    await loadData()
  }

  async function generateClientID() {
    const year = new Date().getFullYear()
    const regex = new RegExp(`^IMM-${year}-(\\d{4})$`)
    let maxNum = 0
    // 从数据库查询最新ID，避免并发冲突
    const { data } = await supabase.from('clients').select('id')
      .ilike('id', `IMM-${year}-%`)
      .order('id', { ascending: false })
      .limit(100)
    if (data) {
      data.forEach(c => {
        const m = String(c.id || "").match(regex)
        if (m) maxNum = Math.max(maxNum, Number(m[1]))
      })
    }
    return `IMM-${year}-${String(maxNum + 1).padStart(4, "0")}`
  }

  function getRecordYear(c) {
    if (c.id && /^IMM-\d{4}-\d{4}$/.test(c.id)) return c.id.slice(4, 8)
    if (c.lodgement_date) return String(new Date(c.lodgement_date).getFullYear())
    return "Unknown"
  }

  async function openModal(editId = null) {
    setEditingId(editId)
    if (editId) {
      const c = clients.find(x => x.id === editId)
      setFormData({
        id: c.id, clientName: c.client_name, agent: c.agent,
        visaType: c.visa_type || "", source: c.source, status: c.status,
        lodgementDate: c.lodgement_date || "", dueDate: c.due_date || "",
        serviceFee: c.service_fee, gstFree: c.gst_free || false, paymentStatus: c.payment_status,
        notes: c.notes || "", isUrgent: c.is_urgent || false
      })
    } else {
      setFormData({
        id: "", clientName: "", agent: user.role === "manager" ? AGENTS[0] : user.agent,
        visaType: "", source: "Walk-in / Call-in", status: "Consultation",
        lodgementDate: "", dueDate: "", serviceFee: "", gstFree: false,
        paymentStatus: "Unpaid", notes: "", isUrgent: false
      })
    }
    setModalOpen(true)
  }

  async function handleSave() { await saveClient(formData) }

  function currency(n) {
    return new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD", maximumFractionDigits: 0 }).format(Number(n || 0))
  }

  function fmtDateTime(v) {
    if (!v) return "-"
    const d = new Date(v)
    if (isNaN(d.getTime())) return "-"
    return new Intl.DateTimeFormat("en-AU", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }).format(d)
  }

  const visibleClients = clients.filter(c => {
    if (filters.search && !((c.client_name || "").toLowerCase().includes(filters.search.toLowerCase()) ||
      (c.visa_type || "").toLowerCase().includes(filters.search.toLowerCase()) ||
      (c.id || "").toLowerCase().includes(filters.search.toLowerCase()) ||
      (c.notes || "").toLowerCase().includes(filters.search.toLowerCase()))) return false
    if (filters.status !== "All" && c.status !== filters.status) return false
    if (filters.source !== "All" && c.source !== filters.source) return false
    if (filters.visaType !== "All" && c.visa_type !== filters.visaType) return false
    if (filters.year !== "All" && getRecordYear(c) !== filters.year) return false
    if (filters.agent !== "All" && c.agent !== filters.agent) return false
    if (filters.paymentStatus !== "All" && c.payment_status !== filters.paymentStatus) return false
    return true
  })

  const granted = visibleClients.filter(c => c.status === "Granted")
  const active = visibleClients.filter(c => !["Granted", "Refused", "Withdrawn"].includes(c.status))
  const totalFee = visibleClients.reduce((a, c) => a + (c.service_fee || 0), 0)
  const paidFee = visibleClients.filter(c => c.payment_status === "Fully Paid").reduce((a, c) => a + (c.service_fee || 0), 0)
  const gstTotal = visibleClients.filter(c => !c.gst_free).reduce((a, c) => a + ((c.service_fee || 0) / 11), 0)
  const years = [...new Set(clients.map(getRecordYear))].sort((a, b) => String(b).localeCompare(String(a)))

  function getStatusColor(status) {
    const colors = {
      "Granted": "#10b981", "Refused": "#ef4444", "Withdrawn": "#6b7280",
      "Consultation": "#3b82f6", "Contract Signed": "#06b6d4",
      "Application Lodged": "#6366f1", "Processing": "#0ea5e9",
      "Further Information Required": "#f97316"
    }
    return colors[status] || "#64748b"
  }

  if (!isLoggedIn) {
    return (
      <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div className="card" style={{ maxWidth: '400px', width: '100%', padding: '32px', overflow: 'hidden' }}>
          <h1 style={{ textAlign: 'center', marginBottom: '8px' }}>移民代理 CRM</h1>
          <p style={{ textAlign: 'center', color: '#64748b', marginBottom: '24px' }}>OzSky Immigration</p>
          <form onSubmit={handleLogin}>
            <div className="field" style={{ marginBottom: '16px' }}>
              <label>用户名</label>
              <div style={{ position: 'relative' }}>
                <select value={loginForm.name} onChange={e => setLoginForm({...loginForm, name: e.target.value})} style={{ width: '100%', padding: '8px 36px 8px 12px', borderRadius: '6px', border: '1px solid #e2e8f0', appearance: 'none', WebkitAppearance: 'none', MozAppearance: 'none', background: '#fff' }} required>
                  <option value="">请选择</option>
                  <option value="Manager">Manager</option>
                  {AGENTS.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
                <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#64748b', fontSize: '12px' }}>▼</span>
              </div>
            </div>
            <div className="field" style={{ marginBottom: '24px' }}>
              <label>密码</label>
              <input type="password" placeholder="输入密码" value={loginForm.password} onChange={e => setLoginForm({...loginForm, password: e.target.value})} style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #e2e8f0' }} required />
            </div>
            {loginError && <div style={{ color: '#dc2626', marginBottom: '16px', textAlign: 'center' }}>{loginError}</div>}
            <button type="submit" className="btn" style={{ width: '100%' }}>登录</button>
          </form>
        </div>
      </div>
    )
  }

  if (loading) return <div className="page"><p>加载中...</p></div>

  return (
    <div className="page">
      <div className="header card">
        <div>
          <h1>移民代理 CRM</h1>
          <p>{user.role === "manager" ? "管理员视图 - 查看全部数据" : `代理视图 - ${user.agent}`}</p>
        </div>
        <div className="header-actions">
          <div style={{ textAlign: 'right', marginRight: '16px' }}>
            <div style={{ fontWeight: 600 }}>{user.role === "manager" ? "Manager" : user.agent}</div>
            <button onClick={handleLogout} style={{ fontSize: '12px', color: '#64748b', background: 'none', border: 'none', cursor: 'pointer' }}>退出登录</button>
          </div>
          <button className="btn" onClick={() => openModal()}>新增客户</button>
        </div>
      </div>

      <div className="kpis">
        <div className="card kpi">
          <div className="kpi-title">客户总数</div>
          <div className="kpi-value">{visibleClients.length}</div>
          <div className="kpi-sub">{user.role === "manager" ? "全公司数据" : "我的客户"}</div>
        </div>
        <div className="card kpi">
          <div className="kpi-title">已下签</div>
          <div className="kpi-value" style={{ color: '#10b981' }}>{granted.length}</div>
          <div className="kpi-sub">成功率 {visibleClients.length ? Math.round(granted.length / visibleClients.length * 100) : 0}%</div>
        </div>
        <div className="card kpi">
          <div className="kpi-title">处理中</div>
          <div className="kpi-value">{active.length}</div>
          <div className="kpi-sub">活跃案件</div>
        </div>
        <div className="card kpi">
          <div className="kpi-title">服务费总额（含GST）</div>
          <div className="kpi-value">{currency(totalFee)}</div>
          <div className="kpi-sub">已收款 {currency(paidFee)}</div>
        </div>
        <div className="card kpi">
          <div className="kpi-title">GST总额</div>
          <div className="kpi-value">{currency(gstTotal)}</div>
          <div className="kpi-sub">{user.role === "manager" ? "全公司数据" : "我的客户"}</div>
        </div>
      </div>

      <div className="tabs">
        <button className={`tab ${activeTab === "clients" ? "active" : ""}`} onClick={() => setActiveTab("clients")}>Clients</button>
        {user.role === "manager" && <button className={`tab ${activeTab === "dashboard" ? "active" : ""}`} onClick={() => setActiveTab("dashboard")}>Dashboard</button>}
        <button className={`tab ${activeTab === "settings" ? "active" : ""}`} onClick={() => setActiveTab("settings")}>Settings</button>
      </div>

      {activeTab === "clients" && (
        <div className="card">
          <div className="section-head">
            <div className="filters" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '8px' }}>
              <input placeholder="搜索客户 / 签证类型 / ID" value={filters.search} onChange={e => setFilters({...filters, search: e.target.value})} />
              <select value={filters.status} onChange={e => setFilters({...filters, status: e.target.value})}>
                <option value="All">All Status</option>{STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <select value={filters.visaType} onChange={e => setFilters({...filters, visaType: e.target.value})}>
                <option value="All">All Visa Types</option>{VISA_TYPES.map(v => <option key={v} value={v}>{v}</option>)}
              </select>
              <select value={filters.source} onChange={e => setFilters({...filters, source: e.target.value})}>
                <option value="All">All Sources</option>{SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              {user.role === "manager" && (
                <select value={filters.agent} onChange={e => setFilters({...filters, agent: e.target.value})}>
                  <option value="All">All Agents</option>{AGENTS.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              )}
              <select value={filters.paymentStatus} onChange={e => setFilters({...filters, paymentStatus: e.target.value})}>
                <option value="All">Payment Status</option>{PAYMENT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <select value={filters.year} onChange={e => setFilters({...filters, year: e.target.value})}>
                <option value="All">All Years</option>{years.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>

          {user.role === "manager" && (
            <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', padding: '12px', background: '#f8fafc', borderRadius: '12px', alignItems: 'center' }}>
              <span style={{ fontWeight: 600, color: '#475569' }}>📊 报表导出:</span>
              <button className="btn secondary" onClick={() => exportToCSV(visibleClients, `CRM-Immigration-${new Date().toISOString().split('T')[0]}`)} style={{ padding: '8px 14px', fontSize: '14px' }}>📄 导出 CSV</button>
              <button className="btn secondary" onClick={() => exportToExcel(visibleClients, `CRM-Immigration-${new Date().toISOString().split('T')[0]}`)} style={{ padding: '8px 14px', fontSize: '14px' }}>📑 导出 Excel</button>
              <span style={{ color: '#64748b', fontSize: '13px', marginLeft: 'auto' }}>共 {visibleClients.length} 条记录</span>
            </div>
          )}

          <div style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
            <table style={{ width: '100%', border: 'none' }}>
              <thead>
                <tr>
                  <th style={{minWidth: '90px', padding: '8px 6px'}}>Case ID</th>
                  <th style={{minWidth: '100px', padding: '8px 6px'}}>Client</th>
                  {user.role === "manager" && <th style={{minWidth: '60px', padding: '8px 6px'}}>Agent</th>}
                  <th style={{minWidth: '160px', padding: '8px 6px'}}>Visa Type</th>
                  <th style={{minWidth: '90px', padding: '8px 6px'}}>Status</th>
                  <th style={{minWidth: '110px', padding: '8px 6px'}}>Dates</th>
                  <th style={{minWidth: '100px', padding: '8px 6px'}}>Fee / Payment</th>
                  <th style={{minWidth: '130px', padding: '8px 6px'}}>Notes</th>
                  <th style={{minWidth: '280px', padding: '8px 6px'}}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {visibleClients.map(c => (
                  <tr key={c.id}>
                    <td style={{padding: '6px'}}>
                      <span style={{ color: !!c.is_urgent ? '#dc2626' : 'inherit', fontWeight: !!c.is_urgent ? '700' : '500', background: !!c.is_urgent ? '#fef2f2' : 'transparent', padding: !!c.is_urgent ? '2px 6px' : '0', borderRadius: !!c.is_urgent ? '4px' : '0', border: !!c.is_urgent ? '1px solid #fecaca' : 'none' }}>
                        {c.id}{!!c.is_urgent && ' 🔥'}
                      </span>
                    </td>
                    <td style={{padding: '6px'}}>
                      <div><strong>{c.client_name}</strong></div>
                      <div style={{color:"#64748b"}}>{c.source}</div>
                    </td>
                    {user.role === "manager" && <td style={{padding: '6px'}}>{c.agent}</td>}
                    <td style={{padding: '6px'}}>
                      <div>{c.visa_type || "-"}</div>
                      <div style={{color:"#64748b"}}>{c.lodgement_date ? c.lodgement_date : 'Not lodged'}</div>
                    </td>
                    <td style={{padding: '6px'}}>
                      <span style={{ display: 'inline-block', padding: '3px 8px', borderRadius: '6px', fontWeight: 600, backgroundColor: getStatusColor(c.status) + '20', color: getStatusColor(c.status) }}>{c.status}</span>
                    </td>
                    <td style={{padding: '6px', lineHeight: '1.4'}}>
                      <div><span style={{color: '#64748b'}}>Lodgement date:</span> {c.lodgement_date || "-"}</div>
                      <div><span style={{color: '#64748b'}}>Due date:</span> {c.due_date ? <span style={{ color: new Date(c.due_date) < new Date() && c.status === 'Under Review' ? '#dc2626' : 'inherit', fontWeight: new Date(c.due_date) < new Date() && c.status === 'Under Review' ? '600' : '400' }}>{c.due_date}{new Date(c.due_date) < new Date() && c.status === 'Under Review' && ' ⚠️'}</span> : "-"}</div>
                    </td>
                    <td style={{padding: '6px'}}>
                      <div>{currency(c.service_fee)}</div>
                      <div style={{marginTop: '2px'}}>
                        <span style={{ display: 'inline-block', padding: '1px 4px', borderRadius: '4px', backgroundColor: (() => { switch(c.payment_status) { case 'Fully Paid': return '#10b98120'; case 'Unpaid': return '#ef444420'; case 'Deposit Paid': return '#3b82f620'; case 'Partially Paid': return '#f59e0b20'; case 'Refunded': return '#6b728020'; default: return '#e2e8f020'; } })(), color: (() => { switch(c.payment_status) { case 'Fully Paid': return '#10b981'; case 'Unpaid': return '#ef4444'; case 'Deposit Paid': return '#3b82f6'; case 'Partially Paid': return '#f59e0b'; case 'Refunded': return '#6b7280'; default: return '#64748b'; } })() }}>{c.payment_status}</span>
                      </div>
                    </td>
                    <td style={{padding: '6px'}}>
                      <div style={{ color: '#475569', lineHeight: '1.3', whiteSpace: 'pre-wrap', wordBreak: 'break-word'}}>
                        {c.notes ? (c.notes.length > 80 ? c.notes.substring(0, 80) + '...' : c.notes) : <span style={{color: '#94a3b8'}}>-</span>}
                      </div>
                    </td>
                    <td style={{padding: '6px', minWidth: '280px'}}>
                      <div style={{display: 'flex', gap: '4px', flexWrap: 'wrap'}}>
                        <button className="small-btn" onClick={() => openModal(c.id)} style={{padding: '5px 8px', fontSize: '12px', whiteSpace: 'nowrap'}}>Edit</button>
                        <button className="small-btn" onClick={() => toggleUrgent(c.id)} style={{padding: '5px 8px', fontSize: '12px', whiteSpace: 'nowrap', background: !!c.is_urgent ? '#fef2f2' : '#fff', borderColor: !!c.is_urgent ? '#ef4444' : '#e2e8f0', color: !!c.is_urgent ? '#dc2626' : '#64748b'}} title={!!c.is_urgent ? "取消紧急标记" : "标记为紧急"}>{!!c.is_urgent ? '🔥 取消紧急' : '标记紧急'}</button>
                        {user.role === "manager" && <button className="small-btn danger" onClick={() => deleteClient(c.id)} style={{padding: '5px 8px', fontSize: '12px', whiteSpace: 'nowrap'}}>Delete</button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "dashboard" && user.role === "manager" && (
        <>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', padding: '12px', background: '#f8fafc', borderRadius: '12px', alignItems: 'center' }}>
            <span style={{ fontWeight: 600, color: '#475569' }}>📊 全部数据导出:</span>
            <button className="btn secondary" onClick={() => exportToCSV(clients, `CRM-All-Data-${new Date().toISOString().split('T')[0]}`)} style={{ padding: '8px 14px', fontSize: '14px' }}>📄 导出全部 CSV</button>
            <button className="btn secondary" onClick={() => exportToExcel(clients, `CRM-All-Data-${new Date().toISOString().split('T')[0]}`)} style={{ padding: '8px 14px', fontSize: '14px' }}>📑 导出全部 Excel</button>
            <span style={{ color: '#64748b', fontSize: '13px', marginLeft: 'auto' }}>全部 {clients.length} 条记录</span>
          </div>

          <div className="dashboard-grid">
            <div className="card">
              <h2>签证状态分布</h2>
              {STATUSES.map(st => {
                const count = clients.filter(c => c.status === st).length
                const total = clients.length || 1
                const pct = Math.round(count / total * 100)
                return (
                  <div className="pipeline-row" key={st}>
                    <div style={{display:"flex",justifyContent:"space-between"}}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: getStatusColor(st) }}></span>{st}
                      </span>
                      <span style={{color:"#64748b"}}>{count} clients</span>
                    </div>
                    <div className="progress"><div style={{width:`${pct}%`, backgroundColor: getStatusColor(st)}}></div></div>
                  </div>
                )
              })}
            </div>
            <div className="card">
              <h2>代理业绩排行</h2>
              {AGENTS.map((a, i) => {
                const mine = clients.filter(c => c.agent === a)
                const granted = mine.filter(c => c.status === "Granted")
                const fee = granted.reduce((sum, c) => sum + (c.service_fee || 0), 0)
                const successRate = mine.length ? Math.round(granted.length / mine.length * 100) : 0
                return (
                  <div className="rank-card" key={a}>
                    <div style={{display:"flex",justifyContent:"space-between",gap:12}}>
                      <div>
                        <div style={{fontSize:12,color:"#64748b"}}>#{i+1}</div>
                        <div style={{fontWeight:700}}>{a}</div>
                        <div style={{fontSize:12,color:"#64748b"}}>{granted.length} granted / {mine.length} clients ({successRate}%)</div>
                      </div>
                      <div style={{fontWeight:700}}>{currency(fee)}</div>
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="card">
              <h2>签证类型分布</h2>
              {VISA_TYPES.filter(v => clients.some(c => c.visa_type === v)).map(v => {
                const count = clients.filter(c => c.visa_type === v).length
                return (
                  <div key={v} style={{display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f1f5f9'}}>
                    <span>{v}</span><span style={{color: '#64748b', fontWeight: 600}}>{count}</span>
                  </div>
                )
              })}
            </div>
            <div className="card">
              <h2>月度统计</h2>
              {(() => {
                const monthly = {}
                clients.forEach(c => {
                  if (c.lodgement_date) {
                    const month = c.lodgement_date.slice(0, 7)
                    monthly[month] = (monthly[month] || 0) + 1
                  }
                })
                return Object.entries(monthly).sort((a, b) => b[0].localeCompare(a[0])).map(([month, count]) => (
                  <div key={month} style={{display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f1f5f9'}}>
                    <span>{month}</span><span style={{color: '#64748b', fontWeight: 600}}>{count} lodged</span>
                  </div>
                ))
              })()}
            </div>
          </div>
        </>
      )}

      {activeTab === "settings" && (
        <div className="settings-grid">
          <div className="card">
            <h2>我的信息</h2>
            <div className="info-box">
              <p><strong>角色：</strong>{user.role === "manager" ? "管理员" : "代理"}</p>
              {user.role === "agent" && <p><strong>代理名字：</strong>{user.agent}</p>}
              <p><strong>客户总数：</strong>{clients.length}</p>
              <p><strong>已下签：</strong>{clients.filter(c => c.status === "Granted").length}</p>
              <p><strong>活跃案件：</strong>{clients.filter(c => !["Granted", "Refused", "Withdrawn"].includes(c.status)).length}</p>
            </div>
          </div>
        </div>
      )}

      {modalOpen && (
        <div className="modal" onClick={e => e.target === e.currentTarget && setModalOpen(false)}>
          <div className="modal-card">
            <div className="modal-head">
              <h3>{editingId ? "Edit client" : "Add new client"}</h3>
              <button className="icon-btn" onClick={() => setModalOpen(false)}>✕</button>
            </div>
            <div className="form-grid">
              <div className="field"><label>Case ID</label><input value={formData.id} disabled /></div>
              <div className="field"><label>Client name</label><input value={formData.clientName} onChange={e => setFormData({...formData, clientName: e.target.value})} /></div>
              {user.role === "manager" && (
                <div className="field">
                  <label>Agent</label>
                  <select value={formData.agent} onChange={e => setFormData({...formData, agent: e.target.value})}>{AGENTS.map(a => <option key={a} value={a}>{a}</option>)}</select>
                </div>
              )}
              <div className="field">
                <label>Visa type</label>
                <select value={formData.visaType} onChange={e => setFormData({...formData, visaType: e.target.value})}>
                  <option value="">Select visa type</option>{VISA_TYPES.map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
              <div className="field">
                <label>Lead source</label>
                <select value={formData.source} onChange={e => setFormData({...formData, source: e.target.value})}>{SOURCES.map(s => <option key={s} value={s}>{s}</option>)}</select>
              </div>
              <div className="field">
                <label>Status</label>
                <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>{STATUSES.map(s => <option key={s} value={s}>{s}</option>)}</select>
              </div>
              <div className="field"><label>Lodgement date</label><input type="date" value={formData.lodgementDate} onChange={e => setFormData({...formData, lodgementDate: e.target.value})} /></div>
              <div className="field"><label>Due date</label><input type="date" value={formData.dueDate} onChange={e => setFormData({...formData, dueDate: e.target.value})} /></div>
              <div className="field" style={{ display: 'flex', alignItems: 'flex-end', gap: '12px' }}>
                <div style={{ flex: 1 }}>
                  <label>Service fee (AUD)</label>
                  <input type="number" value={formData.serviceFee} onChange={e => setFormData({...formData, serviceFee: e.target.value})} />
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', paddingBottom: '6px', whiteSpace: 'nowrap' }}>
                  <input type="checkbox" checked={formData.gstFree} onChange={e => setFormData({...formData, gstFree: e.target.checked})} style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
                  <span style={{ color: formData.gstFree ? '#10b981' : '#475569', fontWeight: formData.gstFree ? '600' : '400' }}>GST Free</span>
                </label>
              </div>
              <div className="field">
                <label>Payment status</label>
                <select value={formData.paymentStatus} onChange={e => setFormData({...formData, paymentStatus: e.target.value})}>{PAYMENT_STATUSES.map(p => <option key={p} value={p}>{p}</option>)}</select>
              </div>
              <div className="field" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input type="checkbox" checked={formData.isUrgent} onChange={e => setFormData({...formData, isUrgent: e.target.checked})} style={{ width: '20px', height: '20px', cursor: 'pointer' }} />
                  <span style={{ color: formData.isUrgent ? '#dc2626' : '#475569', fontWeight: formData.isUrgent ? '600' : '400' }}>🔥 标记为紧急</span>
                </label>
              </div>
              <div className="field full"><label>Notes</label><textarea rows={4} value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} /></div>
            </div>
            <div className="modal-actions">
              <button className="btn secondary" onClick={() => setModalOpen(false)}>Cancel</button>
              <button className="btn" onClick={handleSave}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

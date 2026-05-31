"use client"

import React, { useState, useEffect, useCallback } from 'react'
import { createClient } from '@supabase/supabase-js'

const USE_MOCK = false
const AGENTS = ['David GUO', 'Yulan HE', 'Shuoren CHEN', 'Susie YANG']
const SOURCES = [
  "Walk-in / Call-in",
  "Internal Office Referral",
  "Agent / Partner Referral",
  "Client Referral",
  "Previous Client",
  "Other"
]
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
const MOCK_DATA = [
  { id: "IMM-2025-0001", client_name: "张三", agent: "David GUO", visa_type: "Subclass 189 - Skilled Independent", source: "Client Referral", status: "Application Lodged", lodgement_date: "2025-03-15", due_date: "", service_fee: 5500, gst_free: false, payment_status: "Deposit Paid", paid_at: null, notes: "IT 职业评估已完成", is_urgent: false, created_at: "2025-03-10T08:00:00Z" },
  { id: "IMM-2025-0002", client_name: "李四", agent: "Yulan HE", visa_type: "Subclass 500 - Student", source: "Walk-in / Call-in", status: "Consultation", lodgement_date: "", due_date: "", service_fee: 3000, gst_free: false, payment_status: "Unpaid", paid_at: null, notes: "等待成绩单", is_urgent: true, created_at: "2025-03-12T10:00:00Z" },
  { id: "IMM-2025-0003", client_name: "王五", agent: "Shuoren CHEN", visa_type: "Subclass 820/801 - Partner Onshore", source: "Walk-in / Call-in", status: "Granted", lodgement_date: "2024-11-20", due_date: "2025-02-28", service_fee: 4500, gst_free: true, payment_status: "Fully Paid", paid_at: "2025-01-15T09:00:00Z", notes: "配偶签证顺利下签", is_urgent: false, created_at: "2024-11-15T08:00:00Z" },
  { id: "IMM-2025-0004", client_name: "赵六", agent: "David GUO", visa_type: "Subclass 190 - Skilled Nominated", source: "Walk-in / Call-in", status: "Processing", lodgement_date: "2025-01-10", due_date: "2025-06-30", service_fee: 6000, gst_free: false, payment_status: "Partially Paid", paid_at: null, notes: "塔州州担保已获邀", is_urgent: false, created_at: "2025-01-05T08:00:00Z" },
  { id: "IMM-2025-0005", client_name: "陈七", agent: "Yulan HE", visa_type: "Subclass 143 - Contributory Parent", source: "Client Referral", status: "Consultation", lodgement_date: "", due_date: "", service_fee: 8000, gst_free: false, payment_status: "Unpaid", paid_at: null, notes: "初步咨询，等待材料清单", is_urgent: false, created_at: "2025-03-20T14:00:00Z" }
]

export default function Home() {
  const [user, setUser] = useState(null)
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("clients")
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [filters, setFilters] = useState({ search: "", status: "All", source: "All", visaType: "All", agent: "All", year: "All", paymentStatus: "All" })
  const [supabase] = useState(() => USE_MOCK ? null : createClient(
    'https://kradmsacvsnwzsaexydh.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtyYWRtc2FjdnNud3pzYWV4eWRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAxMDA2NjAsImV4cCI6MjA5NTY3NjY2MH0.uy9i4_oTEqzwKYbjtliqZEktL-TMKFsgRlHChXW-rg8'
  ))
  const [formData, setFormData] = useState({
    id: "", clientName: "", agent: "", visaType: "",
    source: "Walk-in / Call-in", status: "Consultation", lodgementDate: "", 
    dueDate: "", serviceFee: "", gstFree: false, paymentStatus: "Unpaid",
    notes: "", isUrgent: false
  })

  useEffect(() => {
    checkUser()
    loadData()
  }, [])

  async function checkUser() {
    if (USE_MOCK) { setUser({ role: "manager", name: "Mock Admin" }); return }
    const token = new URLSearchParams(window.location.hash.slice(1)).get('access_token')
    if (!token) { showLogin(); return }
    const { data } = await supabase.auth.getSession()
    if (data?.session) {
      const role = data.session.user.email === "manager@immigration.com" ? "manager" : "agent"
      const nameMap = {
        "david.guo@ozsky.com": "David GUO",
        "yulan.he@ozsky.com": "Yulan HE",
        "shuoren.chen@ozsky.com": "Shuoren CHEN",
        "susie.yang@ozsky.com": "Susie YANG"
      }
      setUser({ role, name: nameMap[data.session.user.email] || data.session.user.user_metadata?.full_name || "Agent", agent: nameMap[data.session.user.email] })
    } else { showLogin() }
  }

  function showLogin() {
    if (supabase) supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } })
  }

  async function loadData() {
    setLoading(true)
    if (USE_MOCK) {
      await new Promise(r => setTimeout(r, 500))
      setClients(MOCK_DATA)
      setLoading(false)
      return
    }
    const { data, error } = await supabase.from('clients').select('*').order('created_at', { ascending: false })
    if (!error) {
      let filtered = data || []
      if (user.role === "agent") { filtered = filtered.filter(c => c.agent === user.agent) }
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
      const newClient = {
        id: client.id,
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
        is_urgent: shouldCancelUrgent ? false : (client.isUrgent || false),
        created_at: new Date().toISOString()
      }
      if (editingId) {
        const existing = clients.find(c => c.id === editingId)
        if (existing) { newClient.created_at = existing.created_at }
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
    const finalIsUrgent = shouldCancelUrgent ? false : (client.isUrgent || false)
    
    const today = new Date().toISOString().slice(0, 10)
    const autoLodgementDate = (client.status === "Application Lodged" && !client.lodgementDate) ? today : (client.lodgementDate || null)
    const autoDueDate = (client.status === "Further Information Required" && !client.dueDate) ? new Date(Date.now() + 28*86400000).toISOString().slice(0, 10) : (client.dueDate || null)

    const payload = {
      id: client.id,
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
    if (!error) { await loadData(); setModalOpen(false) }
  }

  async function deleteClient(id) {
    if (!confirm('确定删除？')) return
    if (USE_MOCK) { setClients(clients.filter(c => c.id !== id)); return }
    await supabase.from('clients').delete().eq('id', id)
    await loadData()
  }

  async function markPaymentStatus(id, newStatus) {
    const c = clients.find(x => x.id === id)
    if (user.role === "agent" && c.agent !== user.agent) return
    if (USE_MOCK) {
      setClients(clients.map(item => item.id === id ? { ...item, payment_status: newStatus, paid_at: newStatus === "Fully Paid" ? new Date().toISOString() : null } : item))
      return
    }
    await supabase.from('clients').update({ payment_status: newStatus, paid_at: newStatus === "Fully Paid" ? new Date().toISOString() : null }).eq('id', id)
    await loadData()
  }

  async function toggleUrgent(id) {
    const c = clients.find(x => x.id === id)
    if (user.role === "agent" && c.agent !== user.agent) { alert("您只能标记自己的客户"); return }
    if (USE_MOCK) { setClients(clients.map(item => item.id === id ? { ...item, is_urgent: !item.is_urgent } : item)); return }
    const { error } = await supabase.from('clients').update({ is_urgent: !c.is_urgent }).eq('id', id)
    if (error) { alert('更新失败: ' + error.message); return }
    await loadData()
  }

  async function generateClientID() {
    const year = new Date().getFullYear()
    const regex = new RegExp(`^IMM-${year}-(\\d{4})$`)
    let maxNum = 0
    clients.forEach(c => { const m = String(c.id || "").match(regex); if (m) maxNum = Math.max(maxNum, Number(m[1])) })
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
      const newId = await generateClientID()
      setFormData({
        id: newId, clientName: "", agent: user.role === "manager" ? AGENTS[0] : user.agent,
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
        (c.agent || "").toLowerCase().includes(filters.search.toLowerCase()) ||
        (c.id || "").toLowerCase().includes(filters.search.toLowerCase()) ||
        (c.notes || "").toLowerCase().includes(filters.search.toLowerCase()))) return false
    if (filters.status !== "All" && c.status !== filters.status) return false
    if (filters.source !== "All" && c.source !== filters.source) return false
    if (filters.visaType !== "All" && c.visa_type !== filters.visaType) return false
    if (filters.agent !== "All" && c.agent !== filters.agent) return false
    if (filters.year !== "All" && getRecordYear(c) !== filters.year) return false
    if (filters.paymentStatus !== "All" && c.payment_status !== filters.paymentStatus) return false
    return true
  })

  const totalFee = visibleClients.reduce((a, c) => a + (c.service_fee || 0), 0)
  const paidFee = visibleClients.filter(c => c.payment_status === "Fully Paid").reduce((a, c) => a + (c.service_fee || 0), 0)
  const gstTotal = visibleClients.filter(c => !c.gst_free).reduce((a, c) => a + ((c.service_fee || 0) / 11), 0)
  const years = [...new Set(clients.map(getRecordYear))].sort((a, b) => String(b).localeCompare(String(a)))

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
      (c.notes || '').replace(/\n/g, ' '),
      c.is_urgent ? 'Yes' : 'No',
      fmtDateTime(c.created_at)
    ])
    const csvContent = [headers.join(','), ...rows.map(row =>
      row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
    ].join('\n')
    downloadFile(csvContent, `${filename}.csv`, 'text/csv;charset=utf-8;')
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

  if (!user) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: '16px', background: '#f1f5f9' }}>
      <div style={{ width: '80px', height: '80px', borderRadius: '16px', background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '28px', fontWeight: '700', marginBottom: '8px' }}>CRM</div>
      <h2 style={{ margin: 0, color: '#1e293b', fontSize: '22px', fontWeight: '600' }}>移民代理客户管理系统</h2>
      <p style={{ margin: 0, color: '#64748b' }}>请登录以继续</p>
    </div>
  )

  return (
    <div className="container">
      <header className="header">
        <div className="header-content">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '16px', fontWeight: '700' }}>CRM</div>
            <div>
              <h1 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#1e293b' }}>移民代理客户管理系统</h1>
              <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>{user.role === "manager" ? '管理员' : user.agent} · {clients.length} 客户</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button className="btn btn-sm" onClick={() => exportToCSV(visibleClients, `clients-${new Date().toISOString().slice(0, 10)}`)}>📊 CSV 导出</button>
            <button className="btn btn-sm" onClick={() => exportToExcel(visibleClients, `clients-${new Date().toISOString().slice(0, 10)}`)}>📈 Excel 导出</button>
            <button className="btn btn-sm" onClick={() => setActiveTab("clients")}>📋 客户列表</button>
            {user.role === "manager" && <button className="btn btn-sm" onClick={() => setActiveTab("reports")}>📈 报表</button>}
            <button className="btn btn-sm" onClick={() => supabase?.auth?.signOut().then(() => window.location.reload())}>退出</button>
          </div>
        </div>
      </header>

      <main className="main">
        {activeTab === "clients" && (
          <div className="card">
            <div className="section-head">
              <div className="filters" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '8px' }}>
                <input type="text" placeholder="搜索客户..." value={filters.search} onChange={e => setFilters({...filters, search: e.target.value})} style={{ gridColumn: '1 / -1' }} />
                <select value={filters.status} onChange={e => setFilters({...filters, status: e.target.value})}>
                  <option value="All">All Statuses</option>{STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <select value={filters.visaType} onChange={e => setFilters({...filters, visaType: e.target.value})}>
                  <option value="All">All Visa Types</option>{[...new Set(clients.map(c => c.visa_type))].filter(Boolean).sort().map(v => <option key={v} value={v}>{v}</option>)}
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
                  <option value="All">All Payment</option><option value="Unpaid">Unpaid</option><option value="Deposit Paid">Deposit Paid</option><option value="Partially Paid">Partially Paid</option><option value="Fully Paid">Fully Paid</option><option value="Refunded">Refunded</option>
                </select>
                <select value={filters.year} onChange={e => setFilters({...filters, year: e.target.value})}>
                  <option value="All">All Years</option>{years.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              <button className="btn btn-primary" onClick={() => openModal()}>➕ 新建客户</button>
            </div>

            <div className="kpi-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', marginBottom: '16px' }}>
              <div className="card kpi">
                <div className="kpi-title">案件总数</div>
                <div className="kpi-value">{visibleClients.length}</div>
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

            {loading ? <div className="loading">加载中...</div> : (
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>客户姓名</th>
                      <th>签证类型</th>
                      <th>状态</th>
                      <th>服务费</th>
                      <th>付款</th>
                      <th>Agent</th>
                      <th>来源</th>
                      <th>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleClients.map(c => (
                      <tr key={c.id}>
                        <td><strong>{c.id}</strong></td>
                        <td>
                          <div style={{ fontWeight: 500 }}>{c.client_name}</div>
                          <div style={{ marginTop: '4px' }}>
                            <span style={{ display: 'inline-block', padding: '2px 6px', borderRadius: '4px', fontSize: '11px', backgroundColor: (() => { switch(c.payment_status) { case 'Fully Paid': return '#10b98120'; case 'Unpaid': return '#ef444420'; case 'Deposit Paid': return '#3b82f620'; case 'Partially Paid': return '#f59e0b20'; case 'Refunded': return '#6b728020'; default: return '#e2e8f020'; } })(), color: (() => { switch(c.payment_status) { case 'Fully Paid': return '#10b981'; case 'Unpaid': return '#ef4444'; case 'Deposit Paid': return '#3b82f6'; case 'Partially Paid': return '#f59e0b'; case 'Refunded': return '#6b7280'; default: return '#64748b'; } })() }}>{c.payment_status}</span>
                          </div>
                        </td>
                        <td><div style={{ fontWeight: 500, color: '#1e293b' }}>{c.visa_type || '-'}</div></td>
                        <td>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', backgroundColor: (() => { switch(c.status) { case 'Granted': return '#d1fae5'; case 'Refused': return '#fee2e2'; case 'Withdrawn': return '#f3f4f6'; case 'Consultation': return '#dbeafe'; case 'Contract Signed': return '#cffafe'; case 'Application Lodged': return '#fef3c7'; case 'Processing': return '#e0e7ff'; case 'Further Information Required': return '#ffedd5'; default: return '#f1f5f9'; } })(), color: (() => { switch(c.status) { case 'Granted': return '#065f46'; case 'Refused': return '#991b1b'; case 'Withdrawn': return '#6b7280'; case 'Consultation': return '#1e40af'; case 'Contract Signed': return '#0e7490'; case 'Application Lodged': return '#92400e'; case 'Processing': return '#3730a3'; case 'Further Information Required': return '#9a3412'; default: return '#475569'; } })() }}>{c.status}{!!c.is_urgent && ' 🔥'}</span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ fontWeight: 600, color: '#1e293b' }}>{currency(c.service_fee)}</div>
                          <div style={{ marginTop: '4px' }}>
                            <span style={{ display: 'inline-block', padding: '2px 6px', borderRadius: '4px', fontSize: '11px', backgroundColor: (() => { switch(c.payment_status) { case 'Fully Paid': return '#10b98120'; case 'Unpaid': return '#ef444420'; case 'Deposit Paid': return '#3b82f620'; case 'Partially Paid': return '#f59e0b20'; case 'Refunded': return '#6b728020'; default: return '#e2e8f020'; } })(), color: (() => { switch(c.payment_status) { case 'Fully Paid': return '#10b981'; case 'Unpaid': return '#ef4444'; case 'Deposit Paid': return '#3b82f6'; case 'Partially Paid': return '#f59e0b'; case 'Refunded': return '#6b7280'; default: return '#64748b'; } })() }}>{c.payment_status}</span>
                          </div>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ fontWeight: 600, color: '#1e293b' }}>{currency(c.service_fee)}</div>
                          <div style={{ marginTop: '4px' }}>
                            <span style={{ display: 'inline-block', padding: '2px 6px', borderRadius: '4px', fontSize: '11px', backgroundColor: (() => { switch(c.payment_status) { case 'Fully Paid': return '#10b98120'; case 'Unpaid': return '#ef444420'; case 'Deposit Paid': return '#3b82f620'; case 'Partially Paid': return '#f59e0b20'; case 'Refunded': return '#6b728020'; default: return '#e2e8f020'; } })(), color: (() => { switch(c.payment_status) { case 'Fully Paid': return '#10b981'; case 'Unpaid': return '#ef4444'; case 'Deposit Paid': return '#3b82f6'; case 'Partially Paid': return '#f59e0b'; case 'Refunded': return '#6b7280'; default: return '#64748b'; } })() }}>{c.payment_status}</span>
                          </div>
                        </td>
                        <td>{c.agent}</td>
                        <td>{c.source}</td>
                        <td>
                          <div className="action-group">
                            <button className="small-btn" onClick={() => openModal(c.id)}>Edit</button>
                            <button className="small-btn" onClick={() => toggleUrgent(c.id)} style={{background: !!c.is_urgent ? '#fef2f2' : '#fff', borderColor: !!c.is_urgent ? '#ef4444' : '#e2e8f0', color: !!c.is_urgent ? '#dc2626' : '#64748b'}} title={!!c.is_urgent ? "取消紧急标记" : "标记为紧急"}>{!!c.is_urgent ? '🔥 取消紧急' : '标记紧急'}</button>
                            {user.role === "manager" && <button className="small-btn danger" onClick={() => deleteClient(c.id)}>Delete</button>}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === "reports" && user.role === "manager" && (
          <div className="card">
            <h2 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: '600', color: '#1e293b' }}>数据统计报表</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <div className="report-section">
                <h3 style={{ margin: '0 0 12px', fontSize: '14px', color: '#64748b', fontWeight: '500' }}>按状态分布</h3>
                <table style={{ width: '100%', fontSize: '13px' }}>
                  <thead><tr><th style={{ textAlign: 'left' }}>状态</th><th style={{ textAlign: 'right' }}>数量</th><th style={{ textAlign: 'right' }}>服务费</th></tr></thead>
                  <tbody>{STATUSES.map(s => {
                    const filtered = clients.filter(c => c.status === s)
                    const fee = filtered.reduce((a, c) => a + (c.service_fee || 0), 0)
                    return <tr key={s}><td>{s}</td><td style={{ textAlign: 'right' }}>{filtered.length}</td><td style={{ textAlign: 'right' }}>{currency(fee)}</td></tr>
                  })}</tbody>
                </table>
              </div>
              <div className="report-section">
                <h3 style={{ margin: '0 0 12px', fontSize: '14px', color: '#64748b', fontWeight: '500' }}>按签证类型</h3>
                <table style={{ width: '100%', fontSize: '13px' }}>
                  <thead><tr><th style={{ textAlign: 'left' }}>签证类型</th><th style={{ textAlign: 'right' }}>数量</th><th style={{ textAlign: 'right' }}>服务费</th></tr></thead>
                  <tbody>{[...new Set(clients.map(c => c.visa_type))].filter(Boolean).sort().map(v => {
                    const filtered = clients.filter(c => c.visa_type === v)
                    const fee = filtered.reduce((a, c) => a + (c.service_fee || 0), 0)
                    return <tr key={v}><td>{v}</td><td style={{ textAlign: 'right' }}>{filtered.length}</td><td style={{ textAlign: 'right' }}>{currency(fee)}</td></tr>
                  })}</tbody>
                </table>
              </div>
              <div className="report-section">
                <h3 style={{ margin: '0 0 12px', fontSize: '14px', color: '#64748b', fontWeight: '500' }}>按来源渠道</h3>
                <table style={{ width: '100%', fontSize: '13px' }}>
                  <thead><tr><th style={{ textAlign: 'left' }}>来源</th><th style={{ textAlign: 'right' }}>数量</th><th style={{ textAlign: 'right' }}>服务费</th></tr></thead>
                  <tbody>{SOURCES.map(s => {
                    const filtered = clients.filter(c => c.source === s)
                    const fee = filtered.reduce((a, c) => a + (c.service_fee || 0), 0)
                    return <tr key={s}><td>{s}</td><td style={{ textAlign: 'right' }}>{filtered.length}</td><td style={{ textAlign: 'right' }}>{currency(fee)}</td></tr>
                  })}</tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingId ? '编辑客户' : '新建客户'}</h3>
              <button onClick={() => setModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#64748b' }}>×</button>
            </div>
            <div className="modal-body" style={{ display: 'grid', gap: '12px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                <div className="field"><label>ID</label><input type="text" value={formData.id} readOnly /></div>
                <div className="field"><label>客户姓名</label><input type="text" value={formData.clientName} onChange={e => setFormData({...formData, clientName: e.target.value})} /></div>
                <div className="field"><label>签证类型</label><input type="text" value={formData.visaType} onChange={e => setFormData({...formData, visaType: e.target.value})} /></div>
                {user.role === "manager" ? (
                  <div className="field"><label>Agent</label><select value={formData.agent} onChange={e => setFormData({...formData, agent: e.target.value})}><option value="">选择...</option>{AGENTS.map(a => <option key={a} value={a}>{a}</option>)}</select></div>
                ) : (
                  <div className="field"><label>Agent</label><input type="text" value={formData.agent} readOnly /></div>
                )}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                <div className="field"><label>来源</label><select value={formData.source} onChange={e => setFormData({...formData, source: e.target.value})}>{SOURCES.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
                <div className="field"><label>状态</label><select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>{STATUSES.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
                <div className="field"><label>Lodgement date</label><input type="date" value={formData.lodgementDate} onChange={e => setFormData({...formData, lodgementDate: e.target.value})} /></div>
                <div className="field"><label>Due date</label><input type="date" value={formData.dueDate} onChange={e => setFormData({...formData, dueDate: e.target.value})} /></div>
                <div className="field"><label>Service fee (AUD)</label><input type="number" value={formData.serviceFee} onChange={e => setFormData({...formData, serviceFee: e.target.value})} /></div>
                <div className="field" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={formData.gstFree} onChange={e => setFormData({...formData, gstFree: e.target.checked})} style={{ width: '20px', height: '20px', cursor: 'pointer' }} />
                    <span style={{ color: formData.gstFree ? '#10b981' : '#475569', fontWeight: formData.gstFree ? '600' : '400' }}>GST Free</span>
                  </label>
                </div>
                <div className="field"><label>付款状态</label><select value={formData.paymentStatus} onChange={e => setFormData({...formData, paymentStatus: e.target.value})}><option value="Unpaid">Unpaid</option><option value="Deposit Paid">Deposit Paid</option><option value="Partially Paid">Partially Paid</option><option value="Fully Paid">Fully Paid</option><option value="Refunded">Refunded</option></select></div>
                <div className="field" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={formData.isUrgent} onChange={e => setFormData({...formData, isUrgent: e.target.checked})} style={{ width: '20px', height: '20px', cursor: 'pointer' }} />
                    <span style={{ color: formData.isUrgent ? '#dc2626' : '#475569', fontWeight: formData.isUrgent ? '600' : '400' }}>紧急标记</span>
                  </label>
                </div>
              </div>
              <div className="field"><label>备注</label><textarea value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} rows={3} /></div>
            </div>
            <div className="modal-footer">
              <button className="btn" onClick={() => setModalOpen(false)}>取消</button>
              <button className="btn btn-primary" onClick={handleSave}>保存</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

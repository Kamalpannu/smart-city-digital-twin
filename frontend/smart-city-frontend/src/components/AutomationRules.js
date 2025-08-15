"use client"

import { useState, useEffect } from "react"
import { Plus, Edit, Trash2, Power, PowerOff } from "lucide-react"

const AutomationRules = () => {
  const [rules, setRules] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [editingRule, setEditingRule] = useState(null)
  const [formData, setFormData] = useState({
    name: "",
    zone: "Zone A",
    condition: "traffic &gt; 80",
    action: "reroute_traffic",
    priority: "medium",
    active: true,
  })

  // Mock rules data
  useEffect(() => {
    const mockRules = [
      {
        id: 1,
        name: "High Traffic Reroute",
        zone: "Zone A",
        condition: "traffic &gt; 80",
        action: "reroute_traffic",
        priority: "high",
        active: true,
        triggers: 15,
      },
      {
        id: 2,
        name: "Pollution Alert",
        zone: "Zone B",
        condition: "pollution &gt; 100",
        action: "send_alert",
        priority: "medium",
        active: true,
        triggers: 8,
      },
      {
        id: 3,
        name: "Emergency Protocol",
        zone: "Zone C",
        condition: "emergency_detected",
        action: "activate_emergency",
        priority: "critical",
        active: false,
        triggers: 0,
      },
    ]
    setRules(mockRules)
  }, [])

  const handleSubmit = (e) => {
    e.preventDefault()

    if (editingRule) {
      setRules(
        rules.map((rule) =>
          rule.id === editingRule.id ? { ...formData, id: editingRule.id, triggers: editingRule.triggers } : rule,
        ),
      )
    } else {
      const newRule = {
        ...formData,
        id: Date.now(),
        triggers: 0,
      }
      setRules([...rules, newRule])
    }

    setShowModal(false)
    setEditingRule(null)
    setFormData({
      name: "",
      zone: "Zone A",
      condition: "traffic &gt; 80",
      action: "reroute_traffic",
      priority: "medium",
      active: true,
    })
  }

  const handleEdit = (rule) => {
    setEditingRule(rule)
    setFormData({
      name: rule.name,
      zone: rule.zone,
      condition: rule.condition,
      action: rule.action,
      priority: rule.priority,
      active: rule.active,
    })
    setShowModal(true)
  }

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this rule?")) {
      setRules(rules.filter((rule) => rule.id !== id))
    }
  }

  const toggleRule = (id) => {
    setRules(rules.map((rule) => (rule.id === id ? { ...rule, active: !rule.active } : rule)))
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "critical":
        return "#ef4444"
      case "high":
        return "#f59e0b"
      case "medium":
        return "#3b82f6"
      case "low":
        return "#22c55e"
      default:
        return "#94a3b8"
    }
  }

  const activeRules = rules.filter((rule) => rule.active).length
  const totalTriggers = rules.reduce((sum, rule) => sum + rule.triggers, 0)

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Automation Rules</h1>
        <p className="page-subtitle">Manage automated responses to city conditions</p>
      </div>

      {/* Statistics */}
      <div className="grid grid-3">
        <div className="card">
          <h3 style={{ color: "#f8fafc", marginBottom: "8px" }}>Active Rules</h3>
          <p style={{ fontSize: "24px", fontWeight: "600", color: "#22c55e" }}>
            {activeRules} / {rules.length}
          </p>
        </div>
        <div className="card">
          <h3 style={{ color: "#f8fafc", marginBottom: "8px" }}>Total Triggers</h3>
          <p style={{ fontSize: "24px", fontWeight: "600", color: "#3b82f6" }}>{totalTriggers}</p>
        </div>
        <div className="card">
          <h3 style={{ color: "#f8fafc", marginBottom: "8px" }}>System Status</h3>
          <p style={{ fontSize: "18px", fontWeight: "600", color: "#22c55e" }}>Operational</p>
        </div>
      </div>

      {/* Rules Management */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Automation Rules</h2>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={16} />
            Add Rule
          </button>
        </div>

        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Zone</th>
              <th>Condition</th>
              <th>Action</th>
              <th>Priority</th>
              <th>Triggers</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rules.map((rule) => (
              <tr key={rule.id}>
                <td style={{ fontWeight: "500" }}>{rule.name}</td>
                <td>{rule.zone}</td>
                <td style={{ fontFamily: "monospace", fontSize: "14px" }}>{rule.condition}</td>
                <td>{rule.action.replace("_", " ")}</td>
                <td>
                  <span
                    className="status-badge"
                    style={{
                      background: `${getPriorityColor(rule.priority)}20`,
                      color: getPriorityColor(rule.priority),
                    }}
                  >
                    {rule.priority}
                  </span>
                </td>
                <td>{rule.triggers}</td>
                <td>
                  <button
                    className={`btn ${rule.active ? "btn-secondary" : "btn-danger"}`}
                    onClick={() => toggleRule(rule.id)}
                    style={{ padding: "4px 8px" }}
                  >
                    {rule.active ? <Power size={14} /> : <PowerOff size={14} />}
                  </button>
                </td>
                <td>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      className="btn btn-secondary"
                      onClick={() => handleEdit(rule)}
                      style={{ padding: "4px 8px" }}
                    >
                      <Edit size={14} />
                    </button>
                    <button
                      className="btn btn-danger"
                      onClick={() => handleDelete(rule.id)}
                      style={{ padding: "4px 8px" }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2 className="modal-title">{editingRule ? "Edit Rule" : "Create New Rule"}</h2>
              <button
                className="close-btn"
                onClick={() => {
                  setShowModal(false)
                  setEditingRule(null)
                }}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Rule Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Zone</label>
                <select
                  className="form-select"
                  value={formData.zone}
                  onChange={(e) => setFormData({ ...formData, zone: e.target.value })}
                >
                  <option value="Zone A">Zone A</option>
                  <option value="Zone B">Zone B</option>
                  <option value="Zone C">Zone C</option>
                  <option value="All Zones">All Zones</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Condition</label>
                <select
                  className="form-select"
                  value={formData.condition}
                  onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                >
                  <option value="traffic &gt; 80">Traffic &gt; 80%</option>
                  <option value="pollution &gt; 100">Pollution &gt; 100</option>
                  <option value="emergency_detected">Emergency Detected</option>
                  <option value="weather_alert">Weather Alert</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Action</label>
                <select
                  className="form-select"
                  value={formData.action}
                  onChange={(e) => setFormData({ ...formData, action: e.target.value })}
                >
                  <option value="reroute_traffic">Reroute Traffic</option>
                  <option value="send_alert">Send Alert</option>
                  <option value="activate_emergency">Activate Emergency Protocol</option>
                  <option value="adjust_signals">Adjust Traffic Signals</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Priority</label>
                <select
                  className="form-select"
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>

              <div style={{ display: "flex", gap: "12px", marginTop: "24px" }}>
                <button type="submit" className="btn btn-primary">
                  {editingRule ? "Update Rule" : "Create Rule"}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowModal(false)
                    setEditingRule(null)
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default AutomationRules

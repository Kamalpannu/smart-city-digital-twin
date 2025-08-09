import React, { useEffect, useState } from "react";
import { fetchRules, createRule, updateRule, deleteRule } from "../services/api";

export default function AutomationRules() {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "", zone: "", trafficThreshold: 70, enabled: true });

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchRules();
      setRules(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      alert("Failed to load rules");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const submit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await updateRule(editing.id ?? editing._id ?? editing, form);
      } else {
        await createRule(form);
      }
      setForm({ name: "", zone: "", trafficThreshold: 70, enabled: true });
      setEditing(null);
      await load();
    } catch (e) {
      console.error(e);
      alert("Failed to save rule");
    }
  };

  const onEdit = (r) => {
    setEditing(r);
    setForm({
      name: r.name || "",
      zone: r.zone || "",
      trafficThreshold: r.trafficThreshold ?? 70,
      enabled: !!r.enabled,
    });
  };

  const onDelete = async (r) => {
    if (!window.confirm("Delete this rule?")) return;
    try {
      await deleteRule(r.id ?? r._id ?? r);
      await load();
    } catch (e) {
      console.error(e);
      alert("Failed to delete rule");
    }
  };

  return (
    <div>
      <h3 style={{ margin: "0 0 8px" }}>Automation Rules</h3>
      <form onSubmit={submit} style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(4, 1fr)", marginBottom: 12 }}>
        <input required placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <input required placeholder="Zone" value={form.zone} onChange={(e) => setForm({ ...form, zone: e.target.value })} />
        <input type="number" min="0" max="100" placeholder="Traffic Threshold"
          value={form.trafficThreshold}
          onChange={(e) => setForm({ ...form, trafficThreshold: Number(e.target.value) })} />
        <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <input type="checkbox" checked={form.enabled} onChange={(e) => setForm({ ...form, enabled: e.target.checked })} />
          Enabled
        </label>
        <div style={{ gridColumn: "span 4" }}>
          <button type="submit">{editing ? "Update Rule" : "Create Rule"}</button>
          {editing && <button type="button" onClick={() => { setEditing(null); setForm({ name: "", zone: "", trafficThreshold: 70, enabled: true }); }} style={{ marginLeft: 8 }}>Cancel</button>}
        </div>
      </form>

      {loading ? <div>Loading...</div> : (
        <table width="100%" cellPadding="6" style={{ borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}>
              <th>Name</th><th>Zone</th><th>TrafficThreshold</th><th>Enabled</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rules.map((r, idx) => (
              <tr key={r.id ?? r._id ?? idx} style={{ borderBottom: "1px solid #f0f0f0" }}>
                <td>{r.name}</td>
                <td>{r.zone}</td>
                <td>{r.trafficThreshold}</td>
                <td>{r.enabled ? "Yes" : "No"}</td>
                <td>
                  <button onClick={() => onEdit(r)}>Edit</button>
                  <button onClick={() => onDelete(r)} style={{ marginLeft: 8, color: "#B91C1C" }}>Delete</button>
                </td>
              </tr>
            ))}
            {!rules.length && <tr><td colSpan="5">No rules yet.</td></tr>}
          </tbody>
        </table>
      )}
    </div>
  );
}

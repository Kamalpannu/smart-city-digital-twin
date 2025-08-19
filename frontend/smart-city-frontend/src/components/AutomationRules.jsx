import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Settings } from 'lucide-react';

const AutomationRules = ({ rules, onCreateRule, onUpdateRule, onDeleteRule }) => {
  const [isCreating, setIsCreating] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [formData, setFormData] = useState({
    zone: 'A',
    condition: '',
    action: '',
    enabled: true
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editingRule) {
      await onUpdateRule(editingRule.id, formData);
      setEditingRule(null);
    } else {
      await onCreateRule(formData);
      setIsCreating(false);
    }
    setFormData({ zone: 'A', condition: '', action: '', enabled: true });
  };

  const handleEdit = (rule) => {
    setEditingRule(rule);
    setFormData(rule);
    setIsCreating(true);
  };

  const handleCancel = () => {
    setIsCreating(false);
    setEditingRule(null);
    setFormData({ zone: 'A', condition: '', action: '', enabled: true });
  };

  return (
    <div className="bg-white rounded-lg p-6 shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold flex items-center">
          <Settings className="w-6 h-6 mr-2" />
          Automation Rules
        </h2>
        {!isCreating && (
          <button
            onClick={() => setIsCreating(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Rule</span>
          </button>
        )}
      </div>

      {isCreating && (
        <form onSubmit={handleSubmit} className="mb-6 p-4 border rounded-lg bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <select
              value={formData.zone}
              onChange={(e) => setFormData({ ...formData, zone: e.target.value })}
              className="px-3 py-2 border rounded-lg"
              required
            >
              <option value="A">Zone A</option>
              <option value="B">Zone B</option>
              <option value="C">Zone C</option>
            </select>

            <input
              type="text"
              placeholder="Condition (e.g., traffic > 80)"
              value={formData.condition}
              onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
              className="px-3 py-2 border rounded-lg"
              required
            />

            <input
              type="text"
              placeholder="Action (e.g., reroute_traffic)"
              value={formData.action}
              onChange={(e) => setFormData({ ...formData, action: e.target.value })}
              className="px-3 py-2 border rounded-lg"
              required
            />

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="enabled"
                checked={formData.enabled}
                onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                className="rounded"
              />
              <label htmlFor="enabled" className="text-sm">Enabled</label>
            </div>
          </div>

          <div className="flex space-x-2 mt-4">
            <button
              type="submit"
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
            >
              {editingRule ? 'Update' : 'Create'}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-200">
          <thead>
            <tr className="bg-gray-50">
              <th className="border border-gray-200 px-4 py-2 text-left">Zone</th>
              <th className="border border-gray-200 px-4 py-2 text-left">Condition</th>
              <th className="border border-gray-200 px-4 py-2 text-left">Action</th>
              <th className="border border-gray-200 px-4 py-2 text-left">Status</th>
              <th className="border border-gray-200 px-4 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rules.map((rule) => (
              <tr key={rule.id} className="hover:bg-gray-50">
                <td className="border border-gray-200 px-4 py-2 font-semibold">Zone {rule.zone}</td>
                <td className="border border-gray-200 px-4 py-2 font-mono text-sm">{rule.condition}</td>
                <td className="border border-gray-200 px-4 py-2">{rule.action}</td>
                <td className="border border-gray-200 px-4 py-2">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    rule.enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {rule.enabled ? 'Enabled' : 'Disabled'}
                  </span>
                </td>
                <td className="border border-gray-200 px-4 py-2">
                  <div className="flex space-x-2">
                    <button onClick={() => handleEdit(rule)} className="text-blue-600 hover:text-blue-800">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => onDeleteRule(rule.id)} className="text-red-600 hover:text-red-800">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AutomationRules;

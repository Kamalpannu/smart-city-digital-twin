"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Edit, Trash2, Power, PowerOff } from "lucide-react"

// Mock data for automation rules
const mockRules = [
  {
    id: "1",
    name: "High Traffic Reroute",
    zone: "Zone A",
    condition: "traffic_above",
    conditionValue: 80,
    action: "enable_reroute",
    enabled: true,
    priority: "high",
    description: "Automatically enable traffic rerouting when traffic exceeds 80%",
    createdAt: "2024-01-15T10:30:00Z",
    lastTriggered: "2024-01-20T14:22:00Z",
  },
  {
    id: "2",
    name: "Pollution Alert",
    zone: "Zone B",
    condition: "pollution_above",
    conditionValue: 75,
    action: "send_alert",
    enabled: true,
    priority: "high",
    description: "Send alert when pollution levels exceed 75%",
    createdAt: "2024-01-10T09:15:00Z",
    lastTriggered: "2024-01-19T16:45:00Z",
  },
  {
    id: "3",
    name: "Night Mode Traffic",
    zone: "All Zones",
    condition: "time_after",
    conditionValue: 22,
    action: "reduce_signals",
    enabled: false,
    priority: "medium",
    description: "Reduce traffic signal timing after 10 PM",
    createdAt: "2024-01-08T15:20:00Z",
  },
  {
    id: "4",
    name: "Emergency Protocol",
    zone: "Zone C",
    condition: "emergency_detected",
    conditionValue: 1,
    action: "clear_routes",
    enabled: true,
    priority: "high",
    description: "Clear emergency routes when emergency vehicles detected",
    createdAt: "2024-01-12T11:45:00Z",
  },
]

export function AutomationRules() {
  const [rules, setRules] = useState(mockRules)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingRule, setEditingRule] = useState(null)
  const [formData, setFormData] = useState({
    name: "",
    zone: "",
    condition: "",
    conditionValue: 0,
    action: "",
    priority: "medium",
    description: "",
  })

  const resetForm = () => {
    setFormData({
      name: "",
      zone: "",
      condition: "",
      conditionValue: 0,
      action: "",
      priority: "medium",
      description: "",
    })
    setEditingRule(null)
  }

  const handleCreate = () => {
    resetForm()
    setIsDialogOpen(true)
  }

  const handleEdit = (rule) => {
    setEditingRule(rule)
    setFormData({
      name: rule.name,
      zone: rule.zone,
      condition: rule.condition,
      conditionValue: rule.conditionValue,
      action: rule.action,
      priority: rule.priority,
      description: rule.description,
    })
    setIsDialogOpen(true)
  }

  const handleSave = () => {
    if (editingRule) {
      // Update existing rule
      setRules(
        rules.map((rule) =>
          rule.id === editingRule.id
            ? { ...rule, ...formData }
            : rule
        )
      )
    } else {
      // Create new rule
      const newRule = {
        id: Date.now().toString(),
        ...formData,
        enabled: true,
        createdAt: new Date().toISOString(),
      }
      setRules([...rules, newRule])
    }
    setIsDialogOpen(false)
    resetForm()
  }

  const handleDelete = (id) => {
    setRules(rules.filter((rule) => rule.id !== id))
  }

  const handleToggleEnabled = (id) => {
    setRules(rules.map((rule) => (rule.id === id ? { ...rule, enabled: !rule.enabled } : rule)))
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "high":
        return "bg-destructive text-destructive-foreground"
      case "medium":
        return "bg-secondary text-secondary-foreground"
      default:
        return "bg-primary text-primary-foreground"
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <div className="space-y-6">
      {/* Header with Create Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-sans font-bold text-foreground">Automation Rules</h2>
          <p className="text-muted-foreground font-serif">Configure automated responses to city conditions</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleCreate} className="font-serif">
              <Plus className="w-4 h-4 mr-2" />
              Create Rule
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle className="font-sans">
                {editingRule ? "Edit Automation Rule" : "Create New Automation Rule"}
              </DialogTitle>
              <DialogDescription className="font-serif">
                Configure conditions and actions for automated city management.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="font-serif">Rule Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter rule name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="zone" className="font-serif">Zone</Label>
                  <Select value={formData.zone} onValueChange={(value) => setFormData({ ...formData, zone: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select zone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Zone A">Zone A - Downtown</SelectItem>
                      <SelectItem value="Zone B">Zone B - Industrial</SelectItem>
                      <SelectItem value="Zone C">Zone C - Residential</SelectItem>
                      <SelectItem value="All Zones">All Zones</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="condition" className="font-serif">Condition</Label>
                  <Select value={formData.condition} onValueChange={(value) => setFormData({ ...formData, condition: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select condition" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="traffic_above">Traffic Above</SelectItem>
                      <SelectItem value="traffic_below">Traffic Below</SelectItem>
                      <SelectItem value="pollution_above">Pollution Above</SelectItem>
                      <SelectItem value="pollution_below">Pollution Below</SelectItem>
                      <SelectItem value="time_after">Time After</SelectItem>
                      <SelectItem value="time_before">Time Before</SelectItem>
                      <SelectItem value="emergency_detected">Emergency Detected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="conditionValue" className="font-serif">Threshold Value</Label>
                  <Input
                    id="conditionValue"
                    type="number"
                    value={formData.conditionValue}
                    onChange={(e) => setFormData({ ...formData, conditionValue: Number(e.target.value) })}
                    placeholder="Enter threshold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="action" className="font-serif">Action</Label>
                  <Select value={formData.action} onValueChange={(value) => setFormData({ ...formData, action: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select action" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="enable_reroute">Enable Reroute</SelectItem>
                      <SelectItem value="disable_reroute">Disable Reroute</SelectItem>
                      <SelectItem value="send_alert">Send Alert</SelectItem>
                      <SelectItem value="reduce_signals">Reduce Signal Timing</SelectItem>
                      <SelectItem value="increase_signals">Increase Signal Timing</SelectItem>
                      <SelectItem value="clear_routes">Clear Emergency Routes</SelectItem>
                      <SelectItem value="activate_protocol">Activate Emergency Protocol</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="priority" className="font-serif">Priority</Label>
                  <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="font-serif">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe what this rule does..."
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="font-serif">Cancel</Button>
              <Button onClick={handleSave} className="font-serif">
                {editingRule ? "Update Rule" : "Create Rule"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Rules Table */}
      <Card>
        <CardHeader>
          <CardTitle className="font-sans text-card-foreground">Active Rules</CardTitle>
          <p className="text-sm text-muted-foreground font-serif">
            Manage your automation rules and their configurations
          </p>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-serif">Rule Name</TableHead>
                <TableHead className="font-serif">Zone</TableHead>
                <TableHead className="font-serif">Condition</TableHead>
                <TableHead className="font-serif">Action</TableHead>
                <TableHead className="font-serif">Priority</TableHead>
                <TableHead className="font-serif">Status</TableHead>
                <TableHead className="font-serif">Last Triggered</TableHead>
                <TableHead className="font-serif">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rules.map((rule) => (
                <TableRow key={rule.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium font-sans text-card-foreground">{rule.name}</div>
                      <div className="text-sm text-muted-foreground font-serif">{rule.description}</div>
                    </div>
                  </TableCell>
                  <TableCell className="font-serif text-card-foreground">{rule.zone}</TableCell>
                  <TableCell className="font-serif text-card-foreground">
                    {rule.condition.replace("_", " ")} {rule.conditionValue}
                    {rule.condition.includes("time") ? ":00" : "%"}
                  </TableCell>
                  <TableCell className="font-serif text-card-foreground">{rule.action.replace("_", " ")}</TableCell>
                  <TableCell>
                    <Badge className={getPriorityColor(rule.priority)}>{rule.priority.toUpperCase()}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={rule.enabled ? "default" : "secondary"}>
                      {rule.enabled ? "Enabled" : "Disabled"}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-serif text-muted-foreground">
                    {rule.lastTriggered ? formatDate(rule.lastTriggered) : "Never"}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleToggleEnabled(rule.id)} className="h-8 w-8 p-0">
                        {rule.enabled ? (
                          <PowerOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Power className="h-4 w-4 text-primary" />
                        )}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(rule)} className="h-8 w-8 p-0">
                        <Edit className="h-4 w-4 text-muted-foreground" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(rule.id)} className="h-8 w-8 p-0">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-primary">{rules.length}</div>
            <div className="text-sm text-muted-foreground font-serif">Total Rules</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-primary">{rules.filter((r) => r.enabled).length}</div>
            <div className="text-sm text-muted-foreground font-serif">Active Rules</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-primary">{rules.filter((r) => r.priority === "high").length}</div>
            <div className="text-sm text-muted-foreground font-serif">High Priority</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-primary">{rules.filter((r) => r.lastTriggered).length}</div>
            <div className="text-sm text-muted-foreground font-serif">Recently Triggered</div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

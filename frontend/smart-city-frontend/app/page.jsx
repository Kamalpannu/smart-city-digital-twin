import { CityMap3D } from "@/components/city-map-3d"
import { DashboardCharts } from "@/components/dashboard-charts"
import { AutomationRules } from "@/components/automation-rules"
import { ScenarioTesting } from "@/components/scenario-testing"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-sans font-bold text-foreground">Smart City Control Center</h1>
              <p className="text-sm text-muted-foreground font-serif">Real-time urban monitoring and simulation</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                <span className="text-sm font-serif text-muted-foreground">Live Data</span>
              </div>
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                System Online
              </Badge>
              <Button variant="outline" size="sm" className="font-serif bg-transparent">
                Settings
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:grid-cols-4">
            <TabsTrigger value="overview" className="font-serif">
              Overview
            </TabsTrigger>
            <TabsTrigger value="analytics" className="font-serif">
              Analytics
            </TabsTrigger>
            <TabsTrigger value="automation" className="font-serif">
              Automation
            </TabsTrigger>
            <TabsTrigger value="scenarios" className="font-serif">
              Scenarios
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* 3D Map - Takes up most space */}
              <div className="lg:col-span-3">
                <Card>
                  <CardHeader>
                    <CardTitle className="font-sans text-card-foreground">3D City Overview</CardTitle>
                    <p className="text-sm text-muted-foreground font-serif">
                      Interactive city map showing real-time traffic and pollution data
                    </p>
                  </CardHeader>
                  <CardContent>
                    <CityMap3D />
                  </CardContent>
                </Card>
              </div>

              {/* Side Panel */}
              <div className="space-y-4">
                {/* Quick Stats */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg font-sans text-card-foreground">System Status</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-serif text-muted-foreground">Active Zones</span>
                      <Badge className="bg-primary text-primary-foreground">3</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-serif text-muted-foreground">Alerts</span>
                      <Badge className="bg-destructive text-destructive-foreground">2</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-serif text-muted-foreground">Avg Traffic</span>
                      <Badge variant="outline">53%</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-serif text-muted-foreground">Air Quality</span>
                      <Badge className="bg-secondary text-secondary-foreground">Moderate</Badge>
                    </div>
                  </CardContent>
                </Card>

                {/* Zone Legend */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg font-sans text-card-foreground">Zone Legend</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-blue-500 rounded"></div>
                      <span className="text-sm font-serif text-card-foreground">Zone A - Downtown</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-red-500 rounded"></div>
                      <span className="text-sm font-serif text-card-foreground">Zone B - Industrial</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded"></div>
                      <span className="text-sm font-serif text-card-foreground">Zone C - Residential</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg font-sans text-card-foreground">Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button variant="outline" size="sm" className="w-full font-serif bg-transparent">
                      Emergency Protocol
                    </Button>
                    <Button variant="outline" size="sm" className="w-full font-serif bg-transparent">
                      Traffic Override
                    </Button>
                    <Button variant="outline" size="sm" className="w-full font-serif bg-transparent">
                      Export Report
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <DashboardCharts />
          </TabsContent>

          <TabsContent value="automation" className="space-y-6">
            <AutomationRules />
          </TabsContent>

          <TabsContent value="scenarios" className="space-y-6">
            <ScenarioTesting />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}

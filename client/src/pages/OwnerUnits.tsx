import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Building2, AlertCircle, Home } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { PieChart, Pie, Cell, Legend, ResponsiveContainer } from "recharts";
import OwnerSidebar from "@/components/OwnerSidebar";
import Header from "@/components/Header";
import type { Unit, Property } from "@shared/schema";

export default function OwnerUnits() {
  const { user } = useAuth();
  const [propertyFilter, setPropertyFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [chartPropertyFilter, setChartPropertyFilter] = useState<string>("all");
  
  const { data: units = [], isLoading, isError } = useQuery<Unit[]>({
    queryKey: ["/api/units"],
  });

  const { data: properties = [] } = useQuery<Property[]>({
    queryKey: ["/api/properties"],
  });

  const getPropertyName = (propertyId: string) => {
    const property = properties.find(p => p.id === propertyId);
    return property ? `${property.name} - ${property.address}` : "Unknown Property";
  };

  const filteredUnits = units.filter(unit => {
    const matchesProperty = propertyFilter === "all" || unit.propertyId === propertyFilter;
    const matchesStatus = statusFilter === "all" || unit.status === statusFilter;
    return matchesProperty && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const colors = {
      vacant: "bg-yellow-500",
      occupied: "bg-green-500",
      maintenance: "bg-orange-500",
      unavailable: "bg-gray-500",
    };
    return colors[status as keyof typeof colors] || "bg-blue-500";
  };

  const totalUnits = units.length;
  const occupiedUnits = units.filter(u => u.status === 'occupied').length;
  const vacantUnits = units.filter(u => u.status === 'vacant').length;
  const maintenanceUnits = units.filter(u => u.status === 'maintenance').length;
  const occupancyRate = totalUnits > 0 ? ((occupiedUnits / totalUnits) * 100).toFixed(1) : '0.0';

  const chartData = useMemo(() => {
    const filteredForChart = chartPropertyFilter === "all" 
      ? units 
      : units.filter(u => u.propertyId === chartPropertyFilter);
    
    const occupied = filteredForChart.filter(u => u.status === 'occupied').length;
    const vacant = filteredForChart.filter(u => u.status === 'vacant').length;
    const maintenance = filteredForChart.filter(u => u.status === 'maintenance').length;
    
    return [
      { name: 'Occupied', value: occupied, color: '#22c55e' },
      { name: 'Vacant', value: vacant, color: '#eab308' },
      { name: 'Maintenance', value: maintenance, color: '#f97316' },
    ].filter(item => item.value > 0);
  }, [units, chartPropertyFilter]);

  const chartConfig = {
    occupied: {
      label: "Occupied",
      color: "#22c55e",
    },
    vacant: {
      label: "Vacant",
      color: "#eab308",
    },
    maintenance: {
      label: "Maintenance",
      color: "#f97316",
    },
  };

  if (isLoading) {
    return (
      <div className="flex h-screen overflow-hidden">
        <OwnerSidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading"/>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <OwnerSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="My Units" subtitle="View units across all your properties" user={user} />
        
        <main className="flex-1 overflow-y-auto p-6 bg-muted/30">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="grid md:grid-cols-4 gap-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Units</p>
                      <p className="text-3xl font-bold" data-testid="text-total-units">{totalUnits}</p>
                    </div>
                    <Home className="h-8 w-8 text-primary" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Occupied</p>
                      <p className="text-3xl font-bold" data-testid="text-occupied-units">{occupiedUnits}</p>
                    </div>
                    <Badge className="bg-green-500">Active</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Vacant</p>
                      <p className="text-3xl font-bold" data-testid="text-vacant-units">{vacantUnits}</p>
                    </div>
                    <Badge className="bg-yellow-500">Available</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Occupancy Rate</p>
                      <p className="text-3xl font-bold" data-testid="text-occupancy-rate">{occupancyRate}%</p>
                    </div>
                    <Building2 className="h-8 w-8 text-accent" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle data-testid="heading-occupancy-chart">Occupancy Overview</CardTitle>
                    <CardDescription>Visual breakdown of unit occupancy status</CardDescription>
                  </div>
                  <Select value={chartPropertyFilter} onValueChange={setChartPropertyFilter}>
                    <SelectTrigger className="w-[200px]" data-testid="select-chart-property-filter">
                      <SelectValue placeholder="All Properties" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Properties</SelectItem>
                      {properties.map((property) => (
                        <SelectItem key={property.id} value={property.id}>
                          {property.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                {chartData.length === 0 ? (
                  <p className="text-muted-foreground text-sm text-center py-8" data-testid="text-no-chart-data">No units data available</p>
                ) : (
                  <ChartContainer config={chartConfig} className="h-[300px] w-full" data-testid="chart-occupancy">
                    <PieChart>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent />} />
                    </PieChart>
                  </ChartContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle data-testid="heading-units-list">All Units</CardTitle>
                    <CardDescription>View all units across your properties</CardDescription>
                  </div>
                  <div className="flex gap-4">
                    <Select value={propertyFilter} onValueChange={setPropertyFilter}>
                      <SelectTrigger className="w-[200px]" data-testid="select-property-filter">
                        <SelectValue placeholder="All Properties" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Properties</SelectItem>
                        {properties.map((property) => (
                          <SelectItem key={property.id} value={property.id}>
                            {property.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-[150px]" data-testid="select-status-filter">
                        <SelectValue placeholder="All Statuses" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="vacant">Vacant</SelectItem>
                        <SelectItem value="occupied">Occupied</SelectItem>
                        <SelectItem value="maintenance">Maintenance</SelectItem>
                        <SelectItem value="unavailable">Unavailable</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {isError ? (
                  <div className="text-center py-4">
                    <AlertCircle className="h-8 w-8 mx-auto text-destructive mb-2" />
                    <p className="text-sm text-destructive" data-testid="text-error">Failed to load units</p>
                  </div>
                ) : filteredUnits.length === 0 ? (
                  <p className="text-muted-foreground text-sm text-center py-8" data-testid="text-no-units">No units found</p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Property</TableHead>
                          <TableHead>Unit Number</TableHead>
                          <TableHead>Bedrooms</TableHead>
                          <TableHead>Bathrooms</TableHead>
                          <TableHead>Square Feet</TableHead>
                          <TableHead>Monthly Rent</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredUnits.map((unit) => (
                          <TableRow key={unit.id} data-testid={`unit-row-${unit.id}`}>
                            <TableCell data-testid={`text-unit-property-${unit.id}`}>
                              {getPropertyName(unit.propertyId)}
                            </TableCell>
                            <TableCell className="font-medium" data-testid={`text-unit-number-${unit.id}`}>
                              {unit.unitNumber}
                            </TableCell>
                            <TableCell data-testid={`text-unit-bedrooms-${unit.id}`}>
                              {unit.bedrooms || "N/A"}
                            </TableCell>
                            <TableCell data-testid={`text-unit-bathrooms-${unit.id}`}>
                              {unit.bathrooms || "N/A"}
                            </TableCell>
                            <TableCell data-testid={`text-unit-sqft-${unit.id}`}>
                              {unit.squareFeet ? `${unit.squareFeet} sq ft` : "N/A"}
                            </TableCell>
                            <TableCell data-testid={`text-unit-rent-${unit.id}`}>
                              {unit.monthlyRent ? `$${parseFloat(unit.monthlyRent).toFixed(2)}` : "N/A"}
                            </TableCell>
                            <TableCell>
                              <Badge className={getStatusBadge(unit.status)} data-testid={`badge-unit-status-${unit.id}`}>
                                {unit.status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}

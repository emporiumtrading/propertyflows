import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Home, FileText, Calendar, DollarSign, AlertCircle, MapPin, Bed, Bath, Maximize, Eye } from "lucide-react";
import TenantSidebar from "@/components/TenantSidebar";
import Header from "@/components/Header";
import type { Lease, User, Unit, Property } from "@shared/schema";

export default function TenantLease() {
  const { user } = useAuth();
  const [selectedLease, setSelectedLease] = useState<Lease | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);

  const { data: leases = [], isLoading: leasesLoading } = useQuery<Lease[]>({
    queryKey: ["/api/leases", user?.id],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (user?.id) params.append("tenantId", user.id);
      const queryString = params.toString();
      const url = queryString ? `/api/leases?${queryString}` : "/api/leases";
      
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`${res.status}: ${text || res.statusText}`);
      }
      return await res.json();
    },
    enabled: !!user?.id,
  });

  const activeLease = leases.find((lease) => lease.status === "active");

  const { data: unit } = useQuery<Unit>({
    queryKey: [`/api/units/${activeLease?.unitId}`],
    enabled: !!activeLease?.unitId,
  });

  const { data: property } = useQuery<Property>({
    queryKey: [`/api/properties/${unit?.propertyId}`],
    enabled: !!unit?.propertyId,
  });

  const { data: allUnits = [] } = useQuery<Unit[]>({
    queryKey: ["/api/units"],
  });

  const { data: allProperties = [] } = useQuery<Property[]>({
    queryKey: ["/api/properties"],
  });

  const isLoading = leasesLoading;

  const getUnitInfo = (unitId: string) => {
    const unitData = allUnits.find(u => u.id === unitId);
    if (!unitData) return { unitNumber: "N/A", propertyAddress: "N/A" };
    
    const propertyData = allProperties.find(p => p.id === unitData.propertyId);
    return {
      unitNumber: unitData.unitNumber || "N/A",
      propertyAddress: propertyData?.address || "N/A",
      unit: unitData,
      property: propertyData,
    };
  };

  const handleViewLease = (lease: Lease) => {
    setSelectedLease(lease);
    setViewDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      active: "bg-green-500",
      pending: "bg-yellow-500",
      pending_signature: "bg-yellow-500",
      expired: "bg-red-500",
      terminated: "bg-gray-500",
    };
    return colors[status as keyof typeof colors] || "bg-gray-500";
  };

  if (isLoading) {
    return (
      <div className="flex h-screen overflow-hidden">
        <TenantSidebar />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground" data-testid="text-loading">Loading lease information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <TenantSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          title="My Lease" 
          subtitle="View your current lease information"
          user={user}
        />

        <main className="flex-1 overflow-y-auto p-6 bg-muted/30">
          {activeLease ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <Card data-testid="card-monthly-rent">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Monthly Rent</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">${activeLease.monthlyRent}</div>
                    <p className="text-sm text-muted-foreground mt-1">Per month</p>
                  </CardContent>
                </Card>

                <Card data-testid="card-security-deposit">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Security Deposit</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">${activeLease.securityDeposit}</div>
                    <p className="text-sm text-muted-foreground mt-1">On file</p>
                  </CardContent>
                </Card>

                <Card data-testid="card-lease-start">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Lease Start</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl font-bold">{new Date(activeLease.startDate).toLocaleDateString()}</div>
                    <p className="text-sm text-muted-foreground mt-1">Start date</p>
                  </CardContent>
                </Card>

                <Card data-testid="card-lease-end">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Lease End</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl font-bold">{new Date(activeLease.endDate).toLocaleDateString()}</div>
                    <p className="text-sm text-muted-foreground mt-1">End date</p>
                  </CardContent>
                </Card>
              </div>

              <Card className="mb-6" data-testid="card-lease-details">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Home className="h-5 w-5" />
                      Active Lease Details
                    </CardTitle>
                    <Badge className={getStatusBadge(activeLease.status)} data-testid="badge-lease-status">
                      {activeLease.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold mb-3">Property & Unit Details</h4>
                      <div className="space-y-3">
                        {property && (
                          <div>
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              Property Address
                            </p>
                            <p className="font-medium" data-testid="text-property-address">
                              {property.address}, {property.city}, {property.state} {property.zipCode}
                            </p>
                          </div>
                        )}
                        {unit && (
                          <>
                            <div>
                              <p className="text-sm text-muted-foreground">Unit Number</p>
                              <p className="font-medium" data-testid="text-unit-number">{unit.unitNumber}</p>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                              {unit.bedrooms && (
                                <div>
                                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Bed className="w-3 h-3" />
                                    Bedrooms
                                  </p>
                                  <p className="font-medium" data-testid="text-bedrooms">{unit.bedrooms}</p>
                                </div>
                              )}
                              {unit.bathrooms && (
                                <div>
                                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Bath className="w-3 h-3" />
                                    Bathrooms
                                  </p>
                                  <p className="font-medium" data-testid="text-bathrooms">{unit.bathrooms}</p>
                                </div>
                              )}
                              {unit.squareFeet && (
                                <div>
                                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Maximize className="w-3 h-3" />
                                    Sq Ft
                                  </p>
                                  <p className="font-medium" data-testid="text-square-feet">{unit.squareFeet}</p>
                                </div>
                              )}
                            </div>
                          </>
                        )}
                        <div>
                          <p className="text-sm text-muted-foreground">Monthly Rent</p>
                          <p className="font-medium" data-testid="text-monthly-rent">${activeLease.monthlyRent}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Security Deposit</p>
                          <p className="font-medium" data-testid="text-security-deposit">${activeLease.securityDeposit}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Lease Term</p>
                          <p className="font-medium" data-testid="text-lease-term">
                            {new Date(activeLease.startDate).toLocaleDateString()} - {new Date(activeLease.endDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-3">Documents & Status</h4>
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm text-muted-foreground">Lease Status</p>
                          <Badge className={getStatusBadge(activeLease.status)} data-testid="badge-lease-status-detail">
                            {activeLease.status}
                          </Badge>
                        </div>
                        {activeLease.signedAt && (
                          <div>
                            <p className="text-sm text-muted-foreground">Signed On</p>
                            <p className="font-medium" data-testid="text-signed-at">
                              {new Date(activeLease.signedAt).toLocaleDateString()}
                            </p>
                          </div>
                        )}
                        {activeLease.documentUrl && (
                          <div>
                            <p className="text-sm text-muted-foreground mb-2">Lease Document</p>
                            <a 
                              href={activeLease.documentUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 text-primary hover:underline"
                              data-testid="link-lease-document"
                            >
                              <FileText className="h-4 w-4" />
                              View Lease Agreement
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {unit?.amenities && unit.amenities.length > 0 && (
                <Card data-testid="card-amenities">
                  <CardHeader>
                    <CardTitle>Unit Amenities</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {unit.amenities.map((amenity, index) => (
                        <Badge key={index} variant="outline" data-testid={`amenity-${index}`}>
                          {amenity}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          ) : null}

          {/* All Leases Section */}
          {leases.length > 0 && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Lease History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Property</TableHead>
                        <TableHead>Unit</TableHead>
                        <TableHead>Start Date</TableHead>
                        <TableHead>End Date</TableHead>
                        <TableHead>Rent</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {leases.map((lease) => {
                        const unitInfo = getUnitInfo(lease.unitId);
                        return (
                          <TableRow key={lease.id} data-testid={`lease-row-${lease.id}`}>
                            <TableCell data-testid={`text-lease-property-${lease.id}`}>
                              {unitInfo.propertyAddress}
                            </TableCell>
                            <TableCell data-testid={`text-lease-unit-${lease.id}`}>
                              {unitInfo.unitNumber}
                            </TableCell>
                            <TableCell data-testid={`text-lease-start-${lease.id}`}>
                              {new Date(lease.startDate).toLocaleDateString()}
                            </TableCell>
                            <TableCell data-testid={`text-lease-end-${lease.id}`}>
                              {new Date(lease.endDate).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="font-medium" data-testid={`text-lease-rent-${lease.id}`}>
                              ${parseFloat(lease.monthlyRent).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </TableCell>
                            <TableCell>
                              <Badge className={getStatusBadge(lease.status)} data-testid={`badge-lease-status-${lease.id}`}>
                                {lease.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleViewLease(lease)}
                                data-testid={`button-view-lease-${lease.id}`}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}

          {!activeLease && leases.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <AlertCircle className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2" data-testid="heading-no-lease">No Active Lease</h3>
                <p className="text-muted-foreground mb-6" data-testid="text-no-lease">
                  You don't have an active lease at the moment.
                </p>
              </CardContent>
            </Card>
          )}
        </main>
      </div>

      {/* View Lease Details Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Lease Details</DialogTitle>
            <DialogDescription>Complete lease information</DialogDescription>
          </DialogHeader>
          {selectedLease && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  <Badge className={getStatusBadge(selectedLease.status)}>
                    {selectedLease.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Monthly Rent</p>
                  <p className="text-sm font-semibold">${parseFloat(selectedLease.monthlyRent).toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Property</p>
                  <p className="text-sm">{getUnitInfo(selectedLease.unitId).propertyAddress}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Unit</p>
                  <p className="text-sm">{getUnitInfo(selectedLease.unitId).unitNumber}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Start Date</p>
                  <p className="text-sm">{new Date(selectedLease.startDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">End Date</p>
                  <p className="text-sm">{new Date(selectedLease.endDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Security Deposit</p>
                  <p className="text-sm">${parseFloat(selectedLease.securityDeposit).toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                </div>
                {selectedLease.signedAt && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Signed Date</p>
                    <p className="text-sm">{new Date(selectedLease.signedAt).toLocaleString()}</p>
                  </div>
                )}
                {selectedLease.documentUrl && (
                  <div className="col-span-2">
                    <p className="text-sm font-medium text-muted-foreground mb-2">Lease Document</p>
                    <a 
                      href={selectedLease.documentUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-primary hover:underline"
                    >
                      <FileText className="h-4 w-4" />
                      View Lease Agreement
                    </a>
                  </div>
                )}
              </div>
              
              {/* Unit Details */}
              {getUnitInfo(selectedLease.unitId).unit && (
                <div className="mt-4 pt-4 border-t">
                  <h4 className="font-semibold mb-3">Unit Details</h4>
                  <div className="grid grid-cols-3 gap-4">
                    {getUnitInfo(selectedLease.unitId).unit?.bedrooms && (
                      <div>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Bed className="w-3 h-3" />
                          Bedrooms
                        </p>
                        <p className="font-medium">{getUnitInfo(selectedLease.unitId).unit?.bedrooms}</p>
                      </div>
                    )}
                    {getUnitInfo(selectedLease.unitId).unit?.bathrooms && (
                      <div>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Bath className="w-3 h-3" />
                          Bathrooms
                        </p>
                        <p className="font-medium">{getUnitInfo(selectedLease.unitId).unit?.bathrooms}</p>
                      </div>
                    )}
                    {getUnitInfo(selectedLease.unitId).unit?.squareFeet && (
                      <div>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Maximize className="w-3 h-3" />
                          Sq Ft
                        </p>
                        <p className="font-medium">{getUnitInfo(selectedLease.unitId).unit?.squareFeet}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

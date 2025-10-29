import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Home, MapPin, Bed, Bath, Maximize, DollarSign, Calendar, Search } from 'lucide-react';
import { useLocation } from 'wouter';
import { useAuth } from "@/hooks/useAuth";

interface AvailableUnit {
  id: string;
  unitNumber: string;
  bedrooms: number;
  bathrooms: number;
  squareFeet: number;
  monthlyRent: number;
  property: {
    id: string;
    name: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
  };
}

export default function TenantMarketplace() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [filters, setFilters] = useState({
    minRent: '',
    maxRent: '',
    bedrooms: 'any',
    bathrooms: 'any',
    city: '',
    state: '',
  });

  const queryParams = new URLSearchParams();
  if (filters.minRent) queryParams.set('minRent', filters.minRent);
  if (filters.maxRent) queryParams.set('maxRent', filters.maxRent);
  if (filters.bedrooms && filters.bedrooms !== 'any') queryParams.set('bedrooms', filters.bedrooms);
  if (filters.bathrooms && filters.bathrooms !== 'any') queryParams.set('bathrooms', filters.bathrooms);
  if (filters.city) queryParams.set('city', filters.city);
  if (filters.state) queryParams.set('state', filters.state);

  const { data: filteredUnits = [], isLoading } = useQuery<AvailableUnit[]>({
    queryKey: ['/api/marketplace/units', filters],
    queryFn: async () => {
      const url = queryParams.toString() 
        ? `/api/marketplace/units?${queryParams.toString()}`
        : '/api/marketplace/units';
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch units');
      return response.json();
    },
  });

  const handleApply = (unitId: string) => {
    setLocation(`/screening?unitId=${unitId}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2" data-testid="text-marketplace-title">Available Units</h1>
          <p className="text-muted-foreground">Find your perfect home</p>
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  Filters
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Price Range</Label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="Min"
                      value={filters.minRent}
                      onChange={(e) => setFilters({ ...filters, minRent: e.target.value })}
                      data-testid="input-min-rent"
                    />
                    <Input
                      type="number"
                      placeholder="Max"
                      value={filters.maxRent}
                      onChange={(e) => setFilters({ ...filters, maxRent: e.target.value })}
                      data-testid="input-max-rent"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Bedrooms</Label>
                  <Select value={filters.bedrooms} onValueChange={(value) => setFilters({ ...filters, bedrooms: value })}>
                    <SelectTrigger data-testid="select-bedrooms">
                      <SelectValue placeholder="Any" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any</SelectItem>
                      <SelectItem value="1">1 Bed</SelectItem>
                      <SelectItem value="2">2 Beds</SelectItem>
                      <SelectItem value="3">3 Beds</SelectItem>
                      <SelectItem value="4">4+ Beds</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Bathrooms</Label>
                  <Select value={filters.bathrooms} onValueChange={(value) => setFilters({ ...filters, bathrooms: value })}>
                    <SelectTrigger data-testid="select-bathrooms">
                      <SelectValue placeholder="Any" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any</SelectItem>
                      <SelectItem value="1">1 Bath</SelectItem>
                      <SelectItem value="2">2 Baths</SelectItem>
                      <SelectItem value="3">3+ Baths</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>City</Label>
                  <Input
                    placeholder="City name"
                    value={filters.city}
                    onChange={(e) => setFilters({ ...filters, city: e.target.value })}
                    data-testid="input-city"
                  />
                </div>

                <div className="space-y-2">
                  <Label>State</Label>
                  <Input
                    placeholder="State"
                    value={filters.state}
                    onChange={(e) => setFilters({ ...filters, state: e.target.value })}
                    data-testid="input-state"
                  />
                </div>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setFilters({ minRent: '', maxRent: '', bedrooms: 'any', bathrooms: 'any', city: '', state: '' })}
                  data-testid="button-clear-filters"
                >
                  Clear Filters
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-3">
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <p className="text-muted-foreground">Loading available units...</p>
              </div>
            ) : filteredUnits.length === 0 ? (
              <Card>
                <CardContent className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <Home className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-lg font-medium">No units available</p>
                    <p className="text-muted-foreground">Try adjusting your filters</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {filteredUnits.map((unit) => (
                  <Card key={unit.id} data-testid={`card-unit-${unit.id}`}>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span>{unit.property.name}</span>
                        <Badge variant="secondary">Unit {unit.unitNumber}</Badge>
                      </CardTitle>
                      <CardDescription className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {unit.property.address}, {unit.property.city}, {unit.property.state} {unit.property.zipCode}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1">
                            <Bed className="h-4 w-4 text-muted-foreground" />
                            <span>{unit.bedrooms} Bed{unit.bedrooms !== 1 ? 's' : ''}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Bath className="h-4 w-4 text-muted-foreground" />
                            <span>{unit.bathrooms} Bath{unit.bathrooms !== 1 ? 's' : ''}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Maximize className="h-4 w-4 text-muted-foreground" />
                            <span>{unit.squareFeet} sq ft</span>
                          </div>
                        </div>
                      </div>

                      <Separator />

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-5 w-5 text-primary" />
                          <div>
                            <p className="text-2xl font-bold">${unit.monthlyRent.toLocaleString()}</p>
                            <p className="text-xs text-muted-foreground">per month</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="flex gap-2">
                      <Button
                        className="flex-1"
                        onClick={() => handleApply(unit.id)}
                        data-testid={`button-apply-${unit.id}`}
                      >
                        <Calendar className="h-4 w-4 mr-2" />
                        Apply Now
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

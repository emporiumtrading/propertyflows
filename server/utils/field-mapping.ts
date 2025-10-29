// Field mapping templates for different property management systems
// Based on research from AppFolio, Buildium, and Yardi exports

type FieldMappingTemplate = {
  source: string;
  dataType: string;
  mapping: Record<string, string[]>; // our field -> [possible source field names]
};

// AppFolio Property/Unit field mappings
export const appfolioPropertyMapping: FieldMappingTemplate = {
  source: 'appfolio',
  dataType: 'properties',
  mapping: {
    name: ['Property Name', 'PropertyName', 'property_name'],
    address: ['Property Address', 'PropertyAddress', 'property_address', 'Address'],
    city: ['City'],
    state: ['State'],
    zipCode: ['Zip', 'ZipCode', 'Zip Code', 'zip_code'],
    type: ['Property Type', 'PropertyType', 'property_type'],
    numberOfUnits: ['Unit Count', 'UnitCount', 'unit_count', 'Number of Units'],
  },
};

export const appfolioUnitMapping: FieldMappingTemplate = {
  source: 'appfolio',
  dataType: 'units',
  mapping: {
    propertyName: ['Property Name', 'PropertyName', 'property_name'],
    unitNumber: ['Unit Name', 'UnitName', 'unit_name', 'Unit', 'Unit #'],
    bedrooms: ['Bd/Ba', 'Bedrooms', 'bedrooms', 'Bd'],
    bathrooms: ['Bd/Ba', 'Bathrooms', 'bathrooms', 'Ba'],
    squareFeet: ['Sqft', 'SquareFt', 'Square Footage', 'square_footage'],
    monthlyRent: ['Market Rent', 'MarketRent', 'market_rent', 'Rent', 'Monthly Rent'],
    status: ['Unit Status', 'UnitStatus', 'unit_status', 'Status'],
  },
};

export const appfolioTenantMapping: FieldMappingTemplate = {
  source: 'appfolio',
  dataType: 'tenants',
  mapping: {
    firstName: ['Tenant Name', 'TenantName', 'tenant_name', 'First Name', 'FirstName'],
    lastName: ['Last Name', 'LastName', 'last_name'],
    email: ['Email', 'Email Address', 'email_address'],
    phone: ['Phone', 'Phone Number', 'phone_number'],
    propertyName: ['Property/Unit', 'Property', 'PropertyName', 'property_name'],
    unitNumber: ['Property/Unit', 'Unit', 'UnitName', 'unit_name'],
    moveInDate: ['Move-In Date', 'MoveIn', 'move_in_date', 'Move In'],
    moveOutDate: ['Move-Out Date', 'MoveOut', 'move_out_date', 'Move Out'],
    leaseStatus: ['Lease Status', 'LeaseStatus', 'lease_status', 'Status', 'Tenant Type'],
  },
};

// Buildium Property/Unit field mappings
export const buildiumPropertyMapping: FieldMappingTemplate = {
  source: 'buildium',
  dataType: 'properties',
  mapping: {
    name: ['Property name', 'PropertyName', 'property_name', 'Name'],
    address: ['Address', 'Street Address', 'street_address'],
    city: ['City'],
    state: ['State'],
    zipCode: ['Zip', 'ZipCode', 'Zip Code', 'zip_code'],
    type: ['Property Type', 'PropertyType', 'property_type', 'Type'],
    numberOfUnits: ['Unit Count', 'Number of Units', 'number_of_units'],
  },
};

export const buildiumUnitMapping: FieldMappingTemplate = {
  source: 'buildium',
  dataType: 'units',
  mapping: {
    propertyName: ['Property name', 'PropertyName', 'property_name', 'Property'],
    unitNumber: ['Unit number', 'UnitNumber', 'unit_number', 'Unit #', 'Unit'],
    type: ['Unit type', 'UnitType', 'unit_type', 'Type'],
    bedrooms: ['Bedrooms', 'bedrooms', 'Beds', 'Bd'],
    bathrooms: ['Bathrooms', 'bathrooms', 'Baths', 'Ba'],
    squareFeet: ['Square footage', 'SquareFootage', 'square_footage', 'Sqft'],
    monthlyRent: ['Market rent', 'MarketRent', 'market_rent', 'Rent'],
  },
};

export const buildiumTenantMapping: FieldMappingTemplate = {
  source: 'buildium',
  dataType: 'tenants',
  mapping: {
    firstName: ['Tenant first name', 'First name', 'FirstName', 'first_name'],
    lastName: ['Tenant last name', 'Last name', 'LastName', 'last_name'],
    email: ['Email address', 'Email', 'email_address'],
    phone: ['Phone', 'Phone number', 'phone_number'],
    propertyName: ['Property name', 'PropertyName', 'property_name', 'Property'],
    unitNumber: ['Unit number', 'UnitNumber', 'unit_number', 'Unit'],
    moveInDate: ['Move-in date', 'Move in date', 'MoveInDate', 'move_in_date'],
  },
};

export const buildiumLeaseMapping: FieldMappingTemplate = {
  source: 'buildium',
  dataType: 'leases',
  mapping: {
    propertyName: ['Property name', 'PropertyName', 'property_name', 'Property'],
    unitNumber: ['Unit number', 'UnitNumber', 'unit_number', 'Unit'],
    tenantFirstName: ['Tenant first name', 'First name', 'FirstName'],
    tenantLastName: ['Tenant last name', 'Last name', 'LastName'],
    startDate: ['Lease start date', 'Start date', 'LeaseStartDate', 'lease_start_date'],
    endDate: ['Lease end date', 'End date', 'LeaseEndDate', 'lease_end_date'],
    rentAmount: ['Recurring charge amount', 'Rent amount', 'RentAmount', 'rent_amount', 'Monthly Rent'],
    securityDeposit: ['Security deposit', 'SecurityDeposit', 'security_deposit'],
  },
};

// Yardi field mappings (more flexible due to customizable exports)
export const yardiPropertyMapping: FieldMappingTemplate = {
  source: 'yardi',
  dataType: 'properties',
  mapping: {
    name: ['Property', 'PropertyName', 'property_name', 'Property Name', 'Building'],
    address: ['Address', 'PropertyAddress', 'property_address', 'Street Address'],
    city: ['City'],
    state: ['State'],
    zipCode: ['Zip', 'ZipCode', 'PostalCode', 'postal_code'],
    type: ['PropertyType', 'property_type', 'Type'],
  },
};

export const yardiUnitMapping: FieldMappingTemplate = {
  source: 'yardi',
  dataType: 'units',
  mapping: {
    propertyName: ['Property', 'PropertyName', 'property_name', 'Building', 'PropertyCode'],
    unitNumber: ['Unit', 'UnitCode', 'unit_code', 'Unit Number', 'UnitNumber'],
    bedrooms: ['Bedrooms', 'Bd', 'BdBa', 'bedrooms'],
    bathrooms: ['Bathrooms', 'Ba', 'BdBa', 'bathrooms'],
    squareFeet: ['SquareFt', 'Sqft', 'square_ft', 'Area'],
    monthlyRent: ['Rent', 'MarketRent', 'market_rent', 'MonthlyRent', 'Amount'],
  },
};

export const yardiTenantMapping: FieldMappingTemplate = {
  source: 'yardi',
  dataType: 'tenants',
  mapping: {
    firstName: ['Tenant', 'FirstName', 'first_name', 'TenantFirstName'],
    lastName: ['LastName', 'last_name', 'TenantLastName'],
    email: ['Email', 'EmailAddress', 'email_address'],
    phone: ['Phone', 'PhoneNumber', 'phone_number', 'TenantPhone'],
    propertyName: ['Property', 'PropertyName', 'property_name', 'PropertyCode'],
    unitNumber: ['Unit', 'UnitCode', 'unit_code', 'UnitNumber'],
    moveInDate: ['MoveIn', 'MoveInDate', 'move_in_date', 'LeaseFrom'],
    moveOutDate: ['MoveOut', 'MoveOutDate', 'move_out_date', 'LeaseTo'],
  },
};

// Vendor mapping (generic across systems)
export const vendorMapping: FieldMappingTemplate = {
  source: 'generic_csv',
  dataType: 'vendors',
  mapping: {
    companyName: ['Company Name', 'CompanyName', 'company_name', 'Vendor Name', 'VendorName', 'Name'],
    contactName: ['Contact Name', 'ContactName', 'contact_name', 'Contact'],
    email: ['Email', 'Email Address', 'email_address'],
    phone: ['Phone', 'Phone Number', 'phone_number'],
    address: ['Address', 'Street Address', 'street_address'],
    city: ['City'],
    state: ['State'],
    zipCode: ['Zip', 'ZipCode', 'Zip Code'],
    specialty: ['Specialty', 'Service Type', 'service_type', 'Type'],
  },
};

// Auto-detect field mapping based on CSV headers
export function autoDetectFieldMapping(
  headers: string[],
  dataType: string,
  source?: string
): Record<string, string> {
  const templates: FieldMappingTemplate[] = [];
  
  // Select templates based on source or try all
  if (source === 'appfolio') {
    if (dataType === 'properties') templates.push(appfolioPropertyMapping);
    if (dataType === 'units') templates.push(appfolioUnitMapping);
    if (dataType === 'tenants') templates.push(appfolioTenantMapping);
  } else if (source === 'buildium') {
    if (dataType === 'properties') templates.push(buildiumPropertyMapping);
    if (dataType === 'units') templates.push(buildiumUnitMapping);
    if (dataType === 'tenants') templates.push(buildiumTenantMapping);
    if (dataType === 'leases') templates.push(buildiumLeaseMapping);
  } else if (source === 'yardi') {
    if (dataType === 'properties') templates.push(yardiPropertyMapping);
    if (dataType === 'units') templates.push(yardiUnitMapping);
    if (dataType === 'tenants') templates.push(yardiTenantMapping);
  } else {
    // Try all templates
    if (dataType === 'properties') {
      templates.push(appfolioPropertyMapping, buildiumPropertyMapping, yardiPropertyMapping);
    } else if (dataType === 'units') {
      templates.push(appfolioUnitMapping, buildiumUnitMapping, yardiUnitMapping);
    } else if (dataType === 'tenants') {
      templates.push(appfolioTenantMapping, buildiumTenantMapping, yardiTenantMapping);
    } else if (dataType === 'leases') {
      templates.push(buildiumLeaseMapping);
    } else if (dataType === 'vendors') {
      templates.push(vendorMapping);
    }
  }
  
  const result: Record<string, string> = {};
  
  // For each target field in our system
  for (const template of templates) {
    for (const [targetField, possibleHeaders] of Object.entries(template.mapping)) {
      // Skip if already mapped
      if (result[targetField]) continue;
      
      // Find first matching header
      for (const possibleHeader of possibleHeaders) {
        const matchingHeader = headers.find(
          h => h.trim().toLowerCase() === possibleHeader.toLowerCase()
        );
        
        if (matchingHeader) {
          result[targetField] = matchingHeader;
          break;
        }
      }
    }
  }
  
  return result;
}

// Get all unmapped headers (for user to map manually)
export function getUnmappedHeaders(
  headers: string[],
  mapping: Record<string, string>
): string[] {
  const mappedHeaders = new Set(Object.values(mapping));
  return headers.filter(h => !mappedHeaders.has(h));
}

// Validate required fields are mapped
export function validateFieldMapping(
  mapping: Record<string, string>,
  dataType: string
): { valid: boolean; missingFields: string[] } {
  const requiredFields: Record<string, string[]> = {
    properties: ['name', 'address'],
    units: ['propertyName', 'unitNumber'],
    tenants: ['firstName', 'lastName', 'email', 'propertyName', 'unitNumber'],
    leases: ['propertyName', 'unitNumber', 'startDate', 'rentAmount'],
    vendors: ['companyName', 'email', 'phone'],
  };
  
  const required = requiredFields[dataType] || [];
  const missingFields = required.filter(field => !mapping[field]);
  
  return {
    valid: missingFields.length === 0,
    missingFields,
  };
}

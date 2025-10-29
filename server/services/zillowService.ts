interface ZillowListing {
  address: string;
  city: string;
  state: string;
  zipCode: string;
  bedrooms: number;
  bathrooms: number;
  squareFeet: number;
  monthlyRent: number;
  description: string;
  amenities: string[];
  photos: string[];
  availableDate: string;
}

interface ZillowCredentials {
  apiKey: string;
  partnerId: string;
}

function getZillowCredentials(): ZillowCredentials | null {
  const apiKey = process.env.ZILLOW_API_KEY;
  const partnerId = process.env.ZILLOW_PARTNER_ID;
  
  if (!apiKey || !partnerId) {
    console.warn('[Zillow] API credentials not configured');
    return null;
  }
  
  return { apiKey, partnerId };
}

export async function createListing(listing: ZillowListing): Promise<{
  success: boolean;
  listingId?: string;
  error?: string;
}> {
  const credentials = getZillowCredentials();
  
  if (!credentials) {
    return { success: false, error: 'Zillow not configured' };
  }

  try {
    const response = await fetch('https://rentals.api.zillow.com/v1/listings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': credentials.apiKey,
        'X-Partner-ID': credentials.partnerId,
      },
      body: JSON.stringify({
        address: {
          streetAddress: listing.address,
          city: listing.city,
          state: listing.state,
          zipCode: listing.zipCode,
        },
        property: {
          bedrooms: listing.bedrooms,
          bathrooms: listing.bathrooms,
          squareFeet: listing.squareFeet,
        },
        listing: {
          monthlyRent: listing.monthlyRent,
          description: listing.description,
          amenities: listing.amenities,
          availableDate: listing.availableDate,
        },
        media: {
          photos: listing.photos.map((url, index) => ({
            url,
            order: index + 1,
          })),
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Zillow] API error:', {
        status: response.status,
        error: errorText,
      });
      return {
        success: false,
        error: `API error: ${response.status} - ${errorText}`,
      };
    }

    const data = await response.json();
    return {
      success: true,
      listingId: data.listingId || data.id,
    };
  } catch (error: any) {
    console.error('[Zillow] Error creating listing:', {
      error: error?.message,
      address: listing.address,
    });
    return {
      success: false,
      error: error?.message || 'Failed to create listing',
    };
  }
}

export async function updateListing(
  listingId: string,
  updates: Partial<ZillowListing>
): Promise<{
  success: boolean;
  error?: string;
}> {
  const credentials = getZillowCredentials();
  
  if (!credentials) {
    return { success: false, error: 'Zillow not configured' };
  }

  try {
    const payload: any = {};
    
    if (updates.address || updates.city || updates.state || updates.zipCode) {
      payload.address = {
        ...(updates.address && { streetAddress: updates.address }),
        ...(updates.city && { city: updates.city }),
        ...(updates.state && { state: updates.state }),
        ...(updates.zipCode && { zipCode: updates.zipCode }),
      };
    }
    
    if (updates.bedrooms !== undefined || updates.bathrooms !== undefined || updates.squareFeet !== undefined) {
      payload.property = {
        ...(updates.bedrooms !== undefined && { bedrooms: updates.bedrooms }),
        ...(updates.bathrooms !== undefined && { bathrooms: updates.bathrooms }),
        ...(updates.squareFeet !== undefined && { squareFeet: updates.squareFeet }),
      };
    }
    
    if (updates.monthlyRent !== undefined || updates.description !== undefined || updates.amenities !== undefined || updates.availableDate !== undefined) {
      payload.listing = {
        ...(updates.monthlyRent !== undefined && { monthlyRent: updates.monthlyRent }),
        ...(updates.description !== undefined && { description: updates.description }),
        ...(updates.amenities !== undefined && { amenities: updates.amenities }),
        ...(updates.availableDate !== undefined && { availableDate: updates.availableDate }),
      };
    }
    
    if (updates.photos && updates.photos.length > 0) {
      payload.media = {
        photos: updates.photos.map((url, index) => ({
          url,
          order: index + 1,
        })),
      };
    }

    const response = await fetch(`https://rentals.api.zillow.com/v1/listings/${listingId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': credentials.apiKey,
        'X-Partner-ID': credentials.partnerId,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Zillow] API error:', {
        status: response.status,
        error: errorText,
        listingId,
      });
      return {
        success: false,
        error: `API error: ${response.status}`,
      };
    }

    return { success: true };
  } catch (error: any) {
    console.error('[Zillow] Error updating listing:', {
      error: error?.message,
      listingId,
    });
    return {
      success: false,
      error: error?.message || 'Failed to update listing',
    };
  }
}

export async function deleteListing(listingId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  const credentials = getZillowCredentials();
  
  if (!credentials) {
    return { success: false, error: 'Zillow not configured' };
  }

  try {
    const response = await fetch(`https://rentals.api.zillow.com/v1/listings/${listingId}`, {
      method: 'DELETE',
      headers: {
        'X-API-Key': credentials.apiKey,
        'X-Partner-ID': credentials.partnerId,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Zillow] API error:', {
        status: response.status,
        error: errorText,
        listingId,
      });
      return {
        success: false,
        error: `API error: ${response.status}`,
      };
    }

    return { success: true };
  } catch (error: any) {
    console.error('[Zillow] Error deleting listing:', {
      error: error?.message,
      listingId,
    });
    return {
      success: false,
      error: error?.message || 'Failed to delete listing',
    };
  }
}

export async function getListingStatus(listingId: string): Promise<{
  status: 'active' | 'pending' | 'inactive' | 'error';
  views?: number;
  inquiries?: number;
  lastUpdated?: string;
} | null> {
  const credentials = getZillowCredentials();
  
  if (!credentials) {
    console.warn('[Zillow] API credentials not configured');
    return null;
  }

  try {
    const response = await fetch(`https://rentals.api.zillow.com/v1/listings/${listingId}`, {
      method: 'GET',
      headers: {
        'X-API-Key': credentials.apiKey,
        'X-Partner-ID': credentials.partnerId,
      },
    });

    if (!response.ok) {
      console.error('[Zillow] API error getting listing status:', {
        status: response.status,
        listingId,
      });
      return null;
    }

    const data = await response.json();
    return {
      status: data.status || 'pending',
      views: data.analytics?.views || 0,
      inquiries: data.analytics?.inquiries || 0,
      lastUpdated: data.updatedAt,
    };
  } catch (error: any) {
    console.error('[Zillow] Error getting listing status:', {
      error: error?.message,
      listingId,
    });
    return null;
  }
}

export async function syncUnitToZillow(unit: {
  id: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  bedrooms: number;
  bathrooms: number;
  squareFeet?: number;
  monthlyRent: string;
  description?: string;
  amenities?: string[];
  photos?: string[];
}): Promise<{
  success: boolean;
  listingId?: string;
  error?: string;
}> {
  try {
    const listing: ZillowListing = {
      address: unit.address,
      city: unit.city,
      state: unit.state,
      zipCode: unit.zipCode,
      bedrooms: unit.bedrooms,
      bathrooms: unit.bathrooms,
      squareFeet: unit.squareFeet || 0,
      monthlyRent: parseFloat(unit.monthlyRent),
      description: unit.description || `${unit.bedrooms} bed, ${unit.bathrooms} bath unit available for rent`,
      amenities: unit.amenities || [],
      photos: unit.photos || [],
      availableDate: new Date().toISOString().split('T')[0],
    };

    return await createListing(listing);
  } catch (error: any) {
    console.error('[Zillow] Error syncing unit:', {
      error: error?.message,
      unitId: unit.id,
    });
    return {
      success: false,
      error: error?.message || 'Failed to sync unit',
    };
  }
}

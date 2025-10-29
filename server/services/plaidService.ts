let plaidClient: any = null;

function getPlaidClient(): any {
  const clientId = process.env.PLAID_CLIENT_ID;
  const secret = process.env.PLAID_SECRET;
  
  if (!plaidClient && clientId && secret) {
    try {
      const { Configuration, PlaidApi, PlaidEnvironments } = require('plaid');
      const configuration = new Configuration({
        basePath: PlaidEnvironments[process.env.PLAID_ENV || 'sandbox'],
        baseOptions: {
          headers: {
            'PLAID-CLIENT-ID': clientId,
            'PLAID-SECRET': secret,
          },
        },
      });
      plaidClient = new PlaidApi(configuration);
    } catch (error: any) {
      console.error('[Plaid] Failed to initialize client:', {
        error: error?.message,
      });
      return null;
    }
  }
  return plaidClient;
}

export async function createLinkToken(userId: string): Promise<string | null> {
  const client = getPlaidClient();
  
  if (!client) {
    console.warn('[Plaid] Client not configured - bank verification unavailable');
    return null;
  }

  try {
    const { Products, CountryCode } = require('plaid');
    const response = await client.linkTokenCreate({
      user: { client_user_id: userId },
      client_name: 'PropertyFlows',
      products: [Products.Auth],
      country_codes: [CountryCode.Us],
      language: 'en',
    });
    
    return response.data.link_token;
  } catch (error: any) {
    console.error('[Plaid] Error creating link token:', {
      error: error?.message,
      userId,
    });
    return null;
  }
}

export async function exchangePublicToken(publicToken: string): Promise<{
  accessToken: string;
  itemId: string;
} | null> {
  const client = getPlaidClient();
  
  if (!client) {
    console.warn('[Plaid] Client not configured');
    return null;
  }

  try {
    const response = await client.itemPublicTokenExchange({
      public_token: publicToken,
    });
    
    return {
      accessToken: response.data.access_token,
      itemId: response.data.item_id,
    };
  } catch (error: any) {
    console.error('[Plaid] Error exchanging public token:', {
      error: error?.message,
    });
    return null;
  }
}

export async function getAuthData(accessToken: string): Promise<{
  accounts: Array<{
    id: string;
    name: string;
    type: string;
    subtype: string;
    mask: string;
  }>;
  numbers: {
    ach: Array<{
      accountId: string;
      account: string;
      routing: string;
      wireRouting: string | null;
    }>;
  };
} | null> {
  const client = getPlaidClient();
  
  if (!client) {
    console.warn('[Plaid] Client not configured');
    return null;
  }

  try {
    const response = await client.authGet({
      access_token: accessToken,
    });
    
    return {
      accounts: response.data.accounts.map((acc: any) => ({
        id: acc.account_id,
        name: acc.name,
        type: acc.type,
        subtype: acc.subtype || '',
        mask: acc.mask || '',
      })),
      numbers: {
        ach: response.data.numbers.ach?.map((num: any) => ({
          accountId: num.account_id,
          account: num.account,
          routing: num.routing,
          wireRouting: num.wire_routing || null,
        })) || [],
      },
    };
  } catch (error: any) {
    console.error('[Plaid] Error getting auth data:', {
      error: error?.message,
    });
    return null;
  }
}

export async function verifyBankAccount(publicToken: string): Promise<{
  verified: boolean;
  accountId?: string;
  routing?: string;
  account?: string;
  error?: string;
}> {
  try {
    const tokenData = await exchangePublicToken(publicToken);
    if (!tokenData) {
      return { verified: false, error: 'Failed to exchange token' };
    }

    const authData = await getAuthData(tokenData.accessToken);
    if (!authData || !authData.numbers.ach.length) {
      return { verified: false, error: 'No ACH accounts found' };
    }

    const achAccount = authData.numbers.ach[0];
    return {
      verified: true,
      accountId: achAccount.accountId,
      routing: achAccount.routing,
      account: achAccount.account,
    };
  } catch (error: any) {
    console.error('[Plaid] Error verifying bank account:', {
      error: error?.message,
    });
    return {
      verified: false,
      error: error?.message || 'Verification failed',
    };
  }
}

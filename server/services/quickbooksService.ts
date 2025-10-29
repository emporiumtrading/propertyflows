interface QuickBooksConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  environment: 'sandbox' | 'production';
}

interface QuickBooksTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  realm_id: string;
}

interface QuickBooksAccount {
  Id: string;
  Name: string;
  AccountType: string;
  AccountSubType: string;
}

function getQuickBooksConfig(req?: any): QuickBooksConfig | null {
  const clientId = process.env.QUICKBOOKS_CLIENT_ID;
  const clientSecret = process.env.QUICKBOOKS_CLIENT_SECRET;
  
  if (!clientId || !clientSecret) {
    console.warn('QuickBooks credentials not configured');
    return null;
  }

  const host = req ? `${req.protocol}://${req.get('host')}` : 'http://localhost:5000';
  
  return {
    clientId,
    clientSecret,
    redirectUri: `${host}/api/quickbooks/callback`,
    environment: process.env.QUICKBOOKS_ENV === 'production' ? 'production' : 'sandbox',
  };
}

export function getQuickBooksAuthUrl(req: any, state: string): string | null {
  const config = getQuickBooksConfig(req);
  if (!config) return null;

  const baseUrl = config.environment === 'production'
    ? 'https://appcenter.intuit.com/connect/oauth2'
    : 'https://appcenter.intuit.com/connect/oauth2';

  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: 'code',
    scope: 'com.intuit.quickbooks.accounting',
    state,
  });

  return `${baseUrl}?${params.toString()}`;
}

export async function exchangeAuthCode(req: any, code: string): Promise<QuickBooksTokens | null> {
  const config = getQuickBooksConfig(req);
  if (!config) return null;

  const tokenEndpoint = config.environment === 'production'
    ? 'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer'
    : 'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer';

  const basicAuth = Buffer.from(`${config.clientId}:${config.clientSecret}`).toString('base64');

  try {
    const response = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${basicAuth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: config.redirectUri,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('QuickBooks token exchange error:', error);
      return null;
    }

    const data = await response.json();
    return {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_in: data.expires_in,
      realm_id: data.realmId || '',
    };
  } catch (error) {
    console.error('Error exchanging QuickBooks auth code:', error);
    return null;
  }
}

export async function refreshAccessToken(refreshToken: string): Promise<{ access_token: string; refresh_token: string } | null> {
  const config = getQuickBooksConfig();
  if (!config) return null;

  const tokenEndpoint = 'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer';
  const basicAuth = Buffer.from(`${config.clientId}:${config.clientSecret}`).toString('base64');

  try {
    const response = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${basicAuth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('QuickBooks refresh token error:', error);
      return null;
    }

    const data = await response.json();
    return {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
    };
  } catch (error) {
    console.error('Error refreshing QuickBooks token:', error);
    return null;
  }
}

async function makeQuickBooksRequest(
  accessToken: string,
  realmId: string,
  endpoint: string,
  method: string = 'GET',
  body?: any
): Promise<any> {
  const config = getQuickBooksConfig();
  if (!config) return null;

  const baseUrl = config.environment === 'production'
    ? `https://quickbooks.api.intuit.com/v3/company/${realmId}`
    : `https://sandbox-quickbooks.api.intuit.com/v3/company/${realmId}`;

  const url = `${baseUrl}${endpoint}`;

  try {
    const response = await fetch(url, {
      method,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('QuickBooks API error:', error);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('Error making QuickBooks request:', error);
    return null;
  }
}

export async function getChartOfAccounts(accessToken: string, realmId: string): Promise<QuickBooksAccount[]> {
  const result = await makeQuickBooksRequest(
    accessToken,
    realmId,
    '/query?query=SELECT * FROM Account'
  );

  return result?.QueryResponse?.Account || [];
}

export async function syncTransactionToQuickBooks(
  accessToken: string,
  realmId: string,
  transaction: {
    date: string;
    type: 'income' | 'expense';
    category: string;
    description: string;
    amount: number;
    accountId: string;
  }
): Promise<boolean> {
  const accounts = await makeQuickBooksRequest(
    accessToken,
    realmId,
    '/query?query=SELECT * FROM Account WHERE Classification IN (\'Asset\', \'Bank\') AND Active = true MAXRESULTS 1'
  );
  
  const bankAccount = accounts?.QueryResponse?.Account?.[0];
  if (!bankAccount) {
    console.error('No active bank account found in QuickBooks. Cannot sync transaction.');
    return false;
  }

  const journalEntry = {
    Line: transaction.type === 'income' ? [
      {
        Amount: transaction.amount,
        DetailType: 'JournalEntryLineDetail',
        JournalEntryLineDetail: {
          PostingType: 'Debit',
          AccountRef: { value: bankAccount.Id },
        },
        Description: `${transaction.category} - ${transaction.description}`,
      },
      {
        Amount: transaction.amount,
        DetailType: 'JournalEntryLineDetail',
        JournalEntryLineDetail: {
          PostingType: 'Credit',
          AccountRef: { value: transaction.accountId },
        },
        Description: transaction.description,
      },
    ] : [
      {
        Amount: transaction.amount,
        DetailType: 'JournalEntryLineDetail',
        JournalEntryLineDetail: {
          PostingType: 'Debit',
          AccountRef: { value: transaction.accountId },
        },
        Description: transaction.description,
      },
      {
        Amount: transaction.amount,
        DetailType: 'JournalEntryLineDetail',
        JournalEntryLineDetail: {
          PostingType: 'Credit',
          AccountRef: { value: bankAccount.Id },
        },
        Description: `${transaction.category} - ${transaction.description}`,
      },
    ],
    TxnDate: transaction.date,
    DocNumber: `PF-${transaction.date}-${Math.random().toString(36).substr(2, 9)}`,
  };

  const result = await makeQuickBooksRequest(
    accessToken,
    realmId,
    '/journalentry',
    'POST',
    { JournalEntry: journalEntry }
  );

  return !!result;
}

export async function batchSyncTransactions(
  accessToken: string,
  realmId: string,
  transactions: Array<{
    date: string;
    type: 'income' | 'expense';
    category: string;
    description: string;
    amount: number;
    accountId: string;
  }>
): Promise<{ success: number; failed: number }> {
  let success = 0;
  let failed = 0;

  for (const transaction of transactions) {
    const result = await syncTransactionToQuickBooks(
      accessToken,
      realmId,
      transaction
    );

    if (result) {
      success++;
    } else {
      failed++;
    }
  }

  return { success, failed };
}

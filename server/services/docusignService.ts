let docusignClient: any = null;

function getDocuSignClient(): any {
  const accountId = process.env.DOCUSIGN_ACCOUNT_ID;
  const integrationKey = process.env.DOCUSIGN_INTEGRATION_KEY;
  const userId = process.env.DOCUSIGN_USER_ID;
  const privateKey = process.env.DOCUSIGN_PRIVATE_KEY;
  
  if (!docusignClient && accountId && integrationKey && userId && privateKey) {
    try {
      const docusign = require('docusign-esign');
      const apiClient = new docusign.ApiClient();
      apiClient.setBasePath(process.env.DOCUSIGN_BASE_PATH || 'https://demo.docusign.net/restapi');
      
      const jwtLifeSec = 10 * 60;
      const scopes = ['signature', 'impersonation'];
      
      docusignClient = {
        apiClient,
        accountId,
        integrationKey,
        userId,
        privateKey: Buffer.from(privateKey, 'base64').toString('utf-8'),
        scopes,
        jwtLifeSec,
      };
    } catch (error: any) {
      console.error('[DocuSign] Failed to initialize client:', {
        error: error?.message,
      });
      return null;
    }
  }
  return docusignClient;
}

async function getAccessToken(): Promise<string | null> {
  const client = getDocuSignClient();
  
  if (!client) {
    console.warn('[DocuSign] Client not configured');
    return null;
  }

  try {
    const docusign = require('docusign-esign');
    const results = await client.apiClient.requestJWTUserToken(
      client.integrationKey,
      client.userId,
      client.scopes,
      client.privateKey,
      client.jwtLifeSec
    );
    
    return results.body.access_token;
  } catch (error: any) {
    console.error('[DocuSign] Error getting access token:', {
      error: error?.message,
    });
    return null;
  }
}

export async function sendEnvelopeForSignature(params: {
  recipientEmail: string;
  recipientName: string;
  documentName: string;
  documentBase64: string;
  subjectLine: string;
}): Promise<{
  success: boolean;
  envelopeId?: string;
  error?: string;
}> {
  const client = getDocuSignClient();
  
  if (!client) {
    return { success: false, error: 'DocuSign not configured' };
  }

  try {
    const accessToken = await getAccessToken();
    if (!accessToken) {
      return { success: false, error: 'Failed to get access token' };
    }

    client.apiClient.addDefaultHeader('Authorization', `Bearer ${accessToken}`);
    const docusign = require('docusign-esign');
    const envelopesApi = new docusign.EnvelopesApi(client.apiClient);

    const document = new docusign.Document();
    document.documentBase64 = params.documentBase64;
    document.name = params.documentName;
    document.fileExtension = 'pdf';
    document.documentId = '1';

    const signer = new docusign.Signer();
    signer.email = params.recipientEmail;
    signer.name = params.recipientName;
    signer.recipientId = '1';
    signer.routingOrder = '1';

    const signHere = new docusign.SignHere();
    signHere.documentId = '1';
    signHere.pageNumber = '1';
    signHere.recipientId = '1';
    signHere.tabLabel = 'SignHereTab';
    signHere.xPosition = '200';
    signHere.yPosition = '700';

    const tabs = new docusign.Tabs();
    tabs.signHereTabs = [signHere];
    signer.tabs = tabs;

    const recipients = new docusign.Recipients();
    recipients.signers = [signer];

    const envelopeDefinition = new docusign.EnvelopeDefinition();
    envelopeDefinition.emailSubject = params.subjectLine;
    envelopeDefinition.documents = [document];
    envelopeDefinition.recipients = recipients;
    envelopeDefinition.status = 'sent';

    const results = await envelopesApi.createEnvelope(client.accountId, {
      envelopeDefinition,
    });

    return {
      success: true,
      envelopeId: results.envelopeId,
    };
  } catch (error: any) {
    console.error('[DocuSign] Error sending envelope:', {
      error: error?.message,
      recipient: params.recipientEmail,
    });
    return {
      success: false,
      error: error?.message || 'Failed to send envelope',
    };
  }
}

export async function getEnvelopeStatus(envelopeId: string): Promise<{
  status: string;
  recipients?: Array<{
    name: string;
    email: string;
    status: string;
    signedDateTime?: string;
  }>;
} | null> {
  const client = getDocuSignClient();
  
  if (!client) {
    console.warn('[DocuSign] Client not configured');
    return null;
  }

  try {
    const accessToken = await getAccessToken();
    if (!accessToken) {
      return null;
    }

    client.apiClient.addDefaultHeader('Authorization', `Bearer ${accessToken}`);
    const docusign = require('docusign-esign');
    const envelopesApi = new docusign.EnvelopesApi(client.apiClient);

    const envelope = await envelopesApi.getEnvelope(client.accountId, envelopeId);
    
    return {
      status: envelope.status,
      recipients: envelope.recipients?.signers?.map((signer: any) => ({
        name: signer.name,
        email: signer.email,
        status: signer.status,
        signedDateTime: signer.signedDateTime,
      })) || [],
    };
  } catch (error: any) {
    console.error('[DocuSign] Error getting envelope status:', {
      error: error?.message,
      envelopeId,
    });
    return null;
  }
}

export async function downloadSignedDocument(envelopeId: string): Promise<Buffer | null> {
  const client = getDocuSignClient();
  
  if (!client) {
    console.warn('[DocuSign] Client not configured');
    return null;
  }

  try {
    const accessToken = await getAccessToken();
    if (!accessToken) {
      return null;
    }

    client.apiClient.addDefaultHeader('Authorization', `Bearer ${accessToken}`);
    const docusign = require('docusign-esign');
    const envelopesApi = new docusign.EnvelopesApi(client.apiClient);

    const document = await envelopesApi.getDocument(
      client.accountId,
      envelopeId,
      'combined'
    );
    
    return Buffer.from(document, 'binary');
  } catch (error: any) {
    console.error('[DocuSign] Error downloading document:', {
      error: error?.message,
      envelopeId,
    });
    return null;
  }
}

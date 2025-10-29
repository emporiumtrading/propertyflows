import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Upload, FileSpreadsheet, CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { queryClient, apiRequest } from '@/lib/queryClient';

type ImportDataType = 'properties' | 'units' | 'tenants' | 'leases' | 'vendors' | 'maintenance_requests' | 'transactions';
type ImportSource = 'appfolio' | 'buildium' | 'yardi' | 'rentmanager' | 'generic_csv';
type ImportStatus = 'pending' | 'parsing' | 'validating' | 'importing' | 'completed' | 'failed' | 'rolled_back';

interface ImportJob {
  id: string;
  dataType: ImportDataType;
  source: ImportSource;
  fileName: string;
  status: ImportStatus;
  totalRows: number;
  processedRows: number;
  successfulRows: number;
  failedRows: number;
  fieldMapping?: Record<string, string>;
  validationErrors?: Array<{ row: number; field: string; error: string }>;
  errorMessage?: string;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
}

export default function DataImport() {
  const { toast } = useToast();
  const [selectedDataType, setSelectedDataType] = useState<ImportDataType>('properties');
  const [selectedSource, setSelectedSource] = useState<ImportSource>('generic_csv');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const [preview, setPreview] = useState<any[] | null>(null);
  const [headers, setHeaders] = useState<string[] | null>(null);
  const [autoMapping, setAutoMapping] = useState<Record<string, string> | null>(null);

  const { data: importJobs = [], isLoading: jobsLoading } = useQuery({
    queryKey: ['/api/import'],
  });

  const { data: currentJob } = useQuery({
    queryKey: ['/api/import', currentJobId],
    enabled: !!currentJobId,
    refetchInterval: currentJob?.status === 'importing' ? 1000 : false,
  });

  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await fetch('/api/import/upload', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Upload failed');
      }
      return res.json();
    },
    onSuccess: (data) => {
      setCurrentJobId(data.jobId);
      setPreview(data.preview);
      setHeaders(data.headers);
      setAutoMapping(data.autoMapping);
      toast({
        title: 'File uploaded successfully',
        description: `Found ${data.rowCount} rows. Review field mapping below.`,
      });
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Upload failed',
        description: error.message,
      });
    },
  });

  const executeMutation = useMutation({
    mutationFn: async ({ jobId, dryRun }: { jobId: string; dryRun: boolean }) => {
      return apiRequest(`/api/import/${jobId}/execute`, {
        method: 'POST',
        body: JSON.stringify({ dryRun }),
      });
    },
    onSuccess: (data, { dryRun }) => {
      queryClient.invalidateQueries({ queryKey: ['/api/import'] });
      queryClient.invalidateQueries({ queryKey: ['/api/import', currentJobId] });
      
      toast({
        title: dryRun ? 'Dry run completed' : 'Import completed',
        description: `${data.successfulRows} successful, ${data.failedRows} failed`,
      });

      if (!dryRun && data.successfulRows > 0) {
        queryClient.invalidateQueries({ queryKey: ['/api/properties'] });
        queryClient.invalidateQueries({ queryKey: ['/api/units'] });
      }
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Import failed',
        description: error.message,
      });
    },
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadedFile(file);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('dataType', selectedDataType);
    formData.append('source', selectedSource);

    uploadMutation.mutate(formData);
  };

  const getStatusBadge = (status: ImportStatus) => {
    const variants: Record<ImportStatus, { variant: any; icon: any }> = {
      pending: { variant: 'secondary', icon: AlertCircle },
      parsing: { variant: 'default', icon: Loader2 },
      validating: { variant: 'default', icon: Loader2 },
      importing: { variant: 'default', icon: Loader2 },
      completed: { variant: 'default', icon: CheckCircle },
      failed: { variant: 'destructive', icon: XCircle },
      rolled_back: { variant: 'secondary', icon: XCircle },
    };

    const { variant, icon: Icon } = variants[status];
    return (
      <Badge variant={variant} className="flex items-center gap-1 w-fit">
        <Icon className={`h-3 w-3 ${status === 'importing' ? 'animate-spin' : ''}`} />
        {status}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen p-6 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-gray-100">
            Data Import
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Bulk import data from AppFolio, Buildium, Yardi, or CSV files
          </p>
        </div>

        <Tabs defaultValue="upload" className="w-full">
          <TabsList>
            <TabsTrigger value="upload" data-testid="tab-upload">Upload New File</TabsTrigger>
            <TabsTrigger value="history" data-testid="tab-history">Import History</TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Step 1: Select Data Type & Source</CardTitle>
                <CardDescription>
                  Choose what type of data you're importing and from which system
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Data Type</label>
                    <Select
                      value={selectedDataType}
                      onValueChange={(value) => setSelectedDataType(value as ImportDataType)}
                    >
                      <SelectTrigger data-testid="select-data-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="properties">Properties</SelectItem>
                        <SelectItem value="units">Units</SelectItem>
                        <SelectItem value="tenants">Tenants</SelectItem>
                        <SelectItem value="leases">Leases</SelectItem>
                        <SelectItem value="vendors">Vendors</SelectItem>
                        <SelectItem value="maintenance_requests">Maintenance Requests</SelectItem>
                        <SelectItem value="transactions">Transactions</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Source System</label>
                    <Select
                      value={selectedSource}
                      onValueChange={(value) => setSelectedSource(value as ImportSource)}
                    >
                      <SelectTrigger data-testid="select-source">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="appfolio">AppFolio</SelectItem>
                        <SelectItem value="buildium">Buildium</SelectItem>
                        <SelectItem value="yardi">Yardi</SelectItem>
                        <SelectItem value="rentmanager">RentManager</SelectItem>
                        <SelectItem value="generic_csv">Generic CSV</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Step 2: Upload File</CardTitle>
                <CardDescription>
                  Upload your CSV or Excel file (max 10MB)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-12 text-center">
                  <FileSpreadsheet className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <input
                    type="file"
                    id="file-upload"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleFileUpload}
                    className="hidden"
                    data-testid="input-file-upload"
                  />
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <Button variant="outline" asChild disabled={uploadMutation.isPending}>
                      <span data-testid="button-upload">
                        <Upload className="mr-2 h-4 w-4" />
                        {uploadMutation.isPending ? 'Uploading...' : 'Choose File'}
                      </span>
                    </Button>
                  </label>
                  {uploadedFile && (
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                      Selected: {uploadedFile.name}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {preview && headers && autoMapping && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>Step 3: Review Field Mapping</CardTitle>
                    <CardDescription>
                      Auto-detected field mapping based on your source system
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="border rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Our Field</TableHead>
                            <TableHead>Mapped From</TableHead>
                            <TableHead>Sample Data</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {Object.entries(autoMapping).map(([ourField, sourceField]) => (
                            <TableRow key={ourField}>
                              <TableCell className="font-medium">{ourField}</TableCell>
                              <TableCell>{sourceField}</TableCell>
                              <TableCell className="text-sm text-gray-600">
                                {preview[0]?.[sourceField] || '-'}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Step 4: Preview Data (First 10 rows)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="border rounded-lg overflow-auto max-h-96">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            {headers.map(header => (
                              <TableHead key={header}>{header}</TableHead>
                            ))}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {preview.map((row, idx) => (
                            <TableRow key={idx}>
                              {headers.map(header => (
                                <TableCell key={header} className="text-sm">
                                  {row[header] || '-'}
                                </TableCell>
                              ))}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Step 5: Execute Import</CardTitle>
                    <CardDescription>
                      Run a dry run first to validate data, then execute the actual import
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {currentJob && (currentJob.status === 'importing' || currentJob.status === 'completed') && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Progress: {currentJob.processedRows} / {currentJob.totalRows}</span>
                          <span>{Math.round((currentJob.processedRows / currentJob.totalRows) * 100)}%</span>
                        </div>
                        <Progress 
                          value={(currentJob.processedRows / currentJob.totalRows) * 100} 
                          data-testid="progress-import"
                        />
                        <div className="flex justify-between text-sm text-gray-600">
                          <span className="text-green-600">✓ {currentJob.successfulRows} successful</span>
                          <span className="text-red-600">✗ {currentJob.failedRows} failed</span>
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button
                        onClick={() => currentJobId && executeMutation.mutate({ jobId: currentJobId, dryRun: true })}
                        disabled={!currentJobId || executeMutation.isPending}
                        variant="outline"
                        data-testid="button-dry-run"
                      >
                        {executeMutation.isPending ? 'Running...' : 'Dry Run'}
                      </Button>
                      <Button
                        onClick={() => currentJobId && executeMutation.mutate({ jobId: currentJobId, dryRun: false })}
                        disabled={!currentJobId || executeMutation.isPending}
                        data-testid="button-execute-import"
                      >
                        {executeMutation.isPending ? 'Importing...' : 'Execute Import'}
                      </Button>
                    </div>

                    {currentJob?.validationErrors && currentJob.validationErrors.length > 0 && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          {currentJob.validationErrors.length} validation errors found. 
                          First error: Row {currentJob.validationErrors[0].row} - {currentJob.validationErrors[0].error}
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            {jobsLoading ? (
              <div className="text-center py-12">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-gray-400" />
              </div>
            ) : importJobs.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-gray-500">
                  No import history yet. Upload a file to get started.
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>File Name</TableHead>
                        <TableHead>Data Type</TableHead>
                        <TableHead>Source</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Rows</TableHead>
                        <TableHead>Success/Failed</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {importJobs.map((job: ImportJob) => (
                        <TableRow key={job.id} data-testid={`row-job-${job.id}`}>
                          <TableCell className="font-medium">{job.fileName}</TableCell>
                          <TableCell>{job.dataType}</TableCell>
                          <TableCell className="capitalize">{job.source}</TableCell>
                          <TableCell>{getStatusBadge(job.status)}</TableCell>
                          <TableCell>{job.totalRows}</TableCell>
                          <TableCell>
                            <span className="text-green-600">{job.successfulRows}</span>
                            {' / '}
                            <span className="text-red-600">{job.failedRows}</span>
                          </TableCell>
                          <TableCell className="text-sm text-gray-600">
                            {new Date(job.createdAt).toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

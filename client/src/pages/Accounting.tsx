import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { PageTutorial } from "@/components/PageTutorial";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { DollarSign, TrendingUp, TrendingDown, Download, AlertCircle, ExternalLink, CheckCircle2, XCircle, Plus, Edit, BarChart3, FileText, Building2, Calculator } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertChartOfAccountsSchema, insertJournalEntrySchema, insertBankAccountSchema } from "@shared/schema";
import type { Transaction, Property, User, ChartOfAccounts, JournalEntry, BankAccount } from "@shared/schema";
import { z } from "zod";

export default function Accounting() {
  const { user } = useAuth();
  const [propertyFilter, setPropertyFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [selectedAccount, setSelectedAccount] = useState<ChartOfAccounts | null>(null);
  const [isAccountDialogOpen, setIsAccountDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("transactions");
  const { toast } = useToast();

  const { data: properties = [], isLoading: propertiesLoading, isError: propertiesError } = useQuery<Property[]>({
    queryKey: ["/api/properties"],
  });

  const { data: transactions = [], isLoading: transactionsLoading, isError: transactionsError } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions"],
  });

  const { data: chartOfAccounts = [], isLoading: coaLoading } = useQuery<ChartOfAccounts[]>({
    queryKey: ["/api/chart-of-accounts"],
  });

  const { data: journalEntries = [], isLoading: jeLoading } = useQuery<JournalEntry[]>({
    queryKey: ["/api/journal-entries"],
  });

  const { data: bankAccounts = [], isLoading: bankAccountsLoading } = useQuery<BankAccount[]>({
    queryKey: ["/api/bank-accounts"],
  });

  const { data: qbConnection, isLoading: qbLoading } = useQuery<{ connected: boolean; companyName?: string; lastSynced?: string }>({
    queryKey: ["/api/quickbooks/connection"],
  });

  const accountForm = useForm<z.infer<typeof insertChartOfAccountsSchema>>({
    resolver: zodResolver(insertChartOfAccountsSchema),
    defaultValues: {
      accountNumber: "",
      accountName: "",
      accountType: "asset",
      accountSubtype: "cash",
      balance: "0",
      isActive: true,
      description: "",
    },
  });

  const createAccountMutation = useMutation({
    mutationFn: async (data: z.infer<typeof insertChartOfAccountsSchema>) => {
      const res = await apiRequest("POST", "/api/chart-of-accounts", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chart-of-accounts"] });
      toast({
        title: "Account Created",
        description: "Chart of accounts entry created successfully",
      });
      setIsAccountDialogOpen(false);
      accountForm.reset();
    },
    onError: () => {
      toast({
        title: "Creation Failed",
        description: "Failed to create chart of accounts entry",
        variant: "destructive",
      });
    },
  });

  const updateAccountMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ChartOfAccounts> }) => {
      const res = await apiRequest("PATCH", `/api/chart-of-accounts/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chart-of-accounts"] });
      toast({
        title: "Account Updated",
        description: "Chart of accounts entry updated successfully",
      });
      setIsAccountDialogOpen(false);
      setSelectedAccount(null);
    },
    onError: () => {
      toast({
        title: "Update Failed",
        description: "Failed to update chart of accounts entry",
        variant: "destructive",
      });
    },
  });

  const connectQBMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/quickbooks/auth-url");
      const data = await res.json();
      window.location.href = data.url;
    },
    onError: () => {
      toast({
        title: "Connection Failed",
        description: "Failed to initiate QuickBooks connection",
        variant: "destructive",
      });
    },
  });

  const disconnectQBMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", "/api/quickbooks/connection");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quickbooks/connection"] });
      toast({
        title: "Disconnected",
        description: "QuickBooks has been disconnected",
      });
    },
    onError: () => {
      toast({
        title: "Disconnection Failed",
        description: "Failed to disconnect QuickBooks",
        variant: "destructive",
      });
    },
  });

  const syncQBMutation = useMutation({
    mutationFn: async () => {
      const categories = Array.from(new Set(transactions.map(t => t.category)));
      const accountMappings: Record<string, string> = {};
      categories.forEach(cat => {
        accountMappings[cat] = "1";
      });
      
      const res = await apiRequest("POST", "/api/quickbooks/sync", {
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        accountMappings,
      });
      return res.json();
    },
    onSuccess: (data: { success: number; failed: number; total: number }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/quickbooks/connection"] });
      toast({
        title: "Sync Complete",
        description: `Successfully synced ${data.success}/${data.total} transactions to QuickBooks`,
      });
    },
    onError: () => {
      toast({
        title: "Sync Failed",
        description: "Failed to sync transactions to QuickBooks",
        variant: "destructive",
      });
    },
  });

  if (propertiesLoading || transactionsLoading) {
    return (
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header title="Accounting" subtitle="Financial reports and accounting" user={user} />
          <main className="flex-1 overflow-y-auto p-6 bg-muted/30 flex items-center justify-center">
            <p className="text-muted-foreground" data-testid="text-loading">Loading accounting data...</p>
          </main>
        </div>
      </div>
    );
  }

  const filteredTransactions = transactions
    .filter((t) => {
      if (propertyFilter !== "all" && t.propertyId !== propertyFilter) return false;
      if (typeFilter !== "all" && t.type !== typeFilter) return false;
      if (categoryFilter !== "all" && t.category !== categoryFilter) return false;
      if (startDate && new Date(t.date) < new Date(startDate)) return false;
      if (endDate && new Date(t.date) > new Date(endDate)) return false;
      return true;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const income = filteredTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + parseFloat(t.amount), 0);
  
  const expenses = filteredTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + parseFloat(t.amount), 0);
  
  const noi = income - expenses;

  const categories = Array.from(new Set(transactions.map(t => t.category)));

  const handleExportCSV = () => {
    const headers = ["Date", "Type", "Category", "Description", "Amount", "Property ID"];
    const rows = filteredTransactions.map(t => [
      new Date(t.date).toLocaleDateString(),
      t.type,
      t.category,
      (t.description || '-').replace(/"/g, '""'),
      parseFloat(t.amount).toFixed(2),
      t.propertyId,
    ]);
    
    const csv = '\ufeff' + [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getTypeBadge = (type: string) => {
    return type === 'income' ? "bg-green-500" : "bg-red-500";
  };

  const handleEditAccount = (account: ChartOfAccounts) => {
    setSelectedAccount(account);
    accountForm.reset({
      accountNumber: account.accountNumber,
      accountName: account.accountName,
      accountType: account.accountType,
      accountSubtype: account.accountSubtype,
      balance: account.balance,
      isActive: account.isActive,
      description: account.description || "",
      parentAccountId: account.parentAccountId || undefined,
    });
    setIsAccountDialogOpen(true);
  };

  const onSubmitAccount = (data: z.infer<typeof insertChartOfAccountsSchema>) => {
    if (selectedAccount) {
      updateAccountMutation.mutate({ id: selectedAccount.id, data });
    } else {
      createAccountMutation.mutate(data);
    }
  };

  const totalAssets = chartOfAccounts
    .filter(a => a.accountType === 'asset' && a.isActive)
    .reduce((sum, a) => sum + parseFloat(a.balance), 0);

  const totalLiabilities = chartOfAccounts
    .filter(a => a.accountType === 'liability' && a.isActive)
    .reduce((sum, a) => sum + parseFloat(a.balance), 0);

  const totalEquity = chartOfAccounts
    .filter(a => a.accountType === 'equity' && a.isActive)
    .reduce((sum, a) => sum + parseFloat(a.balance), 0);

  return (
    <div className="flex h-screen overflow-hidden">
      <PageTutorial pagePath="/accounting" />
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Accounting" subtitle="Financial reports and accounting" user={user} />
        <main className="flex-1 overflow-y-auto p-6 bg-muted/30">
          <div className="max-w-7xl mx-auto space-y-6">
            
            <Card data-testid="card-quickbooks-integration">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle data-testid="heading-quickbooks">QuickBooks Integration</CardTitle>
                    <CardDescription>Connect your QuickBooks Online account for automated accounting sync</CardDescription>
                  </div>
                  {qbLoading ? (
                    <Badge variant="secondary" data-testid="badge-qb-loading">Loading...</Badge>
                  ) : qbConnection?.connected ? (
                    <Badge variant="default" className="bg-green-600" data-testid="badge-qb-connected">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Connected
                    </Badge>
                  ) : (
                    <Badge variant="secondary" data-testid="badge-qb-disconnected">
                      <XCircle className="h-3 w-3 mr-1" />
                      Not Connected
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {qbConnection?.connected ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                      <div>
                        <p className="text-sm font-medium" data-testid="text-qb-company">
                          {qbConnection.companyName || "QuickBooks Company"}
                        </p>
                        {qbConnection.lastSynced && (
                          <p className="text-xs text-muted-foreground" data-testid="text-qb-last-synced">
                            Last synced: {new Date(qbConnection.lastSynced).toLocaleString()}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => syncQBMutation.mutate()}
                          disabled={syncQBMutation.isPending || filteredTransactions.length === 0}
                          data-testid="button-sync-quickbooks"
                        >
                          {syncQBMutation.isPending ? "Syncing..." : "Sync Transactions"}
                        </Button>
                        <Button
                          onClick={() => disconnectQBMutation.mutate()}
                          variant="outline"
                          disabled={disconnectQBMutation.isPending}
                          data-testid="button-disconnect-quickbooks"
                        >
                          {disconnectQBMutation.isPending ? "Disconnecting..." : "Disconnect"}
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-sm text-muted-foreground mb-4" data-testid="text-qb-description">
                      Connect your QuickBooks Online account to automatically sync transactions and streamline your accounting workflow.
                    </p>
                    <Button
                      onClick={() => connectQBMutation.mutate()}
                      disabled={connectQBMutation.isPending}
                      data-testid="button-connect-quickbooks"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      {connectQBMutation.isPending ? "Connecting..." : "Connect QuickBooks"}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="transactions" data-testid="tab-transactions">
                  <FileText className="h-4 w-4 mr-2" />
                  Transactions
                </TabsTrigger>
                <TabsTrigger value="chart-of-accounts" data-testid="tab-chart-of-accounts">
                  <Building2 className="h-4 w-4 mr-2" />
                  Chart of Accounts
                </TabsTrigger>
                <TabsTrigger value="journal-entries" data-testid="tab-journal-entries">
                  <Edit className="h-4 w-4 mr-2" />
                  Journal Entries
                </TabsTrigger>
                <TabsTrigger value="financial-statements" data-testid="tab-financial-statements">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Financial Statements
                </TabsTrigger>
                <TabsTrigger value="bank-accounts" data-testid="tab-bank-accounts">
                  <Calculator className="h-4 w-4 mr-2" />
                  Bank Accounts
                </TabsTrigger>
              </TabsList>

              <TabsContent value="transactions" className="space-y-6">
                <div className="grid md:grid-cols-3 gap-6">
                  <Card data-testid="card-income">
                    <CardContent className="pt-6">
                      {transactionsError ? (
                        <div className="text-center py-4">
                          <AlertCircle className="h-8 w-8 mx-auto text-destructive mb-2" />
                          <p className="text-sm text-destructive" data-testid="text-income-error">Failed to load income</p>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground">Total Income</p>
                            <p className="text-3xl font-bold text-green-600" data-testid="text-total-income">
                              ${income.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </p>
                          </div>
                          <TrendingUp className="h-8 w-8 text-green-600" />
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card data-testid="card-expenses">
                    <CardContent className="pt-6">
                      {transactionsError ? (
                        <div className="text-center py-4">
                          <AlertCircle className="h-8 w-8 mx-auto text-destructive mb-2" />
                          <p className="text-sm text-destructive" data-testid="text-expenses-error">Failed to load expenses</p>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground">Total Expenses</p>
                            <p className="text-3xl font-bold text-red-600" data-testid="text-total-expenses">
                              ${expenses.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </p>
                          </div>
                          <TrendingDown className="h-8 w-8 text-red-600" />
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card data-testid="card-noi">
                    <CardContent className="pt-6">
                      {transactionsError ? (
                        <div className="text-center py-4">
                          <AlertCircle className="h-8 w-8 mx-auto text-destructive mb-2" />
                          <p className="text-sm text-destructive" data-testid="text-noi-error">Failed to load NOI</p>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground">Net Operating Income</p>
                            <p className={`text-3xl font-bold ${noi >= 0 ? 'text-green-600' : 'text-red-600'}`} data-testid="text-noi">
                              ${noi.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </p>
                          </div>
                          <DollarSign className="h-8 w-8 text-primary" />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle data-testid="heading-transactions">Transactions</CardTitle>
                        <CardDescription>Filter and export transaction records</CardDescription>
                      </div>
                      <Button 
                        onClick={handleExportCSV} 
                        variant="outline" 
                        data-testid="button-export-csv"
                        disabled={filteredTransactions.length === 0}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Export CSV
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
                      <Select value={propertyFilter} onValueChange={setPropertyFilter} disabled={propertiesError}>
                        <SelectTrigger data-testid="select-property-filter">
                          <SelectValue placeholder={propertiesError ? "Error loading properties" : "All Properties"} />
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

                      <Select value={typeFilter} onValueChange={setTypeFilter}>
                        <SelectTrigger data-testid="select-type-filter">
                          <SelectValue placeholder="All Types" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Types</SelectItem>
                          <SelectItem value="income">Income</SelectItem>
                          <SelectItem value="expense">Expense</SelectItem>
                        </SelectContent>
                      </Select>

                      <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                        <SelectTrigger data-testid="select-category-filter">
                          <SelectValue placeholder="All Categories" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Categories</SelectItem>
                          {categories.map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        placeholder="Start Date"
                        data-testid="input-start-date"
                      />

                      <Input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        placeholder="End Date"
                        data-testid="input-end-date"
                      />
                    </div>

                    {transactionsError ? (
                      <p className="text-destructive text-sm" data-testid="text-transactions-error">Failed to load transactions</p>
                    ) : filteredTransactions.length === 0 ? (
                      <p className="text-muted-foreground text-sm" data-testid="text-no-transactions">No transactions found</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Date</TableHead>
                              <TableHead>Type</TableHead>
                              <TableHead>Category</TableHead>
                              <TableHead>Description</TableHead>
                              <TableHead>Property</TableHead>
                              <TableHead className="text-right">Amount</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredTransactions.map((transaction) => {
                              const property = properties.find(p => p.id === transaction.propertyId);
                              return (
                                <TableRow key={transaction.id} data-testid={`transaction-row-${transaction.id}`}>
                                  <TableCell data-testid={`text-transaction-date-${transaction.id}`}>
                                    {new Date(transaction.date).toLocaleDateString()}
                                  </TableCell>
                                  <TableCell>
                                    <Badge className={getTypeBadge(transaction.type)} data-testid={`badge-transaction-type-${transaction.id}`}>
                                      {transaction.type}
                                    </Badge>
                                  </TableCell>
                                  <TableCell data-testid={`text-transaction-category-${transaction.id}`}>
                                    {transaction.category}
                                  </TableCell>
                                  <TableCell className="max-w-xs truncate" data-testid={`text-transaction-description-${transaction.id}`}>
                                    {transaction.description || '-'}
                                  </TableCell>
                                  <TableCell data-testid={`text-transaction-property-${transaction.id}`}>
                                    {property?.name || transaction.propertyId.substring(0, 8)}
                                  </TableCell>
                                  <TableCell className="text-right font-medium" data-testid={`text-transaction-amount-${transaction.id}`}>
                                    ${parseFloat(transaction.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="chart-of-accounts" className="space-y-6">
                <div className="grid md:grid-cols-3 gap-6">
                  <Card data-testid="card-total-assets">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Total Assets</p>
                          <p className="text-3xl font-bold text-green-600" data-testid="text-total-assets">
                            ${totalAssets.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                        <TrendingUp className="h-8 w-8 text-green-600" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card data-testid="card-total-liabilities">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Total Liabilities</p>
                          <p className="text-3xl font-bold text-red-600" data-testid="text-total-liabilities">
                            ${totalLiabilities.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                        <TrendingDown className="h-8 w-8 text-red-600" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card data-testid="card-total-equity">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Total Equity</p>
                          <p className="text-3xl font-bold text-blue-600" data-testid="text-total-equity">
                            ${totalEquity.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                        <DollarSign className="h-8 w-8 text-blue-600" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle data-testid="heading-chart-of-accounts">Chart of Accounts</CardTitle>
                        <CardDescription>Manage your accounting structure and account balances</CardDescription>
                      </div>
                      <Dialog open={isAccountDialogOpen} onOpenChange={setIsAccountDialogOpen}>
                        <DialogTrigger asChild>
                          <Button 
                            data-testid="button-add-account"
                            onClick={() => {
                              setSelectedAccount(null);
                              accountForm.reset();
                            }}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Account
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>{selectedAccount ? "Edit Account" : "Add New Account"}</DialogTitle>
                            <DialogDescription>
                              {selectedAccount ? "Update the account details below" : "Create a new account in your chart of accounts"}
                            </DialogDescription>
                          </DialogHeader>
                          <Form {...accountForm}>
                            <form onSubmit={accountForm.handleSubmit(onSubmitAccount)} className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <FormField
                                  control={accountForm.control}
                                  name="accountNumber"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Account Number</FormLabel>
                                      <FormControl>
                                        <Input {...field} data-testid="input-account-number" placeholder="1000" />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={accountForm.control}
                                  name="accountName"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Account Name</FormLabel>
                                      <FormControl>
                                        <Input {...field} data-testid="input-account-name" placeholder="Cash" />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </div>

                              <div className="grid grid-cols-2 gap-4">
                                <FormField
                                  control={accountForm.control}
                                  name="accountType"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Account Type</FormLabel>
                                      <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                          <SelectTrigger data-testid="select-account-type">
                                            <SelectValue placeholder="Select type" />
                                          </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                          <SelectItem value="asset">Asset</SelectItem>
                                          <SelectItem value="liability">Liability</SelectItem>
                                          <SelectItem value="equity">Equity</SelectItem>
                                          <SelectItem value="revenue">Revenue</SelectItem>
                                          <SelectItem value="expense">Expense</SelectItem>
                                        </SelectContent>
                                      </Select>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={accountForm.control}
                                  name="accountSubtype"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Account Subtype</FormLabel>
                                      <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                          <SelectTrigger data-testid="select-account-subtype">
                                            <SelectValue placeholder="Select subtype" />
                                          </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                          <SelectItem value="cash">Cash</SelectItem>
                                          <SelectItem value="accounts_receivable">Accounts Receivable</SelectItem>
                                          <SelectItem value="accounts_payable">Accounts Payable</SelectItem>
                                          <SelectItem value="fixed_asset">Fixed Asset</SelectItem>
                                          <SelectItem value="current_liability">Current Liability</SelectItem>
                                          <SelectItem value="long_term_liability">Long-term Liability</SelectItem>
                                          <SelectItem value="operating_income">Operating Income</SelectItem>
                                          <SelectItem value="operating_expense">Operating Expense</SelectItem>
                                          <SelectItem value="other_income">Other Income</SelectItem>
                                          <SelectItem value="other_expense">Other Expense</SelectItem>
                                          <SelectItem value="equity">Equity</SelectItem>
                                        </SelectContent>
                                      </Select>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </div>

                              <FormField
                                control={accountForm.control}
                                name="balance"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Initial Balance</FormLabel>
                                    <FormControl>
                                      <Input {...field} type="number" step="0.01" data-testid="input-account-balance" placeholder="0.00" />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={accountForm.control}
                                name="description"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Description (Optional)</FormLabel>
                                    <FormControl>
                                      <Input {...field} value={field.value || ""} data-testid="input-account-description" placeholder="Account description" />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <div className="flex justify-end gap-2 pt-4">
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={() => setIsAccountDialogOpen(false)}
                                  data-testid="button-cancel-account"
                                >
                                  Cancel
                                </Button>
                                <Button
                                  type="submit"
                                  disabled={createAccountMutation.isPending || updateAccountMutation.isPending}
                                  data-testid="button-submit-account"
                                >
                                  {createAccountMutation.isPending || updateAccountMutation.isPending
                                    ? "Saving..."
                                    : selectedAccount
                                    ? "Update Account"
                                    : "Create Account"}
                                </Button>
                              </div>
                            </form>
                          </Form>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {coaLoading ? (
                      <p className="text-muted-foreground text-sm" data-testid="text-coa-loading">Loading chart of accounts...</p>
                    ) : chartOfAccounts.length === 0 ? (
                      <p className="text-muted-foreground text-sm" data-testid="text-no-accounts">No accounts found. Click "Add Account" to create your first account.</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Account #</TableHead>
                              <TableHead>Account Name</TableHead>
                              <TableHead>Type</TableHead>
                              <TableHead>Subtype</TableHead>
                              <TableHead className="text-right">Balance</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead></TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {chartOfAccounts.map((account) => (
                              <TableRow key={account.id} data-testid={`account-row-${account.id}`}>
                                <TableCell className="font-medium" data-testid={`text-account-number-${account.id}`}>
                                  {account.accountNumber}
                                </TableCell>
                                <TableCell data-testid={`text-account-name-${account.id}`}>
                                  {account.accountName}
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline" data-testid={`badge-account-type-${account.id}`}>
                                    {account.accountType}
                                  </Badge>
                                </TableCell>
                                <TableCell data-testid={`text-account-subtype-${account.id}`}>
                                  {account.accountSubtype.replace(/_/g, ' ')}
                                </TableCell>
                                <TableCell className="text-right font-medium" data-testid={`text-account-balance-${account.id}`}>
                                  ${parseFloat(account.balance).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                </TableCell>
                                <TableCell>
                                  <Badge 
                                    variant={account.isActive ? "default" : "secondary"} 
                                    data-testid={`badge-account-status-${account.id}`}
                                  >
                                    {account.isActive ? "Active" : "Inactive"}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleEditAccount(account)}
                                    data-testid={`button-edit-account-${account.id}`}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="journal-entries" className="space-y-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>Journal Entries</CardTitle>
                      <CardDescription>Double-entry bookkeeping transactions</CardDescription>
                    </div>
                    <JournalEntryDialog
                      chartOfAccounts={chartOfAccounts}
                      properties={properties}
                      onSuccess={() => queryClient.invalidateQueries({ queryKey: ["/api/journal-entries"] })}
                    />
                  </CardHeader>
                  <CardContent>
                    {jeLoading ? (
                      <p className="text-muted-foreground text-sm">Loading journal entries...</p>
                    ) : journalEntries.length === 0 ? (
                      <p className="text-muted-foreground text-sm">No journal entries found. Create your first journal entry to track transactions.</p>
                    ) : (
                      <div className="space-y-4">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Entry #</TableHead>
                              <TableHead>Date</TableHead>
                              <TableHead>Description</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead className="text-right">Total Debit</TableHead>
                              <TableHead className="text-right">Total Credit</TableHead>
                              <TableHead>Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {journalEntries.map((entry) => (
                              <TableRow key={entry.id} data-testid={`row-journal-entry-${entry.id}`}>
                                <TableCell className="font-medium">{entry.entryNumber}</TableCell>
                                <TableCell>{new Date(entry.entryDate).toLocaleDateString()}</TableCell>
                                <TableCell>{entry.description}</TableCell>
                                <TableCell>
                                  <Badge 
                                    variant={entry.status === 'posted' ? 'default' : entry.status === 'voided' ? 'secondary' : 'outline'}
                                    data-testid={`badge-entry-status-${entry.id}`}
                                  >
                                    {entry.status}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                  ${parseFloat(entry.totalDebit).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                </TableCell>
                                <TableCell className="text-right">
                                  ${parseFloat(entry.totalCredit).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                </TableCell>
                                <TableCell>
                                  <div className="flex gap-2">
                                    {entry.status === 'draft' && (
                                      <PostJournalEntryButton entryId={entry.id} />
                                    )}
                                    {entry.status === 'posted' && (
                                      <VoidJournalEntryButton entryId={entry.id} />
                                    )}
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="financial-statements" className="space-y-6">
                <FinancialStatements
                  transactions={transactions}
                  chartOfAccounts={chartOfAccounts}
                  journalEntries={journalEntries}
                />
              </TabsContent>

              <TabsContent value="bank-accounts" className="space-y-6">
                <BankAccountsManager 
                  bankAccounts={bankAccounts} 
                  isLoading={bankAccountsLoading} 
                  chartOfAccounts={chartOfAccounts}
                />
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
}

function JournalEntryDialog({ chartOfAccounts, properties, onSuccess }: { chartOfAccounts: ChartOfAccounts[]; properties: Property[]; onSuccess: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [lineItems, setLineItems] = useState<Array<{ accountId: string; debitAmount: string; creditAmount: string; description: string }>>([
    { accountId: "", debitAmount: "0", creditAmount: "0", description: "" }
  ]);
  const { toast } = useToast();

  const [entryNumber, setEntryNumber] = useState("");
  const [entryDate, setEntryDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState("");
  const [propertyId, setPropertyId] = useState("");

  const totalDebit = lineItems.reduce((sum, item) => sum + parseFloat(item.debitAmount || "0"), 0);
  const totalCredit = lineItems.reduce((sum, item) => sum + parseFloat(item.creditAmount || "0"), 0);
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01;

  const createMutation = useMutation({
    mutationFn: async (data: { entry: any; lineItems: any[] }) => {
      const res = await apiRequest("POST", "/api/journal-entries", data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Journal Entry Created",
        description: "Journal entry has been created successfully",
      });
      setIsOpen(false);
      onSuccess();
      setEntryNumber("");
      setEntryDate(new Date().toISOString().split('T')[0]);
      setDescription("");
      setPropertyId("");
      setLineItems([{ accountId: "", debitAmount: "0", creditAmount: "0", description: "" }]);
    },
    onError: (error: any) => {
      toast({
        title: "Creation Failed",
        description: error.message || "Failed to create journal entry",
        variant: "destructive",
      });
    },
  });
  const handleAddLineItem = () => {
    setLineItems([...lineItems, { accountId: "", debitAmount: "0", creditAmount: "0", description: "" }]);
  };

  const handleRemoveLineItem = (index: number) => {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = () => {
    if (!entryNumber || !entryDate || !description) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    if (!isBalanced) {
      toast({
        title: "Entry Not Balanced",
        description: "Total debits must equal total credits",
        variant: "destructive",
      });
      return;
    }

    createMutation.mutate({
      entry: {
        entryNumber,
        entryDate,
        description,
        propertyId: propertyId || null,
      },
      lineItems: lineItems.map(item => ({
        accountId: item.accountId,
        debitAmount: parseFloat(item.debitAmount || "0").toFixed(2),
        creditAmount: parseFloat(item.creditAmount || "0").toFixed(2),
        description: item.description || null,
      })),
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button data-testid="button-create-journal-entry">
          <Plus className="h-4 w-4 mr-2" />
          New Journal Entry
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Journal Entry</DialogTitle>
          <DialogDescription>
            Create a new double-entry bookkeeping journal entry
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Entry Number *</label>
              <Input
                value={entryNumber}
                onChange={(e) => setEntryNumber(e.target.value)}
                placeholder="JE-001"
                data-testid="input-entry-number"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Entry Date *</label>
              <Input
                type="date"
                value={entryDate}
                onChange={(e) => setEntryDate(e.target.value)}
                data-testid="input-entry-date"
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Description *</label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter description"
              data-testid="input-entry-description"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Property (Optional)</label>
            <Select value={propertyId} onValueChange={setPropertyId}>
              <SelectTrigger data-testid="select-property">
                <SelectValue placeholder="Select property" />
              </SelectTrigger>
              <SelectContent>
                {properties.map((property) => (
                  <SelectItem key={property.id} value={property.id}>
                    {property.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Line Items</label>
              <Button
                type="button"
                size="sm"
                onClick={handleAddLineItem}
                data-testid="button-add-line-item"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Line
              </Button>
            </div>
            {lineItems.map((item, index) => (
              <Card key={index}>
                <CardContent className="pt-4">
                  <div className="grid grid-cols-12 gap-2 items-end">
                    <div className="col-span-4">
                      <label className="text-xs">Account</label>
                      <Select
                        value={item.accountId}
                        onValueChange={(value) => {
                          const newItems = [...lineItems];
                          newItems[index].accountId = value;
                          setLineItems(newItems);
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select account" />
                        </SelectTrigger>
                        <SelectContent>
                          {chartOfAccounts.map((account) => (
                            <SelectItem key={account.id} value={account.id}>
                              {account.accountNumber} - {account.accountName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-2">
                      <label className="text-xs">Debit</label>
                      <Input
                        type="number"
                        step="0.01"
                        value={item.debitAmount}
                        onChange={(e) => {
                          const newItems = [...lineItems];
                          newItems[index].debitAmount = e.target.value;
                          setLineItems(newItems);
                        }}
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="text-xs">Credit</label>
                      <Input
                        type="number"
                        step="0.01"
                        value={item.creditAmount}
                        onChange={(e) => {
                          const newItems = [...lineItems];
                          newItems[index].creditAmount = e.target.value;
                          setLineItems(newItems);
                        }}
                      />
                    </div>
                    <div className="col-span-3">
                      <label className="text-xs">Description</label>
                      <Input
                        value={item.description}
                        onChange={(e) => {
                          const newItems = [...lineItems];
                          newItems[index].description = e.target.value;
                          setLineItems(newItems);
                        }}
                        placeholder="Optional"
                      />
                    </div>
                    <div className="col-span-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveLineItem(index)}
                        disabled={lineItems.length === 1}
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex items-center justify-between p-4 bg-muted rounded-md">
            <div>
              <p className="text-sm font-medium">Total Debit: ${totalDebit.toFixed(2)}</p>
              <p className="text-sm font-medium">Total Credit: ${totalCredit.toFixed(2)}</p>
            </div>
            {isBalanced ? (
              <Badge variant="default">
                <CheckCircle2 className="h-4 w-4 mr-1" />
                Balanced
              </Badge>
            ) : (
              <Badge variant="destructive">
                <AlertCircle className="h-4 w-4 mr-1" />
                Not Balanced
              </Badge>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={createMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createMutation.isPending || !isBalanced}
              data-testid="button-submit-journal-entry"
            >
              {createMutation.isPending ? "Creating..." : "Create Entry"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function PostJournalEntryButton({ entryId }: { entryId: string }) {
  const { toast } = useToast();
  
  const postMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/journal-entries/${entryId}/post`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/journal-entries"] });
      toast({
        title: "Entry Posted",
        description: "Journal entry has been posted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Post Failed",
        description: "Failed to post journal entry",
        variant: "destructive",
      });
    },
  });

  return (
    <Button
      size="sm"
      onClick={() => postMutation.mutate()}
      disabled={postMutation.isPending}
      data-testid={`button-post-entry-${entryId}`}
    >
      {postMutation.isPending ? "Posting..." : "Post"}
    </Button>
  );
}

function VoidJournalEntryButton({ entryId }: { entryId: string }) {
  const { toast } = useToast();
  
  const voidMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/journal-entries/${entryId}/void`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/journal-entries"] });
      toast({
        title: "Entry Voided",
        description: "Journal entry has been voided successfully",
      });
    },
    onError: () => {
      toast({
        title: "Void Failed",
        description: "Failed to void journal entry",
        variant: "destructive",
      });
    },
  });

  return (
    <Button
      size="sm"
      variant="destructive"
      onClick={() => voidMutation.mutate()}
      disabled={voidMutation.isPending}
      data-testid={`button-void-entry-${entryId}`}
    >
      {voidMutation.isPending ? "Voiding..." : "Void"}
    </Button>
  );
}

function FinancialStatements({ transactions, chartOfAccounts, journalEntries }: { 
  transactions: Transaction[]; 
  chartOfAccounts: ChartOfAccounts[]; 
  journalEntries: JournalEntry[];
}) {
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [reportType, setReportType] = useState<'pl' | 'balance' | 'cashflow'>('pl');

  const income = transactions
    .filter(t => t.type === 'income' && (!dateRange.start || new Date(t.date) >= new Date(dateRange.start)) && (!dateRange.end || new Date(t.date) <= new Date(dateRange.end)))
    .reduce((sum, t) => sum + parseFloat(t.amount), 0);

  const expenses = transactions
    .filter(t => t.type === 'expense' && (!dateRange.start || new Date(t.date) >= new Date(dateRange.start)) && (!dateRange.end || new Date(t.date) <= new Date(dateRange.end)))
    .reduce((sum, t) => sum + parseFloat(t.amount), 0);

  const netIncome = income - expenses;

  const assetAccounts = chartOfAccounts.filter(a => a.accountType === 'asset');
  const liabilityAccounts = chartOfAccounts.filter(a => a.accountType === 'liability');
  const equityAccounts = chartOfAccounts.filter(a => a.accountType === 'equity');

  const totalAssets = assetAccounts.reduce((sum, a) => sum + parseFloat(a.balance), 0);
  const totalLiabilities = liabilityAccounts.reduce((sum, a) => sum + parseFloat(a.balance), 0);
  const totalEquity = equityAccounts.reduce((sum, a) => sum + parseFloat(a.balance), 0) + netIncome;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Financial Statements</CardTitle>
          <CardDescription>Profit & Loss, Balance Sheet, and Cash Flow reports</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium">Report Type</label>
              <Select value={reportType} onValueChange={(value: any) => setReportType(value)}>
                <SelectTrigger data-testid="select-report-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pl">Profit & Loss</SelectItem>
                  <SelectItem value="balance">Balance Sheet</SelectItem>
                  <SelectItem value="cashflow">Cash Flow</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Start Date</label>
              <Input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                data-testid="input-start-date"
              />
            </div>
            <div>
              <label className="text-sm font-medium">End Date</label>
              <Input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                data-testid="input-end-date"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {reportType === 'pl' && (
        <Card data-testid="card-profit-loss">
          <CardHeader>
            <CardTitle>Profit & Loss Statement</CardTitle>
            <CardDescription>
              {dateRange.start && dateRange.end ? `${new Date(dateRange.start).toLocaleDateString()} - ${new Date(dateRange.end).toLocaleDateString()}` : 'All Time'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="font-semibold text-lg">Revenue</span>
                  <span className="font-semibold text-lg text-green-600" data-testid="text-total-revenue">
                    ${income.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                {chartOfAccounts
                  .filter(a => a.accountType === 'revenue')
                  .map(account => (
                    <div key={account.id} className="flex justify-between items-center py-1 pl-4">
                      <span className="text-muted-foreground">{account.accountName}</span>
                      <span>${parseFloat(account.balance).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                    </div>
                  ))}
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="font-semibold text-lg">Expenses</span>
                  <span className="font-semibold text-lg text-red-600" data-testid="text-total-expenses">
                    ${expenses.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                {chartOfAccounts
                  .filter(a => a.accountType === 'expense')
                  .map(account => (
                    <div key={account.id} className="flex justify-between items-center py-1 pl-4">
                      <span className="text-muted-foreground">{account.accountName}</span>
                      <span>${parseFloat(account.balance).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                    </div>
                  ))}
              </div>

              <div className="flex justify-between items-center py-3 border-t-2 border-foreground">
                <span className="font-bold text-xl">Net Income</span>
                <span className={`font-bold text-xl ${netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`} data-testid="text-net-income">
                  ${netIncome.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {reportType === 'balance' && (
        <Card data-testid="card-balance-sheet">
          <CardHeader>
            <CardTitle>Balance Sheet</CardTitle>
            <CardDescription>
              As of {dateRange.end ? new Date(dateRange.end).toLocaleDateString() : new Date().toLocaleDateString()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="font-semibold text-lg">Assets</span>
                  <span className="font-semibold text-lg" data-testid="text-total-assets">
                    ${totalAssets.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                {assetAccounts.map(account => (
                  <div key={account.id} className="flex justify-between items-center py-1 pl-4">
                    <span className="text-muted-foreground">{account.accountName}</span>
                    <span>${parseFloat(account.balance).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="font-semibold text-lg">Liabilities</span>
                  <span className="font-semibold text-lg" data-testid="text-total-liabilities">
                    ${totalLiabilities.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                {liabilityAccounts.map(account => (
                  <div key={account.id} className="flex justify-between items-center py-1 pl-4">
                    <span className="text-muted-foreground">{account.accountName}</span>
                    <span>${parseFloat(account.balance).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="font-semibold text-lg">Equity</span>
                  <span className="font-semibold text-lg" data-testid="text-total-equity">
                    ${totalEquity.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                {equityAccounts.map(account => (
                  <div key={account.id} className="flex justify-between items-center py-1 pl-4">
                    <span className="text-muted-foreground">{account.accountName}</span>
                    <span>${parseFloat(account.balance).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                  </div>
                ))}
                <div className="flex justify-between items-center py-1 pl-4">
                  <span className="text-muted-foreground">Retained Earnings (Net Income)</span>
                  <span>${netIncome.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>

              <div className="flex justify-between items-center py-3 border-t-2 border-foreground">
                <span className="font-bold text-xl">Total Liabilities & Equity</span>
                <span className="font-bold text-xl" data-testid="text-total-liabilities-equity">
                  ${(totalLiabilities + totalEquity).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {reportType === 'cashflow' && (
        <Card data-testid="card-cash-flow">
          <CardHeader>
            <CardTitle>Cash Flow Statement</CardTitle>
            <CardDescription>
              {dateRange.start && dateRange.end ? `${new Date(dateRange.start).toLocaleDateString()} - ${new Date(dateRange.end).toLocaleDateString()}` : 'All Time'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="font-semibold text-lg">Operating Activities</span>
                </div>
                <div className="flex justify-between items-center py-1 pl-4">
                  <span className="text-muted-foreground">Net Income</span>
                  <span>${netIncome.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between items-center py-2 pl-4 border-t">
                  <span className="font-medium">Net Cash from Operating Activities</span>
                  <span className="font-medium" data-testid="text-operating-cash">
                    ${netIncome.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="font-semibold text-lg">Investing Activities</span>
                </div>
                <div className="flex justify-between items-center py-1 pl-4">
                  <span className="text-muted-foreground">Property & Equipment Purchases</span>
                  <span>$0.00</span>
                </div>
                <div className="flex justify-between items-center py-2 pl-4 border-t">
                  <span className="font-medium">Net Cash from Investing Activities</span>
                  <span className="font-medium" data-testid="text-investing-cash">$0.00</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="font-semibold text-lg">Financing Activities</span>
                </div>
                <div className="flex justify-between items-center py-1 pl-4">
                  <span className="text-muted-foreground">Loans & Borrowings</span>
                  <span>$0.00</span>
                </div>
                <div className="flex justify-between items-center py-2 pl-4 border-t">
                  <span className="font-medium">Net Cash from Financing Activities</span>
                  <span className="font-medium" data-testid="text-financing-cash">$0.00</span>
                </div>
              </div>

              <div className="flex justify-between items-center py-3 border-t-2 border-foreground">
                <span className="font-bold text-xl">Net Increase in Cash</span>
                <span className="font-bold text-xl" data-testid="text-net-cash-increase">
                  ${netIncome.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function BankAccountsManager({ bankAccounts, isLoading, chartOfAccounts }: { 
  bankAccounts: any[]; 
  isLoading: boolean; 
  chartOfAccounts: ChartOfAccounts[];
}) {
  const [isAddingAccount, setIsAddingAccount] = useState(false);
  const [accountName, setAccountName] = useState("");
  const [routingNumber, setRoutingNumber] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountType, setAccountType] = useState<'checking' | 'savings'>('checking');
  const [linkedChartAccountId, setLinkedChartAccountId] = useState("");
  const { toast } = useToast();

  const createAccountMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/bank-accounts", data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Bank Account Added",
        description: "Bank account has been added successfully",
      });
      setIsAddingAccount(false);
      setAccountName("");
      setRoutingNumber("");
      setAccountNumber("");
      setBankName("");
      setAccountType('checking');
      setLinkedChartAccountId("");
      queryClient.invalidateQueries({ queryKey: ["/api/bank-accounts"] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Add Account",
        description: error.message || "Failed to add bank account",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    if (!accountName || !bankName || !linkedChartAccountId) {
      toast({
        title: "Missing Fields",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    createAccountMutation.mutate({
      accountName,
      routingNumber,
      accountNumber: accountNumber.slice(-4),
      bankName,
      accountType,
      linkedChartAccountId,
      currentBalance: "0.00",
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground text-sm">Loading bank accounts...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Bank Accounts</CardTitle>
            <CardDescription>Connect and manage bank accounts for reconciliation</CardDescription>
          </div>
          <Button onClick={() => setIsAddingAccount(true)} data-testid="button-add-bank-account">
            <Plus className="h-4 w-4 mr-2" />
            Add Account
          </Button>
        </CardHeader>
        <CardContent>
          {bankAccounts.length === 0 ? (
            <div className="text-center py-8">
              <Calculator className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">No bank accounts connected yet.</p>
              <p className="text-sm text-muted-foreground mt-1">Add your first bank account to start reconciliation.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Account Name</TableHead>
                  <TableHead>Bank</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Account #</TableHead>
                  <TableHead>Linked GL Account</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bankAccounts.map((account: any) => {
                  const linkedAccount = chartOfAccounts.find(ca => ca.id === account.linkedChartAccountId);
                  return (
                    <TableRow key={account.id}>
                      <TableCell className="font-medium">{account.accountName}</TableCell>
                      <TableCell>{account.bankName}</TableCell>
                      <TableCell className="capitalize">{account.accountType}</TableCell>
                      <TableCell>****{account.accountNumber}</TableCell>
                      <TableCell>
                        {linkedAccount ? `${linkedAccount.accountNumber} - ${linkedAccount.accountName}` : 'Not linked'}
                      </TableCell>
                      <TableCell className="text-right">
                        ${parseFloat(account.currentBalance).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell>
                        <Badge variant="default">Active</Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isAddingAccount} onOpenChange={setIsAddingAccount}>
        <DialogContent className="max-w-2xl" data-testid="dialog-add-bank-account">
          <DialogHeader>
            <DialogTitle>Add Bank Account</DialogTitle>
            <DialogDescription>
              Connect a bank account for reconciliation and transaction tracking
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Account Name *</label>
                <Input
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  placeholder="Primary Checking"
                  data-testid="input-bank-account-name"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Bank Name *</label>
                <Input
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder="Chase Bank"
                  data-testid="input-bank-name"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Routing Number</label>
                <Input
                  value={routingNumber}
                  onChange={(e) => setRoutingNumber(e.target.value)}
                  placeholder="021000021"
                  maxLength={9}
                  data-testid="input-routing-number"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Account Number (Last 4)</label>
                <Input
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder="1234"
                  maxLength={4}
                  data-testid="input-account-number-last4"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Account Type *</label>
                <Select value={accountType} onValueChange={(value: any) => setAccountType(value)}>
                  <SelectTrigger data-testid="select-bank-account-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="checking">Checking</SelectItem>
                    <SelectItem value="savings">Savings</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Link to GL Account *</label>
                <Select value={linkedChartAccountId} onValueChange={setLinkedChartAccountId}>
                  <SelectTrigger data-testid="select-linked-account">
                    <SelectValue placeholder="Select account" />
                  </SelectTrigger>
                  <SelectContent>
                    {chartOfAccounts
                      .filter(a => a.accountType === 'asset')
                      .map(account => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.accountNumber} - {account.accountName}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong>Note:</strong> For security, we only store the last 4 digits of your account number. 
                Connect this account to a General Ledger account for proper tracking.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddingAccount(false)} data-testid="button-cancel-bank-account">
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={createAccountMutation.isPending}
              data-testid="button-save-bank-account"
            >
              {createAccountMutation.isPending ? "Adding..." : "Add Account"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

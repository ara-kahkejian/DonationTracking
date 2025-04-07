import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { VaultDonateForm } from "@/components/vault/vault-donate-form";
import { VaultDepositForm } from "@/components/vault/vault-deposit-form";
import { VaultWithdrawForm } from "@/components/vault/vault-withdraw-form";
import { BadgeDollarSign, ArrowDownToLine, ArrowUpFromLine, HandHeart } from "lucide-react";
import { VaultTransaction } from "@shared/schema";
import { formatDate, formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export default function VaultPage() {
  const { t } = useLanguage();
  const [isDonateModalOpen, setIsDonateModalOpen] = useState(false);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);

  // Fetch vault balance
  const { data: vaultData, isLoading: isBalanceLoading } = useQuery({
    queryKey: ['/api/vault/balance'],
  });

  // Fetch transactions
  const { data: transactions = [], isLoading: isTransactionsLoading } = useQuery({
    queryKey: ['/api/vault/transactions'],
  });

  // Get type badge variant and text
  const getTypeBadgeInfo = (type: string) => {
    switch (type) {
      case 'deposit':
        return { variant: 'default', label: t('deposit') };
      case 'withdraw':
        return { variant: 'destructive', label: t('withdraw') };
      case 'donation':
        return { variant: 'secondary', label: t('donation') };
      case 'surplus':
        return { variant: 'outline', label: t('surplus') };
      default:
        return { variant: 'outline', label: type };
    }
  };

  // Transaction table columns
  const columns = [
    {
      id: "id",
      accessorKey: "id",
      header: "ID",
      cell: (transaction: VaultTransaction) => transaction.id,
      enableSorting: true,
      enableFiltering: true,
    },
    {
      id: "transaction_date",
      accessorKey: "transaction_date",
      header: "date",
      cell: (transaction: VaultTransaction) => formatDate(transaction.transaction_date),
      enableSorting: true,
      enableFiltering: false,
    },
    {
      id: "type",
      accessorKey: "type",
      header: "type",
      cell: (transaction: VaultTransaction) => {
        const { variant, label } = getTypeBadgeInfo(transaction.type);
        return <Badge variant={variant as any}>{label}</Badge>;
      },
      enableSorting: true,
      enableFiltering: true,
    },
    {
      id: "description",
      accessorKey: "description",
      header: "description",
      cell: (transaction: VaultTransaction) => transaction.description || "-",
      enableSorting: false,
      enableFiltering: true,
    },
    {
      id: "amount",
      accessorKey: "amount",
      header: "amount",
      cell: (transaction: VaultTransaction) => {
        const isPositive = ['deposit', 'surplus'].includes(transaction.type);
        return (
          <span className={isPositive ? "text-green-600" : "text-red-600"}>
            {isPositive ? '+' : '-'}{formatCurrency(transaction.amount)}
          </span>
        );
      },
      enableSorting: true,
      enableFiltering: false,
    },
  ];

  const vaultBalance = vaultData?.balance || 0;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">{t("vault")}</h2>

      {/* Vault Balance Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="mb-4 md:mb-0 flex items-center">
              <BadgeDollarSign className="h-8 w-8 text-primary mr-3" />
              <div>
                <h3 className="text-lg text-muted-foreground">{t("vaultBalance")}</h3>
                <p className="text-4xl font-bold text-primary mt-1">
                  {isBalanceLoading ? (
                    <span className="animate-pulse">$--.--</span>
                  ) : (
                    formatCurrency(vaultBalance)
                  )}
                </p>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-3">
              <Button 
                onClick={() => setIsDonateModalOpen(true)}
                className="bg-primary text-primary-foreground"
              >
                <HandHeart className="h-4 w-4 mr-2" />
                {t("donate")}
              </Button>
              
              <Button 
                onClick={() => setIsDepositModalOpen(true)}
                className="bg-secondary text-secondary-foreground"
              >
                <ArrowDownToLine className="h-4 w-4 mr-2" />
                {t("deposit")}
              </Button>
              
              <Button 
                onClick={() => setIsWithdrawModalOpen(true)}
                variant="outline"
              >
                <ArrowUpFromLine className="h-4 w-4 mr-2" />
                {t("withdraw")}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transactions */}
      <h3 className="text-xl font-semibold mt-6">{t("transactions")}</h3>
      <DataTable
        columns={columns}
        data={transactions}
        searchable={true}
        searchPlaceholder={t("Search transactions...")}
        initialSortColumn="transaction_date"
        initialSortDirection="desc"
      />

      {/* Modals */}
      <VaultDonateForm
        open={isDonateModalOpen}
        onOpenChange={setIsDonateModalOpen}
        currentBalance={vaultBalance}
      />
      
      <VaultDepositForm
        open={isDepositModalOpen}
        onOpenChange={setIsDepositModalOpen}
      />
      
      <VaultWithdrawForm
        open={isWithdrawModalOpen}
        onOpenChange={setIsWithdrawModalOpen}
        currentBalance={vaultBalance}
      />
    </div>
  );
}

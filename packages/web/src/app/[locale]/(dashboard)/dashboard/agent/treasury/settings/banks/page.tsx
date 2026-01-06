/**
 * Bank Configurations Page
 * Manage bank API/webhook configurations for payment processing
 */

'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Loader2,
  AlertCircle,
  RefreshCw,
  Building2,
  Plus,
  Edit,
  CheckCircle,
  XCircle,
  Shield,
  Webhook,
} from 'lucide-react';
import {
  useBankConfigurations,
  useCreateBankConfiguration,
  useUpdateBankConfiguration,
} from '@/modules/treasury/hooks';
import type { BankConfiguration } from '@/modules/treasury/types';

export default function BankConfigurationsPage() {
  const t = useTranslations('treasury');

  // Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<BankConfiguration | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    bankCode: '',
    bankName: '',
    apiEndpoint: '',
    treasuryAccountNumber: '',
    isActive: true,
    supportsWebhooks: false,
    supportsDirectIntegration: false,
  });

  // Data fetching
  const { data: configurations, isLoading, error, refetch } = useBankConfigurations();

  // Mutations
  const createMutation = useCreateBankConfiguration();
  const updateMutation = useUpdateBankConfiguration();

  const isCreating = createMutation.isPending;
  const isUpdating = updateMutation.isPending;
  const isSaving = isCreating || isUpdating;

  const openCreateDialog = () => {
    setEditingConfig(null);
    setFormData({
      bankCode: '',
      bankName: '',
      apiEndpoint: '',
      treasuryAccountNumber: '',
      isActive: true,
      supportsWebhooks: false,
      supportsDirectIntegration: false,
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (config: BankConfiguration) => {
    setEditingConfig(config);
    setFormData({
      bankCode: String(config.bankCode),
      bankName: config.bankName,
      apiEndpoint: config.apiEndpoint || '',
      treasuryAccountNumber: config.treasuryAccountNumber || '',
      isActive: config.isActive,
      supportsWebhooks: config.supportsWebhooks,
      supportsDirectIntegration: config.supportsDirectIntegration,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (editingConfig) {
      await updateMutation.mutateAsync({
        configId: editingConfig.id,
        update: {
          bankName: formData.bankName,
          apiEndpoint: formData.apiEndpoint || undefined,
          treasuryAccountNumber: formData.treasuryAccountNumber,
          isActive: formData.isActive,
          supportsWebhooks: formData.supportsWebhooks,
          supportsDirectIntegration: formData.supportsDirectIntegration,
        },
      });
    } else {
      await createMutation.mutateAsync({
        bankCode: formData.bankCode as 'BANGE' | 'BGFI' | 'CCEIBANK' | 'SGBGE' | 'ECOBANK',
        bankName: formData.bankName,
        apiEndpoint: formData.apiEndpoint || undefined,
        treasuryAccountNumber: formData.treasuryAccountNumber,
        isActive: formData.isActive,
        supportsWebhooks: formData.supportsWebhooks,
        supportsDirectIntegration: formData.supportsDirectIntegration,
      });
    }
    setIsDialogOpen(false);
  };

  const isFormValid = formData.bankCode.trim() && formData.bankName.trim() && formData.treasuryAccountNumber.trim();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('settings.banks.title')}</h1>
          <p className="text-muted-foreground mt-1">
            {t('settings.banks.description')}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refetch()} disabled={isLoading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
          <Button onClick={openCreateDialog}>
            <Plus className="mr-2 h-4 w-4" />
            Agregar Banco
          </Button>
        </div>
      </div>

      {/* Info Card */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="flex items-start gap-3 py-4">
          <Shield className="h-5 w-5 text-blue-500 mt-0.5" />
          <div>
            <p className="font-medium text-blue-900">Configuracion Bancaria</p>
            <p className="text-sm text-blue-700">
              Configure las integraciones con bancos para recibir pagos via Mobile Money y webhooks.
              Los credenciales API se almacenan de forma segura en Google Secret Manager.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Error State */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="flex items-center gap-3 py-4">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <p className="text-red-700">Error al cargar las configuraciones</p>
          </CardContent>
        </Card>
      )}

      {/* Configurations Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Bancos Configurados
            {configurations && configurations.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {configurations.length}
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            Lista de bancos integrados con el sistema de pagos
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : !configurations || configurations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">Sin configuraciones</h3>
              <p className="text-muted-foreground mb-4">
                No hay bancos configurados. Agregue uno para comenzar.
              </p>
              <Button onClick={openCreateDialog}>
                <Plus className="mr-2 h-4 w-4" />
                Agregar Banco
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Codigo</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Cuenta Tesoreria</TableHead>
                    <TableHead>Webhooks</TableHead>
                    <TableHead>Integracion Directa</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {configurations.map((config: BankConfiguration) => (
                    <TableRow key={config.id}>
                      <TableCell className="font-mono font-bold">
                        {config.bankCode}
                      </TableCell>
                      <TableCell>{config.bankName}</TableCell>
                      <TableCell className="font-mono text-sm">
                        {config.treasuryAccountNumber || '-'}
                      </TableCell>
                      <TableCell>
                        {config.supportsWebhooks ? (
                          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                            <Webhook className="h-3 w-3 mr-1" />
                            Soportado
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {config.supportsDirectIntegration ? (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            Activo
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {config.isActive ? (
                          <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Activo
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            <XCircle className="h-3 w-3 mr-1" />
                            Inactivo
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(config)}
                            title="Editar"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
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

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              {editingConfig ? 'Editar Banco' : 'Agregar Banco'}
            </DialogTitle>
            <DialogDescription>
              {editingConfig
                ? 'Modifique la configuracion del banco.'
                : 'Configure un nuevo banco para integracion de pagos.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Bank Code */}
            <div className="space-y-2">
              <Label htmlFor="bankCode">Codigo del Banco *</Label>
              <Input
                id="bankCode"
                placeholder="Ej: BANGE"
                value={formData.bankCode}
                onChange={(e) => setFormData({ ...formData, bankCode: e.target.value.toUpperCase() })}
                disabled={!!editingConfig}
                className="font-mono"
              />
            </div>

            {/* Bank Name */}
            <div className="space-y-2">
              <Label htmlFor="bankName">Nombre del Banco *</Label>
              <Input
                id="bankName"
                placeholder="Ej: Banco Nacional de Guinea Ecuatorial"
                value={formData.bankName}
                onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
              />
            </div>

            {/* Treasury Account */}
            <div className="space-y-2">
              <Label htmlFor="treasuryAccountNumber">Cuenta de Tesoreria *</Label>
              <Input
                id="treasuryAccountNumber"
                placeholder="Ej: GE12345678901234"
                value={formData.treasuryAccountNumber}
                onChange={(e) => setFormData({ ...formData, treasuryAccountNumber: e.target.value })}
                className="font-mono"
              />
            </div>

            {/* API Endpoint */}
            <div className="space-y-2">
              <Label htmlFor="apiEndpoint">URL de API (opcional)</Label>
              <Input
                id="apiEndpoint"
                placeholder="https://api.bank.com/v1"
                value={formData.apiEndpoint}
                onChange={(e) => setFormData({ ...formData, apiEndpoint: e.target.value })}
              />
            </div>

            {/* Switches */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Banco Activo</Label>
                  <p className="text-xs text-muted-foreground">
                    Habilitar este banco para procesar pagos
                  </p>
                </div>
                <Switch
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Soporta Webhooks</Label>
                  <p className="text-xs text-muted-foreground">
                    Puede recibir notificaciones de pago via webhook
                  </p>
                </div>
                <Switch
                  checked={formData.supportsWebhooks}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, supportsWebhooks: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Integracion Directa</Label>
                  <p className="text-xs text-muted-foreground">
                    Puede iniciar pagos via API
                  </p>
                </div>
                <Switch
                  checked={formData.supportsDirectIntegration}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, supportsDirectIntegration: checked })
                  }
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              disabled={isSaving}
            >
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={isSaving || !isFormValid}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  {editingConfig ? 'Guardar Cambios' : 'Crear Banco'}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

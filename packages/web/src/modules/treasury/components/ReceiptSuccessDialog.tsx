/**
 * ReceiptSuccessDialog
 * Shown after an agent successfully validates a payment.
 * Displays receipt number and offers Download PDF / Print actions.
 */

'use client';

import { useTranslations } from 'next-intl';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle, Download, Printer } from 'lucide-react';

interface ReceiptSuccessDialogProps {
  open: boolean;
  onClose: () => void;
  receiptNumber: string;
  receiptUrl: string;
}

export function ReceiptSuccessDialog({
  open,
  onClose,
  receiptNumber,
  receiptUrl,
}: ReceiptSuccessDialogProps) {
  const t = useTranslations('treasury');

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = receiptUrl;
    link.download = `recibo_${receiptNumber}.pdf`;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.open(receiptUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            {t('receipt.successTitle')}
          </DialogTitle>
          <DialogDescription>
            {t('receipt.successDescription')}
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-center py-4">
          <div className="text-center space-y-1">
            <p className="text-xs text-muted-foreground">{t('receipt.receiptNumber')}</p>
            <p className="text-lg font-mono font-bold">{receiptNumber}</p>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={handleDownload} className="flex-1">
            <Download className="h-4 w-4 mr-2" />
            {t('receipt.download')}
          </Button>
          <Button variant="outline" onClick={handlePrint} className="flex-1">
            <Printer className="h-4 w-4 mr-2" />
            {t('receipt.print')}
          </Button>
          <Button onClick={onClose} className="flex-1">
            {t('receipt.continue')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

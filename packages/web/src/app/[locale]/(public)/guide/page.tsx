'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  FileText,
  HelpCircle,
  BookOpen,
  Download,
  CheckCircle2,
  ArrowRight,
  ExternalLink,
  ClipboardList,
  Calculator,
  Send,
  FileCheck,
  Scale,
  Gavel,
  Building2,
  Users,
} from 'lucide-react';
import Breadcrumb from '@/components/ui/breadcrumb';

type TabType = 'workflow' | 'legislation' | 'downloads' | 'faq';

// Declaration workflow steps
const WORKFLOW_STEPS = [
  { icon: ClipboardList, key: 'step1' },
  { icon: Calculator, key: 'step2' },
  { icon: FileText, key: 'step3' },
  { icon: Send, key: 'step4' },
  { icon: FileCheck, key: 'step5' },
];

// Legislation categories
const LEGISLATION_ITEMS = [
  { icon: Scale, key: 'taxCode' },
  { icon: Gavel, key: 'decrees' },
  { icon: Building2, key: 'procedures' },
  { icon: Users, key: 'obligations' },
];

// Downloadable forms
const DOWNLOAD_ITEMS = [
  { key: 'form100', category: 'irpf', format: 'PDF' },
  { key: 'form200', category: 'corporate', format: 'PDF' },
  { key: 'form300', category: 'vat', format: 'PDF' },
  { key: 'form400', category: 'withholding', format: 'PDF' },
  { key: 'formGeneral', category: 'general', format: 'PDF' },
];

// FAQ items
const FAQ_ITEMS = [
  { key: 'faq1' },
  { key: 'faq2' },
  { key: 'faq3' },
  { key: 'faq4' },
  { key: 'faq5' },
  { key: 'faq6' },
];

export default function GuidePage() {
  const params = useParams();
  const locale = (params?.locale as string) || 'es';
  const t = useTranslations('guidePage');

  const [activeTab, setActiveTab] = useState<TabType>('workflow');

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'irpf':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'corporate':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
      case 'vat':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
      case 'withholding':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <Breadcrumb
        items={[{ label: t('title') }]}
        className="mb-6"
      />

      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">{t('title')}</h1>
        <p className="text-lg text-muted-foreground">{t('description')}</p>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabType)} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 lg:w-[600px]">
          <TabsTrigger value="workflow" className="gap-2">
            <ClipboardList className="h-4 w-4" />
            <span className="hidden sm:inline">{t('workflowTab')}</span>
            <span className="sm:hidden">{t('workflowTabShort')}</span>
          </TabsTrigger>
          <TabsTrigger value="legislation" className="gap-2">
            <Scale className="h-4 w-4" />
            <span className="hidden sm:inline">{t('legislationTab')}</span>
            <span className="sm:hidden">{t('legislationTabShort')}</span>
          </TabsTrigger>
          <TabsTrigger value="downloads" className="gap-2">
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">{t('downloadsTab')}</span>
            <span className="sm:hidden">{t('downloadsTabShort')}</span>
          </TabsTrigger>
          <TabsTrigger value="faq" className="gap-2">
            <HelpCircle className="h-4 w-4" />
            <span>FAQ</span>
          </TabsTrigger>
        </TabsList>

        {/* WORKFLOW TAB */}
        <TabsContent value="workflow">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-primary" />
                {t('howToDeclaration')}
              </CardTitle>
              <CardDescription>{t('howToDeclarationDesc')}</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Workflow Steps */}
              <div className="space-y-6">
                {WORKFLOW_STEPS.map((step, index) => {
                  const Icon = step.icon;
                  const isLast = index === WORKFLOW_STEPS.length - 1;

                  return (
                    <div key={step.key} className="relative">
                      <div className="flex items-start gap-4">
                        {/* Step number and connector */}
                        <div className="flex flex-col items-center">
                          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary text-primary-foreground font-bold text-lg">
                            {index + 1}
                          </div>
                          {!isLast && (
                            <div className="w-0.5 h-16 bg-primary/30 mt-2" />
                          )}
                        </div>

                        {/* Step content */}
                        <div className="flex-1 pb-8">
                          <div className="flex items-center gap-3 mb-2">
                            <Icon className="h-5 w-5 text-primary" />
                            <h3 className="text-lg font-semibold">{t(`${step.key}Title`)}</h3>
                          </div>
                          <p className="text-muted-foreground mb-3">{t(`${step.key}Desc`)}</p>
                          <div className="bg-muted/50 p-4 rounded-lg">
                            <p className="text-sm font-medium mb-2">{t('tips')}:</p>
                            <ul className="text-sm text-muted-foreground space-y-1">
                              <li className="flex items-start gap-2">
                                <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                                <span>{t(`${step.key}Tip1`)}</span>
                              </li>
                              <li className="flex items-start gap-2">
                                <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                                <span>{t(`${step.key}Tip2`)}</span>
                              </li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* LEGISLATION TAB */}
        <TabsContent value="legislation">
          <div className="grid gap-6 md:grid-cols-2">
            {LEGISLATION_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <Card key={item.key} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start gap-4">
                      <div className="p-3 rounded-lg bg-primary/10">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-lg">{t(`${item.key}Title`)}</CardTitle>
                        <CardDescription className="mt-1">{t(`${item.key}Desc`)}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {/* Legislation links */}
                      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
                        <div className="flex items-center gap-2">
                          <BookOpen className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{t(`${item.key}Link1`)}</span>
                        </div>
                        <ExternalLink className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
                        <div className="flex items-center gap-2">
                          <BookOpen className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{t(`${item.key}Link2`)}</span>
                        </div>
                        <ExternalLink className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-4 italic">
                      {t('legislationNote')}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* DOWNLOADS TAB */}
        <TabsContent value="downloads">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5 text-primary" />
                {t('downloadableFormsTitle')}
              </CardTitle>
              <CardDescription>{t('downloadableFormsDesc')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {DOWNLOAD_ITEMS.map((item) => (
                  <div
                    key={item.key}
                    className="flex items-center justify-between p-4 border rounded-lg hover:border-primary/50 hover:bg-muted/30 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="h-8 w-8 text-red-500" />
                      <div>
                        <p className="font-medium">{t(`${item.key}Name`)}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className={getCategoryColor(item.category)}>
                            {t(`category${item.category.charAt(0).toUpperCase() + item.category.slice(1)}`)}
                          </Badge>
                          <span className="text-xs text-muted-foreground">{item.format}</span>
                        </div>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" disabled>
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              <Separator className="my-6" />

              <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-lg">
                <p className="text-sm text-amber-700 dark:text-amber-400 text-center">
                  {t('downloadsComingSoon')}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* FAQ TAB */}
        <TabsContent value="faq">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-primary" />
                {t('faq')}
              </CardTitle>
              <CardDescription>{t('faqDesc')}</CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {FAQ_ITEMS.map((item, index) => (
                  <AccordionItem key={item.key} value={item.key}>
                    <AccordionTrigger className="text-left">
                      <span className="flex items-center gap-3">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-sm flex items-center justify-center">
                          {index + 1}
                        </span>
                        {t(`${item.key}Question`)}
                      </span>
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground pl-9">
                      {t(`${item.key}Answer`)}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Help CTA */}
      <div className="mt-8 p-6 bg-primary/5 border border-primary/10 rounded-lg text-center">
        <h3 className="text-lg font-semibold mb-2">{t('needMoreHelp')}</h3>
        <p className="text-muted-foreground mb-4">{t('needMoreHelpDesc')}</p>
        <Button
          onClick={() => window.dispatchEvent(new CustomEvent('openChatbot'))}
          className="gap-2"
        >
          <HelpCircle className="h-4 w-4" />
          {t('askAssistant')}
        </Button>
      </div>
    </div>
  );
}

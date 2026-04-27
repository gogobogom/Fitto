'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Download, Mail, FileText, Table } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useLanguage } from '@/contexts/LanguageContext'

type ExportFormat = 'csv' | 'json' | 'pdf'
type ExportType = 'meals' | 'weight' | 'nutrition' | 'all'

export function DataExport() {
  const { language } = useLanguage()
  const [format, setFormat] = useState<ExportFormat>('csv')
  const [exportType, setExportType] = useState<ExportType>('all')
  const [isExporting, setIsExporting] = useState<boolean>(false)
  const { toast } = useToast()

  const exportData = async (): Promise<void> => {
    setIsExporting(true)

    try {
      // Simulate export process
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Collect data from localStorage
      const data: Record<string, unknown> = {}
      
      if (exportType === 'all' || exportType === 'meals') {
        data.meals = JSON.parse(localStorage.getItem('meals') || '[]')
        data.mealHistory = JSON.parse(localStorage.getItem('mealHistory') || '[]')
      }
      
      if (exportType === 'all' || exportType === 'weight') {
        data.weightHistory = JSON.parse(localStorage.getItem('weightHistory') || '[]')
      }
      
      if (exportType === 'all' || exportType === 'nutrition') {
        data.dailyNutrition = JSON.parse(localStorage.getItem('dailyNutrition') || '{}')
        data.detailedNutrition = JSON.parse(localStorage.getItem('detailedNutrition') || '{}')
      }

      // Create download based on format
      let blob: Blob
      let filename: string

      if (format === 'json') {
        blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
        filename = `health-data-${new Date().toISOString().split('T')[0]}.json`
      } else if (format === 'csv') {
        // Simple CSV conversion
        const csv = convertToCSV(data)
        blob = new Blob([csv], { type: 'text/csv' })
        filename = `health-data-${new Date().toISOString().split('T')[0]}.csv`
      } else {
        // PDF would require a library, for now just text
        const text = JSON.stringify(data, null, 2)
        blob = new Blob([text], { type: 'text/plain' })
        filename = `health-data-${new Date().toISOString().split('T')[0]}.txt`
      }

      // Download file
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast({
        title: 'Dışa aktarma başarılı!',
        description: `Verileriniz ${filename} olarak indirildi.`,
      })
    } catch (error) {
      toast({
        title: 'Hata',
        description: 'Dışa aktarma sırasında bir hata oluştu.',
        variant: 'destructive',
      })
    } finally {
      setIsExporting(false)
    }
  }

  const convertToCSV = (data: Record<string, unknown>): string => {
    let csv = 'Type,Data,Date\n'
    
    Object.entries(data).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach((item: unknown) => {
          csv += `${key},"${JSON.stringify(item)}","${new Date().toISOString()}"\n`
        })
      } else {
        csv += `${key},"${JSON.stringify(value)}","${new Date().toISOString()}"\n`
      }
    })
    
    return csv
  }

  const sendEmail = (): void => {
    toast({
      title: 'E-posta gönderiliyor...',
      description: 'Raporunuz e-posta adresinize gönderilecek.',
    })
    // In real app, would call API to send email
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="h-5 w-5" />
          Veri Dışa Aktarma
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Export Type Selection */}
        <div className="space-y-2">
          <Label>Veri Tipi</Label>
          <Select value={exportType} onValueChange={(value: string) => setExportType(value as ExportType)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Veriler</SelectItem>
              <SelectItem value="meals">Sadece Öğünler</SelectItem>
              <SelectItem value="weight">Sadece Kilo Geçmişi</SelectItem>
              <SelectItem value="nutrition">Sadece Besin Değerleri</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Format Selection */}
        <div className="space-y-2">
          <Label>Dosya Formatı</Label>
          <Select value={format} onValueChange={(value: string) => setFormat(value as ExportFormat)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="csv">
                <div className="flex items-center gap-2">
                  <Table className="h-4 w-4" />
                  CSV (Excel)
                </div>
              </SelectItem>
              <SelectItem value="json">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  JSON
                </div>
              </SelectItem>
              <SelectItem value="pdf">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  PDF/Text
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Export Buttons */}
        <div className="space-y-3">
          <Button onClick={exportData} disabled={isExporting} className="w-full">
            <Download className="h-4 w-4 mr-2" />
            {isExporting ? 'Dışa aktarılıyor...' : 'Dışa Aktar'}
          </Button>

          <Button onClick={sendEmail} variant="outline" className="w-full">
            <Mail className="h-4 w-4 mr-2" />
            E-posta ile Gönder
          </Button>
        </div>

        {/* Info */}
        <div className="p-4 bg-muted rounded-lg space-y-2">
          <h4 className="font-semibold text-sm">📋 Dışa Aktarılacak Veriler:</h4>
          <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
            {(exportType === 'all' || exportType === 'meals') && (
              <li>Öğün kayıtları ve yemek geçmişi</li>
            )}
            {(exportType === 'all' || exportType === 'weight') && (
              <li>Kilo ölçümleri ve değişim trendleri</li>
            )}
            {(exportType === 'all' || exportType === 'nutrition') && (
              <li>{language === 'tr' ? 'Günlük ve detaylı besin değerleri' : 'Daily and detailed nutrition values'}</li>
            )}
          </ul>
        </div>

        {/* GDPR Note */}
        <div className="p-4 border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-950">
          <p className="text-sm text-blue-900 dark:text-blue-100">
            <strong>🔒 Gizlilik:</strong> Verileriniz sadece cihazınızda saklanır ve dışa aktarma 
            işlemi tamamen yerel olarak gerçekleşir. Hiçbir veri sunuculara gönderilmez.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

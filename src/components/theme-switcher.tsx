'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Moon, Sun, Monitor } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'

type Theme = 'light' | 'dark' | 'system'

export function ThemeSwitcher() {
  const { language } = useLanguage();
  const [theme, setTheme] = useState<Theme>('light')

  useEffect(() => {
    const saved = localStorage.getItem('theme') as Theme
    if (saved) {
      setTheme(saved)
      applyTheme(saved)
    } else {
      // Check system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      setTheme('system')
      applyTheme(prefersDark ? 'dark' : 'light')
    }
  }, [])

  const applyTheme = (newTheme: Theme): void => {
    const root = document.documentElement
    
    if (newTheme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      if (prefersDark) {
        root.classList.add('dark')
      } else {
        root.classList.remove('dark')
      }
    } else if (newTheme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }

  const changeTheme = (newTheme: Theme): void => {
    setTheme(newTheme)
    localStorage.setItem('theme', newTheme)
    applyTheme(newTheme)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{language === 'tr' ? 'Tema Ayarları' : 'Theme Settings'}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <Button
            variant={theme === 'light' ? 'default' : 'outline'}
            className="flex flex-col items-center gap-2 h-auto py-4"
            onClick={() => changeTheme('light')}
          >
            <Sun className="h-6 w-6" />
            <span className="text-sm">{language === 'tr' ? 'Açık' : 'Light'}</span>
          </Button>
          
          <Button
            variant={theme === 'dark' ? 'default' : 'outline'}
            className="flex flex-col items-center gap-2 h-auto py-4"
            onClick={() => changeTheme('dark')}
          >
            <Moon className="h-6 w-6" />
            <span className="text-sm">{language === 'tr' ? 'Koyu' : 'Dark'}</span>
          </Button>
          
          <Button
            variant={theme === 'system' ? 'default' : 'outline'}
            className="flex flex-col items-center gap-2 h-auto py-4"
            onClick={() => changeTheme('system')}
          >
            <Monitor className="h-6 w-6" />
            <span className="text-sm">{language === 'tr' ? 'Sistem' : 'System'}</span>
          </Button>
        </div>

        <div className="p-4 bg-muted rounded-lg space-y-2">
          <h4 className="font-semibold text-sm">{language === 'tr' ? 'Tema Özellikleri:' : 'Theme Features:'}</h4>
          <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
            {language === 'tr' ? (
              <>
                <li><strong>Açık:</strong> Klasik beyaz arka plan, göz yormayan</li>
                <li><strong>Koyu:</strong> Gece kullanımı için ideal, pil dostu</li>
                <li><strong>Sistem:</strong> Cihazınızın tema ayarını takip eder</li>
              </>
            ) : (
              <>
                <li><strong>Light:</strong> Classic white background, easy on the eyes</li>
                <li><strong>Dark:</strong> Ideal for night use, battery friendly</li>
                <li><strong>System:</strong> Follows your device's theme setting</li>
              </>
            )}
          </ul>
        </div>

        {/* Theme Preview */}
        <div className="border rounded-lg overflow-hidden">
          <div className="p-4 bg-background">
            <div className="space-y-3">
              <div className="h-4 w-3/4 bg-foreground/10 rounded" />
              <div className="h-4 w-1/2 bg-foreground/10 rounded" />
              <div className="flex gap-2">
                <div className="h-8 w-20 bg-primary text-primary-foreground rounded flex items-center justify-center text-xs">
                  Primary
                </div>
                <div className="h-8 w-20 bg-secondary text-secondary-foreground rounded flex items-center justify-center text-xs">
                  Secondary
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

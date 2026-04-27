'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Clock, Play, Pause, RotateCcw, Flame } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'

interface FastingProtocol {
  name: string
  fasting: number
  eating: number
  description: string
}

const getProtocols = (language: string): FastingProtocol[] => [
  { name: '16:8', fasting: 16, eating: 8, description: language === 'tr' ? 'En popüler metod - 16 saat oruç, 8 saat yemek' : 'Most popular method - 16 hours fasting, 8 hours eating' },
  { name: '18:6', fasting: 18, eating: 6, description: language === 'tr' ? 'Orta seviye - 18 saat oruç, 6 saat yemek' : 'Intermediate level - 18 hours fasting, 6 hours eating' },
  { name: '20:4', fasting: 20, eating: 4, description: language === 'tr' ? 'İleri seviye - 20 saat oruç, 4 saat yemek' : 'Advanced level - 20 hours fasting, 4 hours eating' },
  { name: '14:10', fasting: 14, eating: 10, description: language === 'tr' ? 'Başlangıç - 14 saat oruç, 10 saat yemek' : 'Beginner - 14 hours fasting, 10 hours eating' },
  { name: '12:12', fasting: 12, eating: 12, description: language === 'tr' ? 'Hafif - 12 saat oruç, 12 saat yemek' : 'Light - 12 hours fasting, 12 hours eating' },
]

export function IntermittentFasting() {
  const { language } = useLanguage();
  const protocols = getProtocols(language);
  const [selectedProtocol, setSelectedProtocol] = useState<FastingProtocol>(protocols[0])
  const [isRunning, setIsRunning] = useState<boolean>(false)
  const [isFasting, setIsFasting] = useState<boolean>(true)
  const [timeRemaining, setTimeRemaining] = useState<number>(0)
  const [startTime, setStartTime] = useState<Date | null>(null)

  useEffect(() => {
    const saved = localStorage.getItem('fastingState')
    if (saved) {
      const state = JSON.parse(saved)
      const prots = getProtocols(language);
      setSelectedProtocol(prots.find((p: FastingProtocol) => p.name === state.protocol) || prots[0])
      setIsRunning(state.isRunning)
      setIsFasting(state.isFasting)
      setStartTime(state.startTime ? new Date(state.startTime) : null)
    }
  }, [])

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    if (isRunning && startTime) {
      interval = setInterval(() => {
        const now = new Date().getTime()
        const start = new Date(startTime).getTime()
        const elapsed = Math.floor((now - start) / 1000 / 60) // minutes
        
        const targetMinutes = isFasting ? selectedProtocol.fasting * 60 : selectedProtocol.eating * 60
        const remaining = targetMinutes - elapsed

        if (remaining <= 0) {
          // Switch phase
          setIsFasting(!isFasting)
          setStartTime(new Date())
          setTimeRemaining(isFasting ? selectedProtocol.eating * 60 : selectedProtocol.fasting * 60)
        } else {
          setTimeRemaining(remaining)
        }
      }, 1000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isRunning, startTime, isFasting, selectedProtocol])

  useEffect(() => {
    localStorage.setItem('fastingState', JSON.stringify({
      protocol: selectedProtocol.name,
      isRunning,
      isFasting,
      startTime: startTime?.toISOString(),
    }))
  }, [selectedProtocol, isRunning, isFasting, startTime])

  const handleStart = (): void => {
    setIsRunning(true)
    setStartTime(new Date())
    setTimeRemaining(isFasting ? selectedProtocol.fasting * 60 : selectedProtocol.eating * 60)
  }

  const handlePause = (): void => {
    setIsRunning(false)
  }

  const handleReset = (): void => {
    setIsRunning(false)
    setIsFasting(true)
    setStartTime(null)
    setTimeRemaining(0)
  }

  const formatTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
  }

  const progress = (): number => {
    const totalMinutes = isFasting ? selectedProtocol.fasting * 60 : selectedProtocol.eating * 60
    return ((totalMinutes - timeRemaining) / totalMinutes) * 100
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          {language === 'tr' ? 'Aralıklı Oruç' : 'Intermittent Fasting'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Protocol Selection */}
        <div className="space-y-2">
          <Label>{language === 'tr' ? 'Oruç Protokolü' : 'Fasting Protocol'}</Label>
          <Select
            value={selectedProtocol.name}
            onValueChange={(value: string) => {
              const prots = getProtocols(language);
              const protocol = prots.find((p: FastingProtocol) => p.name === value)
              if (protocol) {
                setSelectedProtocol(protocol)
                if (!isRunning) {
                  setTimeRemaining(protocol.fasting * 60)
                }
              }
            }}
            disabled={isRunning}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {protocols.map((protocol: FastingProtocol) => (
                <SelectItem key={protocol.name} value={protocol.name}>
                  <div className="flex flex-col">
                    <span className="font-semibold">{protocol.name}</span>
                    <span className="text-xs text-muted-foreground">{protocol.description}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Timer Display */}
        <div className="flex flex-col items-center justify-center py-8 space-y-4">
          <div className="relative w-48 h-48">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="96"
                cy="96"
                r="88"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                className="text-gray-200"
              />
              <circle
                cx="96"
                cy="96"
                r="88"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                strokeDasharray={`${2 * Math.PI * 88}`}
                strokeDashoffset={`${2 * Math.PI * 88 * (1 - progress() / 100)}`}
                className={isFasting ? 'text-blue-500' : 'text-green-500'}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-bold">{formatTime(timeRemaining)}</span>
              <span className="text-sm text-muted-foreground">
                {isFasting ? (language === 'tr' ? 'Oruç Süresi' : 'Fasting Time') : (language === 'tr' ? 'Yemek Süresi' : 'Eating Time')}
              </span>
            </div>
          </div>

          {/* Status Badge */}
          <div className={`px-4 py-2 rounded-full ${isFasting ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
            <div className="flex items-center gap-2">
              {isFasting ? <Flame className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
              <span className="font-semibold">
                {isFasting ? (language === 'tr' ? 'Oruç Tutuluyor' : 'Fasting') : (language === 'tr' ? 'Yemek Zamanı' : 'Eating Time')}
              </span>
            </div>
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex gap-2">
          {!isRunning ? (
            <Button onClick={handleStart} className="flex-1">
              <Play className="h-4 w-4 mr-2" />
              {language === 'tr' ? 'Başlat' : 'Start'}
            </Button>
          ) : (
            <Button onClick={handlePause} variant="secondary" className="flex-1">
              <Pause className="h-4 w-4 mr-2" />
              {language === 'tr' ? 'Duraklat' : 'Pause'}
            </Button>
          )}
          <Button onClick={handleReset} variant="outline">
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>

        {/* Protocol Info */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{selectedProtocol.fasting}h</div>
            <div className="text-sm text-muted-foreground">{language === 'tr' ? 'Oruç' : 'Fasting'}</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{selectedProtocol.eating}h</div>
            <div className="text-sm text-muted-foreground">{language === 'tr' ? 'Yemek' : 'Eating'}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

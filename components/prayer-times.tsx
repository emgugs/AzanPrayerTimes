import { useEffect, useState, useCallback, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ClockIcon, SunIcon, MoonIcon, VolumeIcon, Volume2Icon } from 'lucide-react'

interface PrayerTimings {
  Fajr: string
  Sunrise: string
  Dhuhr: string
  Asr: string
  Sunset: string
  Maghrib: string
  Isha: string
}

interface DateInfo {
  readable: string
  timestamp: string
  hijri: {
    date: string
    month: {
      en: string
    }
    year: string
  }
  gregorian: {
    date: string
    month: {
      en: string
    }
    year: string
  }
}

interface DelayTimes {
  [key: string]: number
}

const AZAN_AUDIO_URL = 'https://www.islamcan.com/audio/adhan/azan1.mp3'

export function PrayerTimes() {
  const [prayerTimes, setPrayerTimes] = useState<PrayerTimings | null>(null)
  const [dateInfo, setDateInfo] = useState<DateInfo | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [lastSyncTimestamp, setLastSyncTimestamp] = useState<number | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [delayTimes, setDelayTimes] = useState<DelayTimes>({
    Fajr: 0,
    Dhuhr: 0,
    Asr: 0,
    Maghrib: 0,
    Isha: 0
  })
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const fetchPrayerTimes = useCallback(async () => {
    try {
      const response = await fetch('https://api.aladhan.com/v1/timingsByCity?city=Karachi&country=Pakistan&method=1')
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      if (data.code !== 200 || data.status !== "OK") {
        throw new Error(`API error: ${data.data}`)
      }
      setPrayerTimes(data.data.timings)
      setDateInfo(data.data.date)
      setLastSyncTimestamp(Date.now())
    } catch (err) {
      if (err instanceof Error) {
        setError(`Failed to load prayer times: ${err.message}`)
        console.error('Error fetching prayer times:', err.message)
      } else {
        setError('An unexpected error occurred')
        console.error('Unexpected error:', err)
      }
    }
  }, [])

  useEffect(() => {
    const syncData = () => {
      const currentTime = Date.now()
      if (!lastSyncTimestamp || currentTime - lastSyncTimestamp > 10 * 24 * 60 * 60 * 1000) {
        fetchPrayerTimes()
      }
    }

    syncData()
    const intervalId = setInterval(syncData, 24 * 60 * 60 * 1000) // Check daily

    return () => clearInterval(intervalId)
  }, [fetchPrayerTimes, lastSyncTimestamp])

  useEffect(() => {
    audioRef.current = new Audio(AZAN_AUDIO_URL)
    audioRef.current.addEventListener('ended', () => setIsPlaying(false))
    return () => {
      if (audioRef.current) {
        audioRef.current.removeEventListener('ended', () => setIsPlaying(false))
      }
    }
  }, [])

  const toggleAzan = () => {
    if (isPlaying) {
      audioRef.current?.pause()
      audioRef.current!.currentTime = 0
      setIsPlaying(false)
    } else {
      audioRef.current?.play().catch(error => console.error('Error playing Azan:', error))
      setIsPlaying(true)
    }
  }

  const handleDelayChange = (prayer: string, value: string) => {
    setDelayTimes(prev => ({ ...prev, [prayer]: parseInt(value) || 0 }))
  }

  const adjustTime = (time: string, delayMinutes: number) => {
    const [hours, minutes] = time.split(':').map(Number)
    const date = new Date()
    date.setHours(hours, minutes + delayMinutes)
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
  }

  if (error) {
    return (
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-red-500">Error</CardTitle>
        </CardHeader>
        <CardContent>
          <p>{error}</p>
          <p>Please try again later or contact support if the problem persists.</p>
        </CardContent>
      </Card>
    )
  }

  if (!prayerTimes || !dateInfo) {
    return (
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Loading...</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">Fetching prayer times, please wait...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center">
              <ClockIcon className="mr-2" />
              Prayer Times
            </span>
            <Button onClick={toggleAzan} variant="outline" size="icon">
              {isPlaying ? <Volume2Icon className="h-4 w-4" /> : <VolumeIcon className="h-4 w-4" />}
            </Button>
          </CardTitle>
          <div className="text-center text-sm text-gray-500">
            <p>{dateInfo.readable}</p>
            <p>Hijri: {dateInfo.hijri.date} {dateInfo.hijri.month.en} {dateInfo.hijri.year}</p>
            <p>Gregorian: {dateInfo.gregorian.date} {dateInfo.gregorian.month.en} {dateInfo.gregorian.year}</p>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center">
              <SunIcon className="mr-2 text-yellow-500" />
              <span>Sunrise: {prayerTimes.Sunrise}</span>
            </div>
            <div className="flex items-center">
              <MoonIcon className="mr-2 text-blue-500" />
              <span>Sunset: {prayerTimes.Sunset}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Main Prayer Times</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Prayer</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Adjusted Time</TableHead>
                <TableHead>Delay (minutes)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'].map((prayer) => (
                <TableRow key={prayer}>
                  <TableCell className="font-medium">{prayer}</TableCell>
                  <TableCell>{prayerTimes[prayer as keyof PrayerTimings]}</TableCell>
                  <TableCell>{adjustTime(prayerTimes[prayer as keyof PrayerTimings], delayTimes[prayer])}</TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      value={delayTimes[prayer]}
                      onChange={(e) => handleDelayChange(prayer, e.target.value)}
                      className="w-20"
                      min="0"
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}


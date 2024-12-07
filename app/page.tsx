import { PrayerTimes } from '../components/prayer-times'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <h1 className="text-4xl font-bold mb-8">Azan Prayer Times</h1>
      <PrayerTimes />
    </main>
  )
}


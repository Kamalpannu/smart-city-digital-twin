"use client"

import { createContext, useContext, useState, useEffect } from "react"

const RealTimeDataContext = createContext()

export const useRealTimeData = () => {
  const context = useContext(RealTimeDataContext)
  if (!context) {
    throw new Error("useRealTimeData must be used within a RealTimeDataProvider")
  }
  return context
}

// Mock data generators
const generateWeatherData = () => ({
  temperature: Math.floor(Math.random() * 20) + 20,
  humidity: Math.floor(Math.random() * 40) + 40,
  windSpeed: Math.floor(Math.random() * 15) + 5,
  pollution: Math.floor(Math.random() * 80) + 20,
  pressure: Math.floor(Math.random() * 30) + 1010,
  timestamp: new Date().toISOString(),
})

const generateTrafficData = () => ({
  zones: {
    "Zone A": {
      traffic: Math.floor(Math.random() * 50) + 50,
      pollution: Math.floor(Math.random() * 80) + 20,
      reroute: ["none", "consider", "now"][Math.floor(Math.random() * 3)],
    },
    "Zone B": {
      traffic: Math.floor(Math.random() * 60) + 30,
      pollution: Math.floor(Math.random() * 100) + 20,
      reroute: ["none", "consider", "now"][Math.floor(Math.random() * 3)],
    },
    "Zone C": {
      traffic: Math.floor(Math.random() * 40) + 20,
      pollution: Math.floor(Math.random() * 50) + 10,
      reroute: ["none", "consider", "now"][Math.floor(Math.random() * 3)],
    },
  },
  timestamp: new Date().toISOString(),
})

export const RealTimeDataProvider = ({ children }) => {
  const [weatherData, setWeatherData] = useState(generateWeatherData())
  const [trafficData, setTrafficData] = useState(generateTrafficData())
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchData = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const apiUrl = process.env.REACT_APP_API_URL || ""

      // Try to fetch real data, fall back to mock data
      let weatherResponse, trafficResponse

      try {
        weatherResponse = await fetch(`${apiUrl}/weather/latest`)
        trafficResponse = await fetch(`${apiUrl}/traffic/latest`)
      } catch (fetchError) {
        console.log("[Smart City] API not available, using mock data")
        // Use mock data when API is not available
        setWeatherData(generateWeatherData())
        setTrafficData(generateTrafficData())
        setIsLoading(false)
        return
      }

      if (weatherResponse.ok && trafficResponse.ok) {
        const weather = await weatherResponse.json()
        const traffic = await trafficResponse.json()
        setWeatherData(weather)
        setTrafficData(traffic)
      } else {
        // Fallback to mock data
        setWeatherData(generateWeatherData())
        setTrafficData(generateTrafficData())
      }
    } catch (err) {
      console.error("[Smart City] Error fetching data:", err)
      setError(err.message)
      // Use mock data on error
      setWeatherData(generateWeatherData())
      setTrafficData(generateTrafficData())
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    // Initial fetch
    fetchData()

    // Set up polling every 5 seconds
    const interval = setInterval(fetchData, 5000)

    return () => clearInterval(interval)
  }, [])

  const value = {
    weatherData,
    trafficData,
    isLoading,
    error,
    refreshData: fetchData,
  }

  return <RealTimeDataContext.Provider value={value}>{children}</RealTimeDataContext.Provider>
}

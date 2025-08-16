"use client"

import React, { createContext, useContext, useEffect, useState, useCallback } from "react"
import { api } from "@/lib/api"

const RealTimeDataContext = createContext(undefined)

export function useRealTimeData() {
  const context = useContext(RealTimeDataContext)
  if (context === undefined) {
    throw new Error("useRealTimeData must be used within a RealTimeDataProvider")
  }
  return context
}

export function RealTimeDataProvider({ children, updateInterval = 5000 }) {
  const [weatherData, setWeatherData] = useState(null)
  const [trafficData, setTrafficData] = useState(null)
  const [isConnected, setIsConnected] = useState(false)
  const [lastUpdate, setLastUpdate] = useState(null)
  const [error, setError] = useState(null)

  const fetchData = useCallback(async () => {
    try {
      console.log("[v0] Fetching real-time data...")

      const [weather, traffic] = await Promise.all([
        api.getLatestWeather(),
        api.getLatestTraffic(),
      ])

      setWeatherData(weather)
      setTrafficData(traffic)
      setLastUpdate(new Date())
      setIsConnected(true)
      setError(null)

      console.log("[v0] Real-time data updated successfully", { weather, traffic })
    } catch (err) {
      console.error("[v0] Failed to fetch real-time data:", err)
      setError(err instanceof Error ? err.message : "Unknown error")
      setIsConnected(false)
    }
  }, [])

  const refreshData = useCallback(async () => {
    await fetchData()
  }, [fetchData])

  useEffect(() => {
    // Initial fetch
    fetchData()

    // Set up polling interval
    const interval = setInterval(fetchData, updateInterval)

    // Cleanup
    return () => {
      clearInterval(interval)
    }
  }, [fetchData, updateInterval])

  // Handle visibility change to pause/resume polling when tab is not active
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        console.log("[v0] Tab became visible, refreshing data")
        fetchData()
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [fetchData])

  const value = {
    weatherData,
    trafficData,
    isConnected,
    lastUpdate,
    error,
    refreshData,
  }

  return (
    <RealTimeDataContext.Provider value={value}>
      {children}
    </RealTimeDataContext.Provider>
  )
}

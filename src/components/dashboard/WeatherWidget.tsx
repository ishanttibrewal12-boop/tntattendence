import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Cloud, CloudRain, Sun, CloudSun, Wind, Droplets, Thermometer, CloudSnow, CloudLightning, CloudFog } from 'lucide-react';

interface WeatherData {
  temperature: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  feelsLike: number;
  icon: string;
}

const WeatherWidget = () => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetchWeather();
    const interval = setInterval(fetchWeather, 30 * 60 * 1000); // refresh every 30 min
    return () => clearInterval(interval);
  }, []);

  const fetchWeather = async () => {
    try {
      // Using Open-Meteo free API (no API key needed) for Deoghar, Jharkhand
      const lat = 24.49;
      const lon = 86.69;
      const res = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&timezone=Asia/Kolkata`
      );
      if (!res.ok) throw new Error('Weather fetch failed');
      const data = await res.json();
      const current = data.current;

      setWeather({
        temperature: Math.round(current.temperature_2m),
        feelsLike: Math.round(current.apparent_temperature),
        humidity: current.relative_humidity_2m,
        windSpeed: Math.round(current.wind_speed_10m),
        condition: getConditionText(current.weather_code),
        icon: getConditionIcon(current.weather_code),
      });
      setError(false);
    } catch {
      setError(true);
    } finally {
      setIsLoading(false);
    }
  };

  const getConditionText = (code: number): string => {
    if (code === 0) return 'Clear Sky';
    if (code <= 3) return 'Partly Cloudy';
    if (code <= 49) return 'Foggy';
    if (code <= 59) return 'Drizzle';
    if (code <= 69) return 'Rain';
    if (code <= 79) return 'Snow';
    if (code <= 84) return 'Rain Showers';
    if (code <= 94) return 'Thunderstorm';
    return 'Storm';
  };

  const getConditionIcon = (code: number): string => {
    if (code === 0) return 'sun';
    if (code <= 3) return 'cloud-sun';
    if (code <= 49) return 'fog';
    if (code <= 59) return 'drizzle';
    if (code <= 69) return 'rain';
    if (code <= 79) return 'snow';
    if (code <= 84) return 'rain';
    if (code <= 94) return 'thunder';
    return 'cloud';
  };

  const IconMap: Record<string, any> = {
    sun: Sun,
    'cloud-sun': CloudSun,
    fog: CloudFog,
    drizzle: CloudRain,
    rain: CloudRain,
    snow: CloudSnow,
    thunder: CloudLightning,
    cloud: Cloud,
  };

  if (isLoading) {
    return (
      <div className="p-3 rounded-xl border border-primary-foreground/8 animate-pulse" style={{ background: 'rgba(255,255,255,0.03)' }}>
        <div className="h-16 w-full rounded bg-primary-foreground/5" />
      </div>
    );
  }

  if (error || !weather) {
    return null; // silently fail — weather is supplementary
  }

  const WeatherIcon = IconMap[weather.icon] || Cloud;

  return (
    <motion.div
      className="p-4 rounded-xl border border-primary-foreground/8 overflow-hidden"
      style={{ background: 'rgba(255,255,255,0.03)' }}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg" style={{ background: 'hsla(200, 60%, 50%, 0.1)' }}>
            <WeatherIcon className="h-5 w-5" style={{ color: 'hsl(200, 60%, 55%)' }} />
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-extrabold text-primary-foreground tabular-nums">{weather.temperature}°</span>
              <span className="text-[10px] text-primary-foreground/40 font-semibold uppercase">C</span>
            </div>
            <p className="text-[10px] text-primary-foreground/50 font-medium">{weather.condition}</p>
          </div>
        </div>

        <div className="flex flex-col gap-1.5 text-right">
          <div className="flex items-center gap-1.5 justify-end">
            <Thermometer className="h-3 w-3 text-primary-foreground/30" />
            <span className="text-[10px] text-primary-foreground/40">Feels {weather.feelsLike}°</span>
          </div>
          <div className="flex items-center gap-1.5 justify-end">
            <Droplets className="h-3 w-3 text-primary-foreground/30" />
            <span className="text-[10px] text-primary-foreground/40">{weather.humidity}%</span>
          </div>
          <div className="flex items-center gap-1.5 justify-end">
            <Wind className="h-3 w-3 text-primary-foreground/30" />
            <span className="text-[10px] text-primary-foreground/40">{weather.windSpeed} km/h</span>
          </div>
        </div>
      </div>

      <p className="text-[9px] text-primary-foreground/20 mt-2 font-medium uppercase tracking-wider">
        Deoghar, Jharkhand
      </p>
    </motion.div>
  );
};

export default WeatherWidget;

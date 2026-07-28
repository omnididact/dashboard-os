export type WeatherConfig = {
  latitude: number;
  longitude: number;
  city: string;
  units: "fahrenheit" | "celsius";
  refreshMinutes: number;
};

export type WeatherHourly = {
  time: string;
  temperature: number;
  precipitation: number;
  weatherCode: number;
  precipProbability?: number | null;
  windSpeed?: number | null;
  humidity?: number | null;
  apparentTemperature?: number | null;
  isDay?: boolean;
};

export type WeatherDaily = {
  date: string;
  tempMax: number;
  tempMin: number;
  weatherCode: number;
  precipSum: number;
  precipProbabilityMax?: number | null;
  sunrise?: string | null;
  sunset?: string | null;
  uvIndexMax?: number | null;
};

export type WeatherPayload = {
  city: string;
  units: "fahrenheit" | "celsius";
  current: {
    temperature: number;
    weatherCode: number;
    humidity: number;
    windSpeed: number;
    apparentTemperature: number;
    precipitation?: number;
    isDay?: boolean;
  };
  hourly: WeatherHourly[];
  daily: WeatherDaily[];
  timezone?: string | null;
  updatedAt: string;
};

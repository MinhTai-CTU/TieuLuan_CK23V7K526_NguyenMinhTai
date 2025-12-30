"use client";

import { useQuery } from "@tanstack/react-query";

export interface City {
  id: string;
  name: string;
  support_carriers?: string[];
}

export interface District {
  id: string;
  name: string;
  support_carriers?: string[];
}

export interface Ward {
  id: number;
  name: string;
  support_carriers?: string[];
}

// Fetch cities
const fetchCities = async (): Promise<City[]> => {
  const response = await fetch("/api/goship/cities");

  if (!response.ok) {
    throw new Error("Failed to fetch cities");
  }

  const result = await response.json();

  // Handle response format: {code, data, status} or direct array
  if (result && typeof result === "object" && "data" in result) {
    return Array.isArray(result.data) ? result.data : [];
  }

  return Array.isArray(result) ? result : [];
};

// Fetch districts by city code
const fetchDistricts = async (cityCode: string): Promise<District[]> => {
  const response = await fetch(`/api/goship/cities/${cityCode}/districts`);

  if (!response.ok) {
    throw new Error("Failed to fetch districts");
  }

  const result = await response.json();

  // Handle response format: {code, data, status} or direct array
  if (result && typeof result === "object" && "data" in result) {
    return Array.isArray(result.data) ? result.data : [];
  }

  return Array.isArray(result) ? result : [];
};

// Fetch wards by district code
const fetchWards = async (districtCode: string): Promise<Ward[]> => {
  const response = await fetch(`/api/goship/districts/${districtCode}/wards`);

  if (!response.ok) {
    throw new Error("Failed to fetch wards");
  }

  const result = await response.json();

  // Handle response format: {code, data, status} or direct array
  if (result && typeof result === "object" && "data" in result) {
    return Array.isArray(result.data) ? result.data : [];
  }

  return Array.isArray(result) ? result : [];
};

// Hook to fetch cities
export const useCities = () => {
  return useQuery({
    queryKey: ["goship", "cities"],
    queryFn: fetchCities,
    staleTime: 1000 * 60 * 60, // Cache for 1 hour (cities don't change often)
  });
};

// Hook to fetch districts by city code
export const useDistricts = (cityCode: string | null) => {
  return useQuery({
    queryKey: ["goship", "districts", cityCode],
    queryFn: () => {
      if (!cityCode) {
        throw new Error("City code is required");
      }
      return fetchDistricts(cityCode);
    },
    enabled: !!cityCode, // Only fetch when cityCode is provided
    staleTime: 1000 * 60 * 60, // Cache for 1 hour
  });
};

// Hook to fetch wards by district code
export const useWards = (districtCode: string | null) => {
  return useQuery({
    queryKey: ["goship", "wards", districtCode],
    queryFn: () => {
      if (!districtCode) {
        throw new Error("District code is required");
      }
      return fetchWards(districtCode);
    },
    enabled: !!districtCode, // Only fetch when districtCode is provided
    staleTime: 1000 * 60 * 60, // Cache for 1 hour
  });
};

// Shipping Rate interface
export interface ShippingRate {
  carrier: string;
  carrier_name: string;
  service: string;
  service_name: string;
  total_fee: number;
  estimated_delivery_time?: string;
  estimated_delivery_date?: string;
  carrier_logo: string;
  expected: string;
}

export interface RatesRequest {
  to_district: string;
  to_city: string;
  amount: number; // Order amount (subtotal) in VND
  cod?: number; // Cash on delivery amount (amount + shipping fee) in VND
}

// Fetch shipping rates
const fetchRates = async (request: RatesRequest): Promise<ShippingRate[]> => {
  // Format request body according to Goship API structure
  const requestBody = {
    shipment: {
      address_from: {
        district: "100100",
        city: "100000",
      },
      address_to: {
        district: String(request.to_district),
        city: String(request.to_city),
      },
      parcel: {
        cod: request.cod || request.amount, // If cod not provided, use amount
        amount: request.amount,
        width: 10, // Fixed value
        height: 10, // Fixed value
        length: 10, // Fixed value
        weight: 750, // Fixed value in grams
      },
    },
  };

  // Debug: log request body

  const response = await fetch("/api/goship/rates", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.message || `Failed to fetch shipping rates: ${response.status}`
    );
  }

  const result = await response.json();

  // Handle response format: {code, data, status} or direct array
  if (result && typeof result === "object") {
    // Check if response has data property
    if ("data" in result && Array.isArray(result.data)) {
      return result.data;
    }
    // Check if response is directly an array
    if (Array.isArray(result)) {
      return result;
    }
    // Check if response has shipment or rates property
    if ("shipment" in result && Array.isArray(result.shipment)) {
      return result.shipment;
    }
    if ("rates" in result && Array.isArray(result.rates)) {
      return result.rates;
    }
  }

  return [];
};

// Hook to fetch shipping rates
export const useShippingRates = (request: RatesRequest | null) => {
  return useQuery({
    queryKey: ["goship", "rates", request],
    queryFn: () => {
      if (!request) {
        throw new Error("Rates request is required");
      }
      return fetchRates(request);
    },
    enabled:
      !!request &&
      !!request.to_district &&
      !!request.to_city &&
      !!request.amount,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });
};

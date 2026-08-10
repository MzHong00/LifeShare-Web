"use client";
import { useCallback, useRef } from "react";
import { useJsApiLoader } from "@react-google-maps/api";
import { ENV } from "@/constants/config";

const API_KEY_PLACEHOLDER = "your_google_maps_api_key_here"; // .env 미설정 시 기본 placeholder 값

export type MapLoadStatus = "missing-key" | "error" | "loading" | "ready";

interface UseGoogleMapResult {
  status: MapLoadStatus; // 지도 로드 단계 상태
  loadErrorMessage: string | null; // 로드 실패 메시지 (status === "error"일 때만)
  mapRef: React.RefObject<google.maps.Map | null>; // 로드된 Map 인스턴스 ref
  onMapLoad: (map: google.maps.Map) => void; // GoogleMap onLoad 콜백
}

/**
 * Google Maps JS API 로더와 Map 인스턴스 ref를 캡슐화한다.
 * API 키 부재·로드 에러·로딩·완료를 단일 status로 합쳐 컴포넌트는 선언적으로 분기만 한다.
 */
export function useGoogleMap(): UseGoogleMapResult {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: ENV.GOOGLE_MAPS_API_KEY,
  });

  const mapRef = useRef<google.maps.Map | null>(null);

  /** Map 인스턴스를 ref에 보관 */
  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);

  const hasApiKey =
    Boolean(ENV.GOOGLE_MAPS_API_KEY) && ENV.GOOGLE_MAPS_API_KEY !== API_KEY_PLACEHOLDER;

  /** 키 부재 → 에러 → 로딩 → 완료 순으로 로드 단계를 판정한다 */
  const getStatus = (): MapLoadStatus => {
    if (!hasApiKey) return "missing-key";
    if (loadError) return "error";
    if (!isLoaded) return "loading";
    return "ready";
  };

  return {
    status: getStatus(),
    loadErrorMessage: loadError?.message ?? null,
    mapRef,
    onMapLoad,
  };
}

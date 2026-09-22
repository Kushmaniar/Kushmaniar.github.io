"use client";

import type { RefObject } from "react";

export interface FlightPathProps {
  /** The `.folio-track` element (receives --rail-tail, holds .tl-dot and .plan-plane). */
  trackRef: RefObject<HTMLDivElement | null>;
  /** The outro text block; the rail ends level with its vertical centre. */
  tailRef: RefObject<HTMLDivElement | null>;
}

// STUB — replaced by builder (see docs/research/.../components/FlightPath.spec.md)
export function FlightPath(_props: FlightPathProps) {
  return null;
}

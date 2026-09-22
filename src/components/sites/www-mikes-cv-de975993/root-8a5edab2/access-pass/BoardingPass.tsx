"use client";

import type { RefObject } from "react";
import type { CardContact, ReaderStatus } from "../types";

export interface BoardingPassProps {
  status: ReaderStatus;
  /** Fired once when the card has been swiped fully through the slot. */
  onSwiped: () => void;
  /** Fired every drag frame with whether the card is in the slot row. */
  onZone: (inZone: boolean) => void;
  /** Fired when the card leaves the slot mid-swipe. */
  onError: () => void;
  /** Written every frame; read by the reader's contact shadow. */
  contact: RefObject<CardContact>;
}

// STUB — replaced by builder (see docs/research/.../components/BoardingPass.spec.md)
export function BoardingPass(_props: BoardingPassProps) {
  return null;
}

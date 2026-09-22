import { CARD_W, PASS_SCENE } from "../config";

/** Boarding pass height: the artwork is 492×240. */
export const CARD_H = +((CARD_W * 240) / 492).toFixed(4);
/** Boarding pass thickness. */
export const CARD_T = 0.014;
/** Boarding pass corner radius (shader-masked). */
export const CARD_RADIUS = 0.11;

/** Card reader body width / height. */
export const READER_W = 3.2;
export const READER_H = 0.92;
/** Backward tilt of the reader (radians); the card lies at this angle in the slot. */
export const READER_TILT = 0.22;

/** Horizontal distance at which the card fully clears the reader body. */
export const CARD_CLEAR_X = READER_W / 2 + CARD_W / 2;
/** Card centre height when its bottom edge sits in the slot. */
export const SLOT_CARD_Y = PASS_SCENE.slotY + CARD_H / 2;

/** Depth offset that keeps a tilted card flush with the slot at height `y`. */
export const slotDepth = (y: number) => (y - PASS_SCENE.readerY) * Math.tan(READER_TILT);

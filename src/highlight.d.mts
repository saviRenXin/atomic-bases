export interface HighlightSegment {
  text: string;
  highlighted: boolean;
}

export function tokenizeHighlights(value: string): HighlightSegment[];

export interface AtomicPropertyLocation {
  line: number;
  ch: number;
}

export function findAtomicPropertyLocation(source: string): AtomicPropertyLocation | null;

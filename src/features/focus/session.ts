export type RestoredViewport = {
  x: number;
  y: number;
  zoom: number;
};

type FocusSession = {
  viewport: RestoredViewport | null;
  originatingElement: HTMLElement | null;
};

let session: FocusSession = {
  viewport: null,
  originatingElement: null,
};

export function captureFocusSession(
  viewport: RestoredViewport | null,
  originating: Element | null,
): void {
  session = {
    viewport: viewport ? { ...viewport } : null,
    originatingElement:
      typeof HTMLElement !== 'undefined' && originating instanceof HTMLElement ? originating : null,
  };
}

export function restoreFocusSession(): RestoredViewport | null {
  const { viewport, originatingElement } = session;
  session = { viewport: null, originatingElement: null };
  if (
    originatingElement &&
    typeof document !== 'undefined' &&
    document.contains(originatingElement)
  ) {
    originatingElement.focus();
  }
  return viewport;
}

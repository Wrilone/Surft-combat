'use client';

import React, { useState } from 'react';

export function OrientationHint() {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="orientation-hint">
      <span>TIP: BEST PLAYED IN LANDSCAPE OR FULLSCREEN</span>
      <button className="hint-close-btn" onClick={() => setDismissed(true)}>
        ✕
      </button>
    </div>
  );
}

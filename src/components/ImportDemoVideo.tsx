"use client";

import { useRef, useState } from "react";

export function ImportDemoVideo() {
  const video = useRef<HTMLVideoElement>(null);
  const [started, setStarted] = useState(false);

  async function play() {
    setStarted(true);
    try {
      await video.current?.play();
    } catch {
      setStarted(false);
    }
  }

  return (
    <figure className="import-demo-video">
      <div className="import-demo-player">
        <video
          ref={video}
          controls={started}
          muted
          playsInline
          preload="none"
          poster="/videos/import-demo.jpg"
          width={1280}
          height={720}
          aria-label="Importing a Telegram notification and an England versus Mexico bet slip"
        >
          <source src="/videos/import-demo.mp4" type="video/mp4" />
          <track kind="captions" src="/videos/import-demo.vtt" srcLang="en" label="English" />
          <a href="/videos/import-demo.mp4">Watch the import demo</a>
        </video>
        {!started && (
          <button type="button" className="import-demo-play" onClick={play}>
            <span aria-hidden="true">▶</span> See how it works · 18 seconds
          </button>
        )}
      </div>
      <figcaption>
        Drag in a Telegram notification or a bet slip and extract the bet details.
        Illustrative demo with shortened timing. Sound effects optional: unmute in the player.
      </figcaption>
    </figure>
  );
}

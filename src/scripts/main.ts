// Echo Garden — stage 1 vertical slice. Wires the audio engine, the input
// controller and the bloom renderer together; see docs/CRIT_BRIEF.md and
// docs/CONTENT_SOURCE.md for the contract this implements.
import { AudioEngine } from "./audio/engine";
import { InstrumentController } from "./instrument/controller";
import { GardenRenderer } from "./visuals/renderer";

const surface = document.querySelector<HTMLCanvasElement>("#instrument-surface");
const opening = document.querySelector<HTMLElement>("[data-opening]");

if (surface) {
  const renderer = new GardenRenderer(surface);
  const audio = new AudioEngine();
  const controller = new InstrumentController(surface, audio, renderer);

  controller.notifyFirstSound(() => {
    opening?.classList.add("played");
    if (audio.isUnavailable()) {
      opening?.setAttribute("data-audio-unavailable", "true");
    }
  });
}

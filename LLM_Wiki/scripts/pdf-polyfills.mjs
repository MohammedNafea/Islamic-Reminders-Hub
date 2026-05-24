import { ImageData } from "canvas";

export function installPdfPolyfills() {
  if (typeof globalThis.DOMMatrix === "undefined") {
    globalThis.DOMMatrix = class DOMMatrix {
      constructor() {
        this.a = 1;
        this.b = 0;
        this.c = 0;
        this.d = 1;
        this.e = 0;
        this.f = 0;
        this.is2D = true;
        this.isIdentity = true;
      }
    };
  }
  if (typeof globalThis.ImageData === "undefined") {
    globalThis.ImageData = ImageData;
  }
  if (typeof globalThis.Path2D === "undefined") {
    globalThis.Path2D = class Path2D {};
  }
  if (typeof globalThis.OffscreenCanvas === "undefined") {
    globalThis.OffscreenCanvas = class OffscreenCanvas {
      constructor(width, height) {
        this.width = width;
        this.height = height;
      }
      getContext() {
        return {
          clearRect() {},
          fillRect() {},
          getImageData() {
            return { data: [] };
          },
        };
      }
    };
  }
}

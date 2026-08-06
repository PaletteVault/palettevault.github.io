(() => {
  // src/lib/color.js
  function normalizeHex(value) {
    const clean = String(value).replace(/[^0-9a-fA-F]/g, "").slice(0, 6).toLowerCase();
    return clean.length === 6 ? clean : "888888";
  }

  // src/plugin.js
  var asHex = (value) => `#${normalizeHex(value)}`;
  function* walk(shapes) {
    for (const shape of shapes) {
      yield shape;
      if (Array.isArray(shape.children)) yield* walk(shape.children);
    }
  }
  function fillColours(fill) {
    if (!fill || fill.fillOpacity === 0) return [];
    if (fill.fillColor) {
      return [{ hex: normalizeHex(fill.fillColor), share: 1 }];
    }
    const stops = fill.fillColorGradient && fill.fillColorGradient.stops;
    if (Array.isArray(stops) && stops.length) {
      const visible = stops.filter((stop) => stop.color && stop.opacity !== 0);
      return visible.map((stop) => ({
        hex: normalizeHex(stop.color),
        share: 1 / visible.length
      }));
    }
    return [];
  }
  function strokeColours(stroke) {
    if (!stroke || stroke.strokeOpacity === 0 || stroke.strokeStyle === "none") return [];
    if (stroke.strokeColor) return [{ hex: normalizeHex(stroke.strokeColor), share: 1 }];
    const stops = stroke.strokeColorGradient && stroke.strokeColorGradient.stops;
    if (Array.isArray(stops) && stops.length) {
      return stops.map((stop) => ({ hex: normalizeHex(stop.color), share: 1 / stops.length }));
    }
    return [];
  }
  function selectionColours(limit = 8) {
    const tally = /* @__PURE__ */ new Map();
    const add = (hex, weight) => {
      if (!hex || !(weight > 0)) return;
      tally.set(hex, (tally.get(hex) || 0) + weight);
    };
    for (const shape of walk(penpot.selection)) {
      if (shape.visible === false) continue;
      const width = shape.width || 0;
      const height = shape.height || 0;
      const area = width * height || 1;
      if (Array.isArray(shape.fills)) {
        for (const fill of shape.fills) {
          for (const { hex, share } of fillColours(fill)) add(hex, area * share);
        }
      }
      if (Array.isArray(shape.strokes)) {
        const perimeter = 2 * (width + height) || 1;
        for (const stroke of shape.strokes) {
          const thickness = stroke.strokeWidth || 1;
          for (const { hex, share } of strokeColours(stroke)) {
            add(hex, perimeter * thickness * share);
          }
        }
      }
    }
    return [...tally.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit).map(([hex]) => hex);
  }
  async function selectedImageBytes() {
    for (const shape of walk(penpot.selection)) {
      if (!Array.isArray(shape.fills)) continue;
      for (const fill of shape.fills) {
        if (fill.fillImage && typeof fill.fillImage.data === "function") {
          return fill.fillImage.data();
        }
      }
    }
    return null;
  }
  var SWATCH = 140;
  var LABEL = 34;
  function createSwatches(colours) {
    const board = penpot.createBoard();
    board.name = `Palette ${colours.map((c) => normalizeHex(c).toUpperCase()).join(" ")}`;
    board.resize(SWATCH * colours.length, SWATCH + LABEL);
    board.fills = [];
    board.clipContent = false;
    const { x, y } = penpot.viewport.center;
    board.x = Math.round(x - board.width / 2);
    board.y = Math.round(y - board.height / 2);
    colours.forEach((hex, index) => {
      const block = penpot.createRectangle();
      block.name = asHex(hex).toUpperCase();
      block.resize(SWATCH, SWATCH);
      block.x = board.x + index * SWATCH;
      block.y = board.y;
      block.fills = [{ fillColor: asHex(hex), fillOpacity: 1 }];
      board.appendChild(block);
      const label = penpot.createText(asHex(hex).toUpperCase());
      if (label) {
        label.name = `${asHex(hex).toUpperCase()} label`;
        label.resize(SWATCH, LABEL);
        label.x = board.x + index * SWATCH;
        label.y = board.y + SWATCH;
        label.fontSize = "12";
        label.align = "center";
        label.verticalAlign = "center";
        board.appendChild(label);
      }
    });
    penpot.selection = [board];
    return board;
  }
  function applyToSelection(colours) {
    const targets = [...walk(penpot.selection)].filter((shape) => "fills" in shape);
    targets.forEach((shape, index) => {
      shape.fills = [{ fillColor: asHex(colours[index % colours.length]), fillOpacity: 1 }];
    });
    return targets.length;
  }
  function createLibraryColours(colours) {
    colours.forEach((hex, index) => {
      const colour = penpot.library.local.createColor();
      colour.name = `Color ${index + 1}`;
      colour.path = "Palette Vault";
      colour.color = asHex(hex);
      colour.opacity = 1;
    });
    return colours.length;
  }
  var IMAGE_IN = (shape) => Array.isArray(shape.fills) && shape.fills.some((fill) => fill.fillImage);
  function solidHex(shape) {
    if (!shape || !Array.isArray(shape.fills)) return null;
    for (const fill of shape.fills) {
      if (fill.fillColor && fill.fillOpacity !== 0) return normalizeHex(fill.fillColor);
    }
    return null;
  }
  function backdropHex(shape) {
    let parent = shape.parent;
    while (parent) {
      const hex = solidHex(parent);
      if (hex) return hex;
      parent = parent.parent;
    }
    return null;
  }
  function contrastPair() {
    const selection = penpot.selection;
    if (selection.length === 2) {
      const a = solidHex(selection[0]);
      const b = solidHex(selection[1]);
      return a && b ? { foreground: a, background: b, source: "two layers" } : null;
    }
    if (selection.length === 1) {
      const a = solidHex(selection[0]);
      const b = backdropHex(selection[0]);
      return a && b ? { foreground: a, background: b, source: "layer and backdrop" } : null;
    }
    return null;
  }
  function reportSelection() {
    const selection = penpot.selection;
    const shapes = [...walk(selection)];
    penpot.ui.sendMessage({
      type: "selection",
      count: selection.length,
      fillable: shapes.filter((shape) => "fills" in shape).length,
      hasImage: shapes.some(IMAGE_IN),
      colours: selection.length ? selectionColours() : [],
      contrast: contrastPair()
    });
  }
  penpot.ui.open("Palette Vault", "", { width: 340, height: 580 });
  penpot.ui.onMessage(async (msg) => {
    if (!msg || typeof msg !== "object") return;
    try {
      switch (msg.type) {
        case "ready":
          penpot.ui.sendMessage({ type: "theme", theme: penpot.theme });
          reportSelection();
          break;
        case "create-swatches":
          createSwatches(msg.colours);
          penpot.ui.sendMessage({ type: "done", text: `Added ${msg.colours.length} swatches` });
          break;
        case "apply-to-selection": {
          const count = applyToSelection(msg.colours);
          penpot.ui.sendMessage({
            type: "done",
            text: count ? `Filled ${count} shape${count === 1 ? "" : "s"}` : "Nothing to fill"
          });
          break;
        }
        case "create-library-colours": {
          const count = createLibraryColours(msg.colours);
          penpot.ui.sendMessage({ type: "done", text: `Added ${count} colours to the library` });
          break;
        }
        case "read-image": {
          const bytes = await selectedImageBytes();
          penpot.ui.sendMessage({ type: "image", bytes: bytes || null });
          break;
        }
        case "close":
          penpot.closePlugin();
          break;
        default:
          break;
      }
    } catch (error) {
      penpot.ui.sendMessage({ type: "error", message: String(error && error.message) });
    }
  });
  penpot.on("selectionchange", () => reportSelection());
  penpot.on("themechange", (theme) => penpot.ui.sendMessage({ type: "theme", theme }));
})();

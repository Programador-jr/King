const zlib = require("node:zlib");
const { GIFEncoder, quantize, applyPalette } = require("gifenc");

const WIDTH = 640;
const HEIGHT = 420;

const FONT = {
  " ": ["000", "000", "000", "000", "000", "000", "000"],
  ".": ["0", "0", "0", "0", "0", "0", "1"],
  "0": ["111", "101", "101", "101", "101", "101", "111"],
  "1": ["010", "110", "010", "010", "010", "010", "111"],
  "2": ["111", "001", "001", "111", "100", "100", "111"],
  "3": ["111", "001", "001", "111", "001", "001", "111"],
  "4": ["101", "101", "101", "111", "001", "001", "001"],
  "5": ["111", "100", "100", "111", "001", "001", "111"],
  "6": ["111", "100", "100", "111", "101", "101", "111"],
  "7": ["111", "001", "001", "010", "010", "010", "010"],
  "8": ["111", "101", "101", "111", "101", "101", "111"],
  "9": ["111", "101", "101", "111", "001", "001", "111"],
  "A": ["010", "101", "101", "111", "101", "101", "101"],
  "B": ["110", "101", "101", "110", "101", "101", "110"],
  "C": ["111", "100", "100", "100", "100", "100", "111"],
  "D": ["110", "101", "101", "101", "101", "101", "110"],
  "E": ["111", "100", "100", "111", "100", "100", "111"],
  "F": ["111", "100", "100", "111", "100", "100", "100"],
  "G": ["111", "100", "100", "101", "101", "101", "111"],
  "H": ["101", "101", "101", "111", "101", "101", "101"],
  "I": ["111", "010", "010", "010", "010", "010", "111"],
  "J": ["001", "001", "001", "001", "101", "101", "111"],
  "K": ["101", "101", "110", "100", "110", "101", "101"],
  "L": ["100", "100", "100", "100", "100", "100", "111"],
  "M": ["101", "111", "111", "101", "101", "101", "101"],
  "N": ["101", "111", "111", "111", "101", "101", "101"],
  "O": ["111", "101", "101", "101", "101", "101", "111"],
  "P": ["111", "101", "101", "111", "100", "100", "100"],
  "Q": ["111", "101", "101", "101", "111", "001", "001"],
  "R": ["111", "101", "101", "111", "110", "101", "101"],
  "S": ["111", "100", "100", "111", "001", "001", "111"],
  "T": ["111", "010", "010", "010", "010", "010", "010"],
  "U": ["101", "101", "101", "101", "101", "101", "111"],
  "V": ["101", "101", "101", "101", "101", "101", "010"],
  "W": ["101", "101", "101", "101", "111", "111", "101"],
  "X": ["101", "101", "101", "010", "101", "101", "101"],
  "Y": ["101", "101", "101", "010", "010", "010", "010"],
  "Z": ["111", "001", "001", "010", "100", "100", "111"]
};

function crc32(buffer) {
  let crc = 0xffffffff;
  for (let i = 0; i < buffer.length; i += 1) {
    crc ^= buffer[i];
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBuffer = Buffer.from(type, "ascii");
  const length = Buffer.alloc(4);
  const crc = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])), 0);
  return Buffer.concat([length, typeBuffer, data, crc]);
}

function encodePng(pixels, width, height) {
  const header = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;

  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y += 1) {
    raw[y * (stride + 1)] = 0;
    pixels.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }

  return Buffer.concat([
    header,
    chunk("IHDR", ihdr),
    chunk("IDAT", zlib.deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0))
  ]);
}

function color(hex, alpha = 255) {
  const value = Number.parseInt(String(hex).replace("#", ""), 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255, alpha];
}

class Painter {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.pixels = Buffer.alloc(width * height * 4);
  }

  setPixel(x, y, rgba) {
    if (x < 0 || y < 0 || x >= this.width || y >= this.height) return;
    const index = (Math.floor(y) * this.width + Math.floor(x)) * 4;
    const alpha = rgba[3] / 255;
    const inverse = 1 - alpha;
    this.pixels[index] = Math.round(rgba[0] * alpha + this.pixels[index] * inverse);
    this.pixels[index + 1] = Math.round(rgba[1] * alpha + this.pixels[index + 1] * inverse);
    this.pixels[index + 2] = Math.round(rgba[2] * alpha + this.pixels[index + 2] * inverse);
    this.pixels[index + 3] = Math.min(255, Math.round(rgba[3] + this.pixels[index + 3] * inverse));
  }

  rect(x, y, w, h, rgba) {
    for (let yy = y; yy < y + h; yy += 1) {
      for (let xx = x; xx < x + w; xx += 1) this.setPixel(xx, yy, rgba);
    }
  }

  roundedRect(x, y, w, h, r, rgba) {
    for (let yy = y; yy < y + h; yy += 1) {
      for (let xx = x; xx < x + w; xx += 1) {
        const dx = xx < x + r ? x + r - xx : xx >= x + w - r ? xx - (x + w - r - 1) : 0;
        const dy = yy < y + r ? y + r - yy : yy >= y + h - r ? yy - (y + h - r - 1) : 0;
        if (dx * dx + dy * dy <= r * r || dx === 0 || dy === 0) this.setPixel(xx, yy, rgba);
      }
    }
  }

  circle(cx, cy, radius, rgba) {
    const r2 = radius * radius;
    for (let y = cy - radius; y <= cy + radius; y += 1) {
      for (let x = cx - radius; x <= cx + radius; x += 1) {
        const dx = x - cx;
        const dy = y - cy;
        if (dx * dx + dy * dy <= r2) this.setPixel(x, y, rgba);
      }
    }
  }

  ellipse(cx, cy, rx, ry, rgba) {
    for (let y = cy - ry; y <= cy + ry; y += 1) {
      for (let x = cx - rx; x <= cx + rx; x += 1) {
        const dx = (x - cx) / rx;
        const dy = (y - cy) / ry;
        if (dx * dx + dy * dy <= 1) this.setPixel(x, y, rgba);
      }
    }
  }

  line(x1, y1, x2, y2, rgba, thickness = 2) {
    const steps = Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1));
    for (let i = 0; i <= steps; i += 1) {
      const t = steps ? i / steps : 0;
      const x = Math.round(x1 + (x2 - x1) * t);
      const y = Math.round(y1 + (y2 - y1) * t);
      this.circle(x, y, thickness, rgba);
    }
  }

  gradientRect(x, y, w, h, top, bottom) {
    for (let yy = 0; yy < h; yy += 1) {
      const t = h <= 1 ? 0 : yy / (h - 1);
      const rgba = [
        Math.round(top[0] + (bottom[0] - top[0]) * t),
        Math.round(top[1] + (bottom[1] - top[1]) * t),
        Math.round(top[2] + (bottom[2] - top[2]) * t),
        Math.round(top[3] + (bottom[3] - top[3]) * t)
      ];
      this.rect(x, y + yy, w, 1, rgba);
    }
  }

  text(text, x, y, scale, rgba) {
    let cursor = x;
    for (const char of String(text).toUpperCase()) {
      const glyph = FONT[char] || FONT[" "];
      for (let row = 0; row < glyph.length; row += 1) {
        for (let col = 0; col < glyph[row].length; col += 1) {
          if (glyph[row][col] === "1") this.rect(cursor + col * scale, y + row * scale, scale, scale, rgba);
        }
      }
      cursor += (glyph[0].length + 1) * scale;
    }
  }
}

function drawCherry(p, cx, cy) {
  p.line(cx - 6, cy - 6, cx + 12, cy - 38, color("#4ade80"), 3);
  p.line(cx + 24, cy - 5, cx + 12, cy - 38, color("#4ade80"), 3);
  p.ellipse(cx + 25, cy - 38, 22, 10, color("#7ed957"));
  p.circle(cx - 8, cy + 2, 23, color("#ef233c"));
  p.circle(cx + 24, cy + 4, 23, color("#d90429"));
  p.circle(cx - 17, cy - 8, 7, color("#ff8fa3", 180));
  p.circle(cx + 16, cy - 6, 7, color("#ff8fa3", 160));
}

function drawLemon(p, cx, cy) {
  p.ellipse(cx, cy, 44, 30, color("#facc15"));
  p.ellipse(cx - 7, cy - 7, 34, 20, color("#fde047"));
  p.ellipse(cx + 20, cy + 12, 18, 9, color("#eab308", 150));
}

function drawGrape(p, cx, cy) {
  const purple = color("#9333ea");
  const light = color("#c084fc");
  [[0, -24], [-20, -8], [20, -8], [-10, 12], [10, 12], [0, 32]].forEach(([dx, dy]) => {
    p.circle(cx + dx, cy + dy, 18, purple);
    p.circle(cx + dx - 6, cy + dy - 5, 5, light);
  });
  p.line(cx, cy - 42, cx + 18, cy - 62, color("#4ade80"), 3);
}

function drawClover(p, cx, cy) {
  const green = color("#65a30d");
  const light = color("#bef264", 180);
  [[-18, -16], [18, -16], [-18, 18], [18, 18]].forEach(([dx, dy]) => {
    p.circle(cx + dx, cy + dy, 22, green);
    p.circle(cx + dx - 5, cy + dy - 5, 6, light);
  });
  p.line(cx + 7, cy + 25, cx + 26, cy + 58, color("#3f6212"), 4);
}

function drawSeven(p, cx, cy) {
  const gold = color("#f59e0b");
  const shine = color("#fde68a");
  p.roundedRect(cx - 42, cy - 50, 84, 18, 7, gold);
  p.line(cx + 34, cy - 40, cx - 10, cy + 55, gold, 9);
  p.line(cx + 25, cy - 34, cx - 18, cy + 54, shine, 3);
}

function drawDiamond(p, cx, cy) {
  const cyan = color("#38bdf8");
  const dark = color("#0284c7");
  for (let y = -42; y <= 42; y += 1) {
    const half = 42 - Math.abs(y);
    p.line(cx - half, cy + y, cx + half, cy + y, y < 0 ? cyan : dark, 1);
  }
  p.line(cx - 42, cy, cx, cy - 42, color("#e0f2fe", 180), 2);
  p.line(cx, cy - 42, cx + 42, cy, color("#e0f2fe", 180), 2);
}

function drawSymbol(p, symbol, x, y, emojiMap) {
  if (symbol === emojiMap.cherry) return drawCherry(p, x, y);
  if (symbol === emojiMap.lemon) return drawLemon(p, x, y);
  if (symbol === emojiMap.grape) return drawGrape(p, x, y);
  if (symbol === emojiMap.seven) return drawSeven(p, x, y);
  if (symbol === emojiMap.clover) return drawClover(p, x, y);
  return drawDiamond(p, x, y);
}

function drawSlotMachine({ roll, outcome, multiplier, emojiMap, label = null, titleColor = null }) {
  const p = new Painter(WIDTH, HEIGHT);
  p.gradientRect(0, 0, WIDTH, HEIGHT, color("#111827"), color("#030712"));

  p.roundedRect(70, 28, 500, 364, 34, color("#14101f"));
  p.roundedRect(82, 40, 476, 340, 28, color("#312e81"));
  p.roundedRect(94, 54, 452, 314, 24, color("#0f172a"));

  p.roundedRect(180, 8, 280, 62, 18, color(titleColor || (outcome === "win" ? "#db2777" : "#475569")));
  p.text("KING SLOTS", 225, 28, 5, color("#ffffff"));

  p.roundedRect(118, 112, 404, 156, 20, color("#1e1b4b"));
  p.roundedRect(128, 122, 384, 136, 16, color("#eef2ff"));

  const reelXs = [196, 320, 444];
  for (let i = 0; i < reelXs.length; i += 1) {
    p.roundedRect(reelXs[i] - 52, 132, 104, 116, 14, color("#312e81"));
    p.gradientRect(reelXs[i] - 46, 138, 92, 104, color("#4338ca"), color("#1e1b4b"));
    drawSymbol(p, roll[i], reelXs[i], 192, emojiMap);
  }

  p.roundedRect(220, 286, 200, 64, 16, color(outcome === "win" ? "#16a34a" : "#334155"));
  const displayLabel = label || (outcome === "win" ? `WIN ${Number(multiplier || 0).toFixed(1)}X` : "NO WIN");
  p.text(displayLabel, outcome === "win" || label === "SPIN" ? 260 : 264, 307, 5, color("#ffffff"));

  p.circle(560, 166, 20, color("#f8fafc"));
  p.roundedRect(552, 184, 16, 92, 8, color("#dc2626"));
  p.circle(560, 285, 26, color("#ef4444"));

  return p;
}

function renderSlotsResultImage({ roll, outcome, multiplier, emojiMap }) {
  const p = drawSlotMachine({ roll, outcome, multiplier, emojiMap });
  return encodePng(p.pixels, WIDTH, HEIGHT);
}

function randomSymbol(symbols) {
  return symbols[Math.floor(Math.random() * symbols.length)];
}

function renderSlotsSpinGif({ finalRoll, emojiMap, frameCount = 18, delay = 110 }) {
  const symbols = [emojiMap.cherry, emojiMap.lemon, emojiMap.grape, emojiMap.seven, emojiMap.clover];
  const gif = GIFEncoder();

  for (let frame = 0; frame < frameCount; frame += 1) {
    const lockedReels = frame >= frameCount - 3 ? frame - (frameCount - 3) + 1 : 0;
    const roll = finalRoll.map((symbol, index) => (
      index < lockedReels ? symbol : randomSymbol(symbols)
    ));
    const p = drawSlotMachine({
      roll,
      outcome: "push",
      multiplier: 0,
      emojiMap,
      label: lockedReels ? `${lockedReels}/3` : "SPIN",
      titleColor: frame % 2 === 0 ? "#db2777" : "#7c3aed"
    });
    const palette = quantize(p.pixels, 128);
    const indexed = applyPalette(p.pixels, palette);
    gif.writeFrame(indexed, WIDTH, HEIGHT, {
      palette,
      delay,
      repeat: 0
    });
  }

  gif.finish();
  return Buffer.from(gif.bytes());
}

module.exports = {
  renderSlotsResultImage,
  renderSlotsSpinGif
};

/**
 * ============================================================================
 *  REFERENCE COLOR DATA
 * ============================================================================
 *
 *  Two published, factual color sets used by the reference tools:
 *
 *    TAILWIND, the default palette shipped with Tailwind CSS (MIT licensed).
 *                Reproduced here purely as a lookup table.
 *    CSS_NAMED, the named colors defined by the CSS Color specification.
 *
 *  Neither is generated, so both live in source rather than in the data chunks.
 * ============================================================================
 */

export const TAILWIND_STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];

export const TAILWIND = {
  slate: ['f8fafc', 'f1f5f9', 'e2e8f0', 'cbd5e1', '94a3b8', '64748b', '475569', '334155', '1e293b', '0f172a', '020617'],
  gray: ['f9fafb', 'f3f4f6', 'e5e7eb', 'd1d5db', '9ca3af', '6b7280', '4b5563', '374151', '1f2937', '111827', '030712'],
  zinc: ['fafafa', 'f4f4f5', 'e4e4e7', 'd4d4d8', 'a1a1aa', '71717a', '52525b', '3f3f46', '27272a', '18181b', '09090b'],
  neutral: ['fafafa', 'f5f5f5', 'e5e5e5', 'd4d4d4', 'a3a3a3', '737373', '525252', '404040', '262626', '171717', '0a0a0a'],
  stone: ['fafaf9', 'f5f5f4', 'e7e5e4', 'd6d3d1', 'a8a29e', '78716c', '57534e', '44403c', '292524', '1c1917', '0c0a09'],
  red: ['fef2f2', 'fee2e2', 'fecaca', 'fca5a5', 'f87171', 'ef4444', 'dc2626', 'b91c1c', '991b1b', '7f1d1d', '450a0a'],
  orange: ['fff7ed', 'ffedd5', 'fed7aa', 'fdba74', 'fb923c', 'f97316', 'ea580c', 'c2410c', '9a3412', '7c2d12', '431407'],
  amber: ['fffbeb', 'fef3c7', 'fde68a', 'fcd34d', 'fbbf24', 'f59e0b', 'd97706', 'b45309', '92400e', '78350f', '451a03'],
  yellow: ['fefce8', 'fef9c3', 'fef08a', 'fde047', 'facc15', 'eab308', 'ca8a04', 'a16207', '854d0e', '713f12', '422006'],
  lime: ['f7fee7', 'ecfccb', 'd9f99d', 'bef264', 'a3e635', '84cc16', '65a30d', '4d7c0f', '3f6212', '365314', '1a2e05'],
  green: ['f0fdf4', 'dcfce7', 'bbf7d0', '86efac', '4ade80', '22c55e', '16a34a', '15803d', '166534', '14532d', '052e16'],
  emerald: ['ecfdf5', 'd1fae5', 'a7f3d0', '6ee7b7', '34d399', '10b981', '059669', '047857', '065f46', '064e3b', '022c22'],
  teal: ['f0fdfa', 'ccfbf1', '99f6e4', '5eead4', '2dd4bf', '14b8a6', '0d9488', '0f766e', '115e59', '134e4a', '042f2e'],
  cyan: ['ecfeff', 'cffafe', 'a5f3fc', '67e8f9', '22d3ee', '06b6d4', '0891b2', '0e7490', '155e75', '164e63', '083344'],
  sky: ['f0f9ff', 'e0f2fe', 'bae6fd', '7dd3fc', '38bdf8', '0ea5e9', '0284c7', '0369a1', '075985', '0c4a6e', '082f49'],
  blue: ['eff6ff', 'dbeafe', 'bfdbfe', '93c5fd', '60a5fa', '3b82f6', '2563eb', '1d4ed8', '1e40af', '1e3a8a', '172554'],
  indigo: ['eef2ff', 'e0e7ff', 'c7d2fe', 'a5b4fc', '818cf8', '6366f1', '4f46e5', '4338ca', '3730a3', '312e81', '1e1b4b'],
  violet: ['f5f3ff', 'ede9fe', 'ddd6fe', 'c4b5fd', 'a78bfa', '8b5cf6', '7c3aed', '6d28d9', '5b21b6', '4c1d95', '2e1065'],
  purple: ['faf5ff', 'f3e8ff', 'e9d5ff', 'd8b4fe', 'c084fc', 'a855f7', '9333ea', '7e22ce', '6b21a8', '581c87', '3b0764'],
  fuchsia: ['fdf4ff', 'fae8ff', 'f5d0fe', 'f0abfc', 'e879f9', 'd946ef', 'c026d3', 'a21caf', '86198f', '701a75', '4a044e'],
  pink: ['fdf2f8', 'fce7f3', 'fbcfe8', 'f9a8d4', 'f472b6', 'ec4899', 'db2777', 'be185d', '9d174d', '831843', '500724'],
  rose: ['fff1f2', 'ffe4e6', 'fecdd3', 'fda4af', 'fb7185', 'f43f5e', 'e11d48', 'be123c', '9f1239', '881337', '4c0519'],
};

/** Named colors from the CSS Color specification. */
export const CSS_NAMED = [
  ['aliceblue', 'f0f8ff'], ['antiquewhite', 'faebd7'], ['aqua', '00ffff'],
  ['aquamarine', '7fffd4'], ['azure', 'f0ffff'], ['beige', 'f5f5dc'],
  ['bisque', 'ffe4c4'], ['black', '000000'], ['blanchedalmond', 'ffebcd'],
  ['blue', '0000ff'], ['blueviolet', '8a2be2'], ['brown', 'a52a2a'],
  ['burlywood', 'deb887'], ['cadetblue', '5f9ea0'], ['chartreuse', '7fff00'],
  ['chocolate', 'd2691e'], ['coral', 'ff7f50'], ['cornflowerblue', '6495ed'],
  ['cornsilk', 'fff8dc'], ['crimson', 'dc143c'], ['cyan', '00ffff'],
  ['darkblue', '00008b'], ['darkcyan', '008b8b'], ['darkgoldenrod', 'b8860b'],
  ['darkgray', 'a9a9a9'], ['darkgreen', '006400'], ['darkkhaki', 'bdb76b'],
  ['darkmagenta', '8b008b'], ['darkolivegreen', '556b2f'], ['darkorange', 'ff8c00'],
  ['darkorchid', '9932cc'], ['darkred', '8b0000'], ['darksalmon', 'e9967a'],
  ['darkseagreen', '8fbc8f'], ['darkslateblue', '483d8b'], ['darkslategray', '2f4f4f'],
  ['darkturquoise', '00ced1'], ['darkviolet', '9400d3'], ['deeppink', 'ff1493'],
  ['deepskyblue', '00bfff'], ['dimgray', '696969'], ['dodgerblue', '1e90ff'],
  ['firebrick', 'b22222'], ['floralwhite', 'fffaf0'], ['forestgreen', '228b22'],
  ['fuchsia', 'ff00ff'], ['gainsboro', 'dcdcdc'], ['ghostwhite', 'f8f8ff'],
  ['gold', 'ffd700'], ['goldenrod', 'daa520'], ['gray', '808080'],
  ['green', '008000'], ['greenyellow', 'adff2f'], ['honeydew', 'f0fff0'],
  ['hotpink', 'ff69b4'], ['indianred', 'cd5c5c'], ['indigo', '4b0082'],
  ['ivory', 'fffff0'], ['khaki', 'f0e68c'], ['lavender', 'e6e6fa'],
  ['lavenderblush', 'fff0f5'], ['lawngreen', '7cfc00'], ['lemonchiffon', 'fffacd'],
  ['lightblue', 'add8e6'], ['lightcoral', 'f08080'], ['lightcyan', 'e0ffff'],
  ['lightgoldenrodyellow', 'fafad2'], ['lightgray', 'd3d3d3'], ['lightgreen', '90ee90'],
  ['lightpink', 'ffb6c1'], ['lightsalmon', 'ffa07a'], ['lightseagreen', '20b2aa'],
  ['lightskyblue', '87cefa'], ['lightslategray', '778899'], ['lightsteelblue', 'b0c4de'],
  ['lightyellow', 'ffffe0'], ['lime', '00ff00'], ['limegreen', '32cd32'],
  ['linen', 'faf0e6'], ['magenta', 'ff00ff'], ['maroon', '800000'],
  ['mediumaquamarine', '66cdaa'], ['mediumblue', '0000cd'], ['mediumorchid', 'ba55d3'],
  ['mediumpurple', '9370db'], ['mediumseagreen', '3cb371'], ['mediumslateblue', '7b68ee'],
  ['mediumspringgreen', '00fa9a'], ['mediumturquoise', '48d1cc'], ['mediumvioletred', 'c71585'],
  ['midnightblue', '191970'], ['mintcream', 'f5fffa'], ['mistyrose', 'ffe4e1'],
  ['moccasin', 'ffe4b5'], ['navajowhite', 'ffdead'], ['navy', '000080'],
  ['oldlace', 'fdf5e6'], ['olive', '808000'], ['olivedrab', '6b8e23'],
  ['orange', 'ffa500'], ['orangered', 'ff4500'], ['orchid', 'da70d6'],
  ['palegoldenrod', 'eee8aa'], ['palegreen', '98fb98'], ['paleturquoise', 'afeeee'],
  ['palevioletred', 'db7093'], ['papayawhip', 'ffefd5'], ['peachpuff', 'ffdab9'],
  ['peru', 'cd853f'], ['pink', 'ffc0cb'], ['plum', 'dda0dd'],
  ['powderblue', 'b0e0e6'], ['purple', '800080'], ['rebeccapurple', '663399'],
  ['red', 'ff0000'], ['rosybrown', 'bc8f8f'], ['royalblue', '4169e1'],
  ['saddlebrown', '8b4513'], ['salmon', 'fa8072'], ['sandybrown', 'f4a460'],
  ['seagreen', '2e8b57'], ['seashell', 'fff5ee'], ['sienna', 'a0522d'],
  ['silver', 'c0c0c0'], ['skyblue', '87ceeb'], ['slateblue', '6a5acd'],
  ['slategray', '708090'], ['snow', 'fffafa'], ['springgreen', '00ff7f'],
  ['steelblue', '4682b4'], ['tan', 'd2b48c'], ['teal', '008080'],
  ['thistle', 'd8bfd8'], ['tomato', 'ff6347'], ['turquoise', '40e0d0'],
  ['violet', 'ee82ee'], ['wheat', 'f5deb3'], ['white', 'ffffff'],
  ['whitesmoke', 'f5f5f5'], ['yellow', 'ffff00'], ['yellowgreen', '9acd32'],
];

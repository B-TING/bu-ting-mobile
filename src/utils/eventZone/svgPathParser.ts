export type SvgPoint = { x: number; y: number };

/** busan.svg district path(`d`) → 닫힌 링 좌표 배열 */
export function parseSvgPathToRings(d: string): SvgPoint[][] {
  const rings: SvgPoint[][] = [];
  let ring: SvgPoint[] = [];
  let cx = 0;
  let cy = 0;
  let startX = 0;
  let startY = 0;
  let cmd = '';

  const tokens = d.trim().match(/[a-zA-Z]|-?\d*\.?\d+(?:e[-+]?\d+)?/g) ?? [];

  const flush = () => {
    if (!cmd) {
      return;
    }

    if (cmd === 'M' && nums.length >= 2) {
      if (ring.length >= 3) {
        rings.push(ring);
      }
      ring = [];
      cx = nums[0];
      cy = nums[1];
      startX = cx;
      startY = cy;
      ring.push({ x: cx, y: cy });
    } else if (cmd === 'm' && nums.length >= 2) {
      if (ring.length >= 3) {
        rings.push(ring);
      }
      ring = [];
      cx += nums[0];
      cy += nums[1];
      startX = cx;
      startY = cy;
      ring.push({ x: cx, y: cy });
    } else if (cmd === 'L' && nums.length >= 2) {
      for (let i = 0; i + 1 < nums.length; i += 2) {
        cx = nums[i];
        cy = nums[i + 1];
        ring.push({ x: cx, y: cy });
      }
    } else if (cmd === 'l') {
      for (let i = 0; i + 1 < nums.length; i += 2) {
        cx += nums[i];
        cy += nums[i + 1];
        ring.push({ x: cx, y: cy });
      }
    } else if (cmd === 'z' || cmd === 'Z') {
      if (ring.length >= 3) {
        ring.push({ x: startX, y: startY });
        rings.push(ring);
      }
      ring = [];
    }

    cmd = '';
    nums.length = 0;
  };

  let nums: number[] = [];

  for (const token of tokens) {
    if (/^[a-zA-Z]$/.test(token)) {
      flush();
      cmd = token;
      continue;
    }
    nums.push(Number(token));
  }
  flush();

  if (ring.length >= 3) {
    rings.push(ring);
  }

  return rings;
}

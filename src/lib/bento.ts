/**
 * Bento layout for the hall catalog: some cards take 2 cells or a 2x2 block.
 * Cards keep the backend order (`sort` in the admin), so what lands in a big cell is the editor's choice.
 * The grid is 4 columns on `lg`, 2 on `md`, one on mobile (spans only apply from `md`).
 * Blocks are two rows tall and tile a 4-column grid exactly; a leftover tail is stretched
 * to fill its last row, so the grid never has holes.
 */
export type Cell = {
  /** Tailwind span classes for the grid item (full literals so Tailwind can see them) */
  span: string;
  /** one grid row tall: long descriptions must not grow into the price badge */
  compact: boolean;
  featured: boolean;
  /** grid cells taken on `lg` (1, 2 or 4); cards under 2 cells are too small for a description */
  area: number;
};

const s: Cell = { span: "", compact: true, featured: false, area: 1 };
const wide: Cell = { span: "md:col-span-2", compact: true, featured: false, area: 2 };
const tall: Cell = { span: "md:row-span-2", compact: false, featured: false, area: 2 };
const big: Cell = { span: "md:col-span-2 md:row-span-2", compact: false, featured: true, area: 4 };
const full: Cell = { span: "md:col-span-2 lg:col-span-4", compact: true, featured: false, area: 4 };

const blocks: Cell[][] = [
  [big, s, s, s, s],
  [wide, tall, s, s, s, s],
  [s, s, big, s, s],
];

const tails: Record<number, Cell[]> = {
  1: [full],
  2: [wide, wide],
  3: [s, s, wide],
};

export function bentoLayout(count: number): Cell[] {
  const cells: Cell[] = [];
  let block = 0;

  while (count - cells.length >= blocks[block % blocks.length].length) {
    cells.push(...blocks[block % blocks.length]);
    block++;
  }

  let rest = count - cells.length;
  while (rest > 0) {
    const row = Math.min(rest, 4);
    cells.push(...(tails[row] ?? [s, s, s, s]));
    rest -= row;
  }
  return cells;
}


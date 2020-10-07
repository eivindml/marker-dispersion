// b - beginning position
// e - ending position
// i - your current value (0-99)
function getTween(b: number, e: number, i: number) {
  return b + (i / 200) * (e - b);
}

export { getTween };

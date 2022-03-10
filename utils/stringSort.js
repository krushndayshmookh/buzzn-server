module.exports = function stringSort(a, b, caseSenstive = true) {
  if (!caseSenstive) {
    a = a.toLowerCase()
    b = b.toLowerCase()
  }
  if (a < b) return -1
  if (a > b) return 1
  return 0
}

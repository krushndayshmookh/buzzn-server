module.exports = function nameSort(a, b) {
  if (a.name < b.name) return -1
  if (a.name > b.name) return 1
  return 0
}

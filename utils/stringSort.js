module.exports = function stringSort(inputA, inputB, caseSenstive = true) {
  let a = inputA
  let b = inputB

  if (!caseSenstive) {
    a = a.toLowerCase()
    b = b.toLowerCase()
  }

  if (a < b) return -1
  if (a > b) return 1
  return 0
}

exports.stringSort = function (a,b){
  if (a < b) return -1
  if (a > b) return 1
  return 0
}

module.exports = function nameSort (a, b) {
  if (a.name < b.name) return -1
  if (a.name > b.name) return 1
  return 0
}


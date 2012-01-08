var matcher = {
  isIndexExcluded: function(excluded, index) { 
    index = parseInt(index);
    for (var i = 0; i < excluded.length; i++) {
      if (parseInt(excluded[i]) === index) return true;
    }
    return false;
  },
  pushUnique: function (matches, index) {
    index = parseInt(index);
    for (var i = 0; i < matches.length; i++) {
      if (parseInt(matches[i]) === index) return;
    }
    matches.push(index);
  },
  cellMatch: function (map, firstIndex, secondIndex) { 
    var second = map.tileAt(secondIndex);
    if (!second) return false;

    var first = map.tileAt(firstIndex);
    if (!first) return false;

	return first.group === second.group && 
           parseInt(first.level) === parseInt(second.level);
  },
  matchingCellsAt: function (map, index, excluded) {
    index = parseInt(index);
    var indices = map.cellIndicesAt(index);
	
    var hasTopNeighbor = index >= map.size && !matcher.isIndexExcluded(excluded, indices.top);
    var hasBottomNeighbor = index <= map.cells.length - map.size && !matcher.isIndexExcluded(excluded, indices.bottom);
    var hasLeftNeighbor = index % map.size !== 0 && !matcher.isIndexExcluded(excluded, indices.left);
    var hasRightNeighbor = index % map.size !== map.size-1 && !matcher.isIndexExcluded(excluded, indices.right);

    var matches = [];
    if (hasTopNeighbor && matcher.cellMatch(map, index, indices.top)) matches.push(indices.top);
    if (hasBottomNeighbor && matcher.cellMatch(map, index, indices.bottom)) matches.push(indices.bottom);
    if (hasLeftNeighbor && matcher.cellMatch(map, index, indices.left)) matches.push(indices.left);
    if (hasRightNeighbor && matcher.cellMatch(map, index, indices.right)) matches.push(indices.right);

    return matches;
  },
  matchNeighbors: function(map, index, matches) {	
// console.log("MATCH NEIGHBORS with "+JSON.stringify(matches))
    var matched = matcher.matchingCellsAt(map, index, matches);
// console.log("MATCH NEIGHBORS matched "+JSON.stringify(matched))

// console.log("MATCH NEIGHBORS combined "+JSON.stringify(matches.concat(matched)))
    for (var i = 0; i < matched.length; i++) {
      matcher.pushUnique(matches, matched[i]);
      // console.log("rescursive matching for index "+matched[i])
      matcher.matchNeighbors(map, matched[i], matches);
    }
  }
}

module.exports = matcher;
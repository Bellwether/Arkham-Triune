var matcher = {
  minimumMatches: 3,
  upgrade: function(map, matched) {
    if (matched.tile && matched.tile._id) return;

    var tile = map.tileAt(matched.index);
    if (tile) {
      var upgrade = tile.nextUpgrade();
      matched.tile._id = upgrade._id;
      matched.tile.name = upgrade.name;
    }
   console.log('upgrade for tile '+JSON.stringify(tile)+' at '+matched.index)
  },
  cellsMatch: function(map, first, second) {
    var cellIsCursed = map.cells[first].cursed || map.cells[second].cursed;
    if (cellIsCursed) return false;

    var firstTile = map.tileAt(first);
    if (!firstTile) return false;

    var secondTile = map.tileAt(second);
    if (!secondTile) return false;

	var groupMatch = firstTile.group === secondTile.group;
    var levelMatch = parseInt(firstTile.level) === parseInt(secondTile.level);

console.log("groupMatch="+groupMatch+" && levelMatch="+levelMatch+ ' ('+JSON.stringify(firstTile)+', '+JSON.stringify(secondTile)+')')
    return groupMatch && levelMatch;
  },
  match: function(map, matched, index) {
	var cell = map.cellAt(index);
	var neighbors = cell.emplacedNeighbors(map.cells);
	
	console.log('match '+index+' neighbors '+JSON.stringify(neighbors))
	neighbors.forEach(function(i) {
		console.log('TEST neighbor '+i+' hasCell '+matched.hasCell(i))
      if (!matched.hasCell(i) && matcher.cellsMatch(map, index, i)) {
	console.log('match at '+i)
        matched.cells.push(i);
        matcher.match(map, matched, i);
      }
    })
console.log('matched.matchLength='+matched.matchLength)
    if (matched.matchLength >= 3) matcher.upgrade(map, matched);
  },
  matchRepeat: function(map, schema, matches, index) {
    var originalTileId = map.cells[index].tileId;

    var matching = true;
    while (matching) {
      var match = new schema({index: index});
      matcher.match(map, match, index);
console.log("matchRepeat "+index+' '+JSON.stringify(match))

      var matching = match.tile._id ? true : false;
      if (matching) {
        map.cells[index].tileId = match.tile._id;
      }
      if (match.matchLength >= matcher.minimumMatches) matches.push(match);
    }
console.log("matchRepeat matches "+JSON.stringify(matches))   
    map.cells[index].tileId = originalTileId;
  },

	
//   mergeMatched: function(firstMatches, secondMatches) {	
//     firstMatches.points = firstMatches.points + secondMatches.points;	
//     firstMatches.matches = firstMatches.matches.concat(secondMatches.matches).sort();
//     for (var i = 1; i < firstMatches.matches.length; i++ ) {
//       if (firstMatches.matches[i] === firstMatches.matches[i - 1]) {
//         firstMatches.matches.splice( i--, 1 );
//       }
//     };
//     if (secondMatches.upgrade) firstMatches.upgrade = secondMatches.upgrade;
//   },
//   isIndexExcluded: function(excluded, index) { 
//     index = parseInt(index);
//     for (var i = 0; i < excluded.length; i++) {
//       if (parseInt(excluded[i]) === index) return true;
//     }
//     return false;
//   },
//   pushUnique: function (matches, index) {
//     index = parseInt(index);
//     for (var i = 0; i < matches.length; i++) {
//       if (parseInt(matches[i]) === index) return;
//     }
//     matches.push(index);
//   },
//   cellMatch: function (map, firstIndex, secondIndex) { 
//     var second = map.tileAt(secondIndex);
//     if (!second) return false;
// 
//     var first = map.tileAt(firstIndex);
//     if (!first) return false;
// 
//     if (map.cells[firstIndex].cursed || map.cells[secondIndex].cursed) return false; // cursed tiles don't match
//    
// 	return first.group === second.group && 
//            parseInt(first.level) === parseInt(second.level);
//   },
//   matchingCellsAt: function (map, index, excluded) {
//     var tile = map.tileAt(index);
//     if (tile && tile.monster) return []; // live monsters don't make matches
// 
//     index = parseInt(index);
//     var indices = map.cellIndicesAt(index);
// 	
//     var hasTopNeighbor = index >= map.size && !matcher.isIndexExcluded(excluded, indices.top);
//     var hasBottomNeighbor = index <= map.cells.length - map.size && !matcher.isIndexExcluded(excluded, indices.bottom);
//     var hasLeftNeighbor = index % map.size !== 0 && !matcher.isIndexExcluded(excluded, indices.left);
//     var hasRightNeighbor = index % map.size !== map.size-1 && !matcher.isIndexExcluded(excluded, indices.right);
// 
//     var matches = [];
//     if (hasTopNeighbor && matcher.cellMatch(map, index, indices.top)) matches.push(indices.top);
//     if (hasBottomNeighbor && matcher.cellMatch(map, index, indices.bottom)) matches.push(indices.bottom);
//     if (hasLeftNeighbor && matcher.cellMatch(map, index, indices.left)) matches.push(indices.left);
//     if (hasRightNeighbor && matcher.cellMatch(map, index, indices.right)) matches.push(indices.right);
// 
//     return matches;
//   },
//   matchNeighbors: function(map, index, matches) {	
// // console.log("MATCH NEIGHBORS with "+JSON.stringify(matches))
//     var matched = matcher.matchingCellsAt(map, index, matches);
// // console.log("MATCH NEIGHBORS matched "+JSON.stringify(matched))
// 
// // console.log("MATCH NEIGHBORS combined "+JSON.stringify(matches.concat(matched)))
//     for (var i = 0; i < matched.length; i++) {
//       matcher.pushUnique(matches, matched[i]);
//       // console.log("rescursive matching for index "+matched[i])
//       matcher.matchNeighbors(map, matched[i], matches);
//     }
//   }
}

module.exports = matcher;
var matcher = {
  minimumMatches: 3,
  compareMatches: function(first, second, tileList) {
    var firstMatchCount = 0;
    var secondMatchCount = 0;
    if (first) {
      first.forEach(function(match) {
        firstMatchCount = firstMatchCount + match.cells.length;
      })
    }
    if (second) {
      second.forEach(function(match) {
        secondMatchCount = secondMatchCount + match.cells.length;
      })
    }
	// console.log('compareMatch '+firstMatchCount+' > '+secondMatchCount+' between first '+JSON.stringify(first)+' and second '+JSON.stringify(first))
	
    var compareByPoints = firstMatchCount > 0 && firstMatchCount === secondMatchCount;
	if (compareByPoints) {
      var firstMatchPoints = 0;
      var secondMatchPoints = 0;

      first.forEach(function(match) {		
        firstMatchPoints = firstMatchPoints + tileList[match.tile._id].points;
      });
      second.forEach(function(match) {		
        secondMatchPoints = secondMatchPoints + tileList[match.tile._id].points;
      });

      return firstMatchPoints >= secondMatchPoints ? first : second;
	} else {
	  return firstMatchCount >= secondMatchCount ? first : second;
    }
  },
  upgrade: function(map, matched) {
    if (matched.tile && matched.tile._id) return;

    var tile = map.tileAt(matched.index);
    if (tile) {
      var upgrade = tile.nextUpgrade();
      if (upgrade) {
        matched.tile._id = upgrade._id;
        matched.tile.name = upgrade.name;	
      }
    }
   // console.log('upgrade for tile '+JSON.stringify(tile)+' at '+matched.index)
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

// console.log(first+' '+second+", groupMatch="+groupMatch+" && levelMatch="+levelMatch+ ' ('+JSON.stringify(firstTile)+', '+JSON.stringify(secondTile)+')')
    return groupMatch && levelMatch;
  },
  match: function(map, matched, index) {
	var cell = map.cellAt(index);
	var neighbors = cell.emplacedNeighbors(map.cells);
	
	// console.log('match '+index+' neighbors '+JSON.stringify(neighbors))
	neighbors.forEach(function(i) {
		// console.log('TEST neighbor '+i+' hasCell '+matched.hasCell(i))
      if (!matched.hasCell(i) && matcher.cellsMatch(map, index, i)) {
	// console.log('match at '+i)
        matched.cells.push(i);
        matcher.match(map, matched, i);
      }
    })
// console.log('matched.matchLength='+matched.matchLength)
    if (matched.matchLength >= 3) matcher.upgrade(map, matched);
  },
  matchRepeat: function(map, schema, matches, index) {
    var originalTileId = map.cells[index].tileId;

    var matching = true;
    while (matching) {
      var match = new schema({index: index});
      matcher.match(map, match, index);
// console.log("matchRepeat "+index+' '+JSON.stringify(match))

      var matching = match.tile._id ? true : false;
      if (matching) {
        map.cells[index].tileId = match.tile._id;
      }
      if (match.matchLength >= matcher.minimumMatches) matches.push(match);
    }
// console.log("matchRepeat matches "+JSON.stringify(matches))   
    map.cells[index].tileId = originalTileId;
  },
}

module.exports = matcher;
var monsters = {
  trappedTile: function(tileList) {	
    for (var i = 0; i < tileList.length; i++) {
      var isSummoning = tileList[i].group === 'summoning';
      var levelMatch = parseInt(tileList[i].level) === 1;

      if (isSummoning && levelMatch) {
        return tileList[i];
      }
    } 
  },	
  monsterIndices: function(map) {
    var indices = [];
    for (var i = 0; i < map.cells.length; i++) {
      var tile = map.tileAt(i);
      if (tile && tile.monster) indices.push(i);
    }
    return indices;
  },
  cellEmptyOrMonster: function(map, index) {
    var cell = map.cellAt(index);
    return cell.empty || map.tileAt(index).monster;
  },
  cellMagicCircle: function(map, index) {
    var tile = map.tileAt(index);
    return tile && tile.summoning;
  },
  pushIfEmptyOrMonster: function(map, index, emptyExits, monsterExits, exclude) {
	for (var i =0; i < exclude.length; i++) {
      if (exclude[i]+'' === index+'') return;
	}
	
	if (map.cellAt(index).empty) {
      emptyExits.push(index);
	} else if (map.tileAt(index).monster) {
      exclude.push(index);
      monsterExits.push(index);
	}
  },
  magicCircleNeighbor: function(map, index) {	
    var indices = map.cellIndicesAt(index);

    if (indices.hasTop && monsters.cellMagicCircle(map, indices.top)) return indices.top;
    else if (indices.hasBottom && monsters.cellMagicCircle(map, indices.bottom)) return indices.bottom;
    else if (indices.hasLeft && monsters.cellMagicCircle(map, indices.left)) return indices.left;
    else if (indices.hasRight && monsters.cellMagicCircle(map, indices.right)) return indices.right;
  },
  setExitsForCell: function(map, index, exits, exclude) {
	exclude = exclude || [index];
    var indices = map.cellIndicesAt(index);
    var monsterExits = [];

    if (indices.hasTop) monsters.pushIfEmptyOrMonster(map, indices.top, exits, monsterExits, exclude);
    if (indices.hasBottom) monsters.pushIfEmptyOrMonster(map, indices.bottom, exits, monsterExits, exclude);
    if (indices.hasLeft) monsters.pushIfEmptyOrMonster(map, indices.left, exits, monsterExits, exclude);
    if (indices.hasRight) monsters.pushIfEmptyOrMonster(map, indices.right, exits, monsterExits, exclude);

    for (var i = 0; i < monsterExits.length; i++) {
      monsters.setExitsForCell(map, monsterExits[i], exits, exclude);
    }
    return exits;
  },

  trapMonster: function(map, tileList, index) {
    var exits = [];

    monsters.setExitsForCell(map, index, exits);
    var isTrapped = exits.length < 1;

console.log("monster exits === "+JSON.stringify(exits));
    if (isTrapped) {
      var tile = monsters.trappedTile(tileList);
		console.log("trapped with exits "+JSON.stringify(exits)+' tile = '+JSON.stringify(tile))
      if (tile) return tile;
    }
  },
  trapMonsters: function(map, index) {
  },

  moveMonster: function(map, index) {
    var indices = map.cellIndicesAt(index);
    var candidates = [];

    if (indices.hasTop && map.cellAt(indices.top).empty) candidates.push(indices.top);
    if (indices.hasBottom && map.cellAt(indices.bottom).empty) candidates.push(indices.bottom);
    if (indices.hasLeft && map.cellAt(indices.left).empty) candidates.push(indices.left);
    if (indices.hasRight && map.cellAt(indices.right).empty) candidates.push(indices.right);

    if (candidates.length < 1) return;

    var rand = Math.floor(Math.random() * candidates.length);
    var fromToTuple = [index, candidates[rand]];

    map.cells[fromToTuple[1]].tileId = map.cells[fromToTuple[0]].tileId;
    map.cells[fromToTuple[0]].tileId = null;

    return fromToTuple;
  },
  move: function(map, tileList, index) {
    index = parseInt(index);
    var indices = monsters.monsterIndices(map);
console.log("move monsters for indices = "+JSON.stringify(indices)+" with current index "+index+" = "+JSON.stringify(map.tileAt(index)))
    if (indices.length < 1) return;

    // moves
    var moving = false;
    var movement = {moves: []};
    do {
      moving = false;
      for (var i = indices.length - 1; i >= 0; i--) {
        if (parseInt(indices[i]) === index) continue;

        var fromToTuple = monsters.moveMonster(map, indices[i]);
        if (fromToTuple) {
          moving = true;
	      indices.splice(i,1);
          movement.moves.push(fromToTuple);
	    }
      }
    } while (moving);

    // traps
    var trapped = [];
    for (var i = 0; i < indices.length; i++) {
      if (parseInt(indices[i]) === index) continue;

      var tile = monsters.trapMonster(map, tileList, indices[i]);
console.log('updating trapped cell '+JSON.stringify(map.cells[indices[i]]))

      if (tile) {
        var trap = {tile: tile, index: indices[i]};
        trapped.push(trap)
        map.cells[indices[i]].tileId = tile._id;
      }

console.log('updated trapped cell '+JSON.stringify(map.cells[indices[i]]))
console.log(indices[i]+' '+' with '+JSON.stringify(tile))

    }

    var tile = map.tileAt(index);
    var placedMonsterTile = tile && tile.monster;
console.log("placedMonsterTile? "+placedMonsterTile)
    if (placedMonsterTile) { 
      tile = monsters.trapMonster(map, tileList, index);
      if (tile) {
        var trap = {tile: tile.compressed, index: index};
        trapped.push(trap)
        map.cells[index].tileId = tile._id;
      }
    }
	
	if (trapped.length > 0) {
      movement.trapped = {matches: trapped};

      var indices = map.cellIndicesAt(index);
console.log("emplacement index = "+JSON.stringify(index)+" indices are "+JSON.stringify(indices))
      var upgradeIndex = null;
      for (var i = 0; i < trapped.length; i++) {
        if (placedMonsterTile) upgradeIndex = indices.center;
        else if (indices.hasTop && trapped[i].index === indices.top) upgradeIndex = indices.top
        else if (indices.hasLeft && trapped[i].index === indices.left) upgradeIndex = indices.left;
        else if (indices.hasBottom && trapped[i].index === indices.bottom) upgradeIndex = indices.bottom;
        else if (indices.hasRight && trapped[i].index === indices.right) upgradeIndex = indices.right;
        if (upgradeIndex) break;
      }

      var matched = map.match(upgradeIndex);
console.log("MONSTER MATCHES (idx = "+upgradeIndex+") "+JSON.stringify(matched));
      if (matched.matches.length >= 3) {
        matched.index = upgradeIndex;
	    matched.points = map.awardPoints(matched);
        movement.upgraded = matched;
      }
      
    }

    // summonings
    var summonings = [];
    for (var i = 0; i < movement.moves.length; i++) {
      var destinationIndex = movement.moves[i][1];
      if (map.tileAt(destinationIndex).name === 'Cats of Ulthar') continue; // cats don't enter magic circles
	
      var circle = monsters.magicCircleNeighbor(map, destinationIndex);
      if (circle) {
        var tileUpgrade = map.tileAt(destinationIndex).nextUpgrade();
		console.log("GOT CIRCLE!!!! Upgrade to: "+JSON.stringify(tileUpgrade))
        if (!tileUpgrade) continue;

        var emptyCells = [];
        for (var c = 0; c < map.cells.length; c++) {
          if (!map.cells[c].tileId) {
            var exits = [];
            monsters.setExitsForCell(map, c, exits);
            if (exits.length > 1) emptyCells.push(c);
          }
        }
        if (emptyCells.length < 1) break;

        var rand = Math.floor(Math.random() * emptyCells.length);
        var summonIndex = emptyCells[rand];
        movement.moves[i].push(summonIndex);

	    map.cells[summonIndex].tileId = tileUpgrade._id;
	    map.cells[destinationIndex].tileId = null;

        var summoning = tileUpgrade.compressed;
        summoning.move = [destinationIndex,summonIndex];
        summonings.push(summoning);
        console.log(JSON.stringify(summoning))
      }
    }
    if (summonings.length > 0) movement.summonings = summonings;

    // cats of ulthar
    var removed = [];
    var blessed = [];
    function isKillableAt(targetIndex) {
      var tile = map.tileAt(targetIndex);
      return tile && tile.monster && tile.name !== 'Cats of Ulthar' && targetIndex !== index ? true : false;
    }
    function isCursedAt(targetIndex) {
      return map.cells[targetIndex].tileId && map.cells[targetIndex].cursed ? true : false;
	}
    function bless(targetIndex) {	
      map.cells[targetIndex].cursed = null;
      blessed.push(targetIndex);
    }
	
    for (var i = 0; i < movement.moves.length; i++) {
      var move = movement.moves[i];
      var destinationIndex = move.length === 3 ? move[2] : move[1]; // if summoned
      var tile = map.tileAt(destinationIndex);
      if (tile.name === 'Cats of Ulthar') {	
        var indices = map.cellIndicesAt(destinationIndex);
        if (indices.hasTop) {
          if (isKillableAt(indices.top)) removed.push(indices.top);
          else if (isCursedAt(indices.top)) bless(indices.top);
        }
        if (indices.hasLeft) {
          if (isKillableAt(indices.left)) removed.push(indices.left);
          else if (isCursedAt(indices.left)) bless(indices.left);
        }
        if (indices.hasRight) {
          if (isKillableAt(indices.right)) removed.push(indices.right);
          else if (isCursedAt(indices.right)) bless(indices.right);
        }
        if (indices.hasBottom) {
          if (isKillableAt(indices.bottom)) removed.push(indices.bottom);
          else if (isCursedAt(indices.bottom)) bless(indices.bottom);
        }

	    console.log("moving cats, removed "+JSON.stringify(removed)+' from indices '+JSON.stringify(indices))
      }
    }
    if (blessed.length > 0) movement.blessings = blessed;
    if (removed.length > 0) {
      for (var i = 0; i < removed.length; i++) map.cells[removed[i]].tileId = null;
      movement.removed = removed;
    }

    console.log('move '+JSON.stringify(movement))
    return movement;
  }
}

module.exports = monsters;
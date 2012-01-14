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

    console.log('move '+JSON.stringify(movement))
    return movement;
  }
}

module.exports = monsters;
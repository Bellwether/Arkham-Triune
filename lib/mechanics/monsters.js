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
  exitsForCell: function(map, index, exits, exclude) {
	exclude = exclude || [index];
    var indices = map.cellIndicesAt(index);
    var monsterExits = [];

    if (indices.hasTop) monsters.pushIfEmptyOrMonster(map, indices.top, exits, monsterExits, exclude);
    if (indices.hasBottom) monsters.pushIfEmptyOrMonster(map, indices.bottom, exits, monsterExits, exclude);
    if (indices.hasLeft) monsters.pushIfEmptyOrMonster(map, indices.left, exits, monsterExits, exclude);
    if (indices.hasRight) monsters.pushIfEmptyOrMonster(map, indices.right, exits, monsterExits, exclude);

    for (var i = 0; i < monsterExits.length; i++) {
      monsters.exitsForCell(map, monsterExits[i], exits, exclude);
    }
    return exits;
  },

  trapMonster: function(map, tileList, index) {
    var indices = map.cellIndicesAt(index);
    var exits = [];

    monsters.exitsForCell(map, index, exits);
    var isTrapped = exits.length < 1;

console.log("monster exits === "+JSON.stringify(exits));
    if (isTrapped) {
      var tile = monsters.trappedTile(tileList);
		console.log("trapped with exits "+JSON.stringify(exits)+' tile = '+JSON.stringify(tile))
      if (tile) return tile;
    }
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
    if (trapped.length > 0) movement.trapped = trapped;

    console.log('move '+JSON.stringify(movement))
    return movement;
  }
}

module.exports = monsters;
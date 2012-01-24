var monsters = {
  hasExit: function(map, index, scannedIndices) {	
    var cell = map.cellAt(index);
    var hasExit = false;
    cell.neighbors.forEach(function(i) {
      if (!map.cells[i].tileId) {
        hasExit = true;
      } else if (scannedIndices.indexOf(i) > -1) {
        // ignore
      } else if (map.tileAt(i).monster) {
        scannedIndices.push(i);
        if (monsters.hasExit(map, i, scannedIndices)) hasExit = true;
      };
    });
    return hasExit;
  },
  exits: function(map, cell) {
    return cell.neighbors.filter(function(index) {
      var tile = map.tileAt(index);
      return !tile || tile.group === 'monster';
    })
  },
  canabalize: function(map, turn) {
    var indices = map.cellsByGroup('monster');
    indices.forEach(function(i) {
      if (map.tileAt(i).summoningMonster) {
      }
    });	
  },
  summon: function(map, turn) {
    var indices = map.cellsByGroup('monster');
    indices.forEach(function(i) {
      if (map.tileAt(i).summoningMonster) {
        var rand = Math.floor(Math.random() * 100);
        var summoningChance = 25; 
        if (rand < summoningChance) {
          var neighbors = map.cellAt(i).neighbors; 
          var cells = indices.filter(function(c) {
	        return monsters.exits(map, map.cells[c]).length > 0;
          })
          if (cells.length > 0) {
            rand = Math.floor(Math.random() * cells.length);
            var monster = tile.Model.findByName("Cultist");
            map.cells[ cells[rand] ].tileId = monster._id;
            turn.addSummoning((cells[rand], monster));
          }
        }
      };
    });
  },
  trapMonster: function(map, turn, index) {
    if (!map.tileAt(index).trapableMonster) return;

    var tile = map.trap(index);
    turn.addTrap(index, tile);
  },
  trap: function(map, turn) {
    var indices = map.cellsByGroup('monster');
    
    indices.forEach(function(i) {
      var cells = [i];
      if (!monsters.hasExit(map, i, cells)) {
        console.log('does not have exit for monster on idx '+i+' '+monsters.hasExit(map, i, cells))
        monsters.trapMonster(map, turn, i);
      };
    });

    if (turn.trapped.traps.length > 0) {
      var placedTileTrapped = turn.trapped.traps.indexOf(turn.index) > -1;
      var matchIndex = placedTileTrapped ? turn.index : turn.trapped.traps[0];
      var matches = [];
      map.matchRepeat(matches, matchIndex);

      if (matches.length) {
        matches.forEach(function(match) {
          map.upgradeTurnMatch(match);
          turn.addTrapMatch(match);
        });
        turn.setRewardsFromTrapped();
      };
    }

  },
  bless: function(map, index) {	
    var neighbors = [];
    map.cellAt(index).neighbors.forEach(function(neighbor) { 
      if (map.cells[neighbor].tileId && map.tileAt(neighbor).landscape && map.cells[neighbor].cursed) {
        neighbors.push(neighbor);
      }
    })
    if (neighbors.length > 0) {
      var rand = Math.floor(Math.random() * neighbors.length);
      map.cells[neighbors[rand]] = {tileId: map.cells[neighbors[rand]].tileId}; // remove cursed field
      return neighbors[rand];
    } else {
      return null;
    }
  },
  curse: function(map, index) {	
    var neighbors = [];
    map.cellAt(index).neighbors.forEach(function(neighbor) { 
      if (map.cells[neighbor].tileId && map.tileAt(neighbor).landscape) {
        neighbors.push(neighbor);
      }
    })
    if (neighbors.length > 0) {
      var rand = Math.floor(Math.random() * neighbors.length);
      map.cells[neighbors[rand]].cursed = true;
      return neighbors[rand];
    } else {
      return null;
    }
  },
  enchant: function(map, turn) {
    var indices = map.cellsByGroup('monster');
    indices.forEach(function(i) {
      if (map.tileAt(i).cursingMonster) {
        var cursedIndex = monsters.curse(map, i);
        if (cursedIndex) turn.enchanted.cursed.push(cursedIndex);
      } else if (map.tileAt(i).helpingMonster) {
        var blessedIndex = monsters.bless(map, i);
        if (blessedIndex) turn.enchanted.blessed.push(blessedIndex);
      }
    });
  },
  upgradeMonster: function(map, index) {
    var upgradedMonster = map.tileAt(index).nextUpgrade();
    if (upgradedMonster) map.cells[index].tileId = upgradedMonster._id;
    return upgradedMonster;
  },
  transport: function(map, turn) {
    var indices = map.cellsByGroup('monster');

    function isSummoningCircle(index) {
      var tile = map.tileAt(index);
      return tile ? tile.summoning : false
    }
    function isExitable(index) {
      var neighbors = map.cellAt(index).neighbors;
      var isExitable = false;
      neighbors.forEach(function(i) {  
        if (!map.cells[i].tileId) {
          isExitable = true;
          return;
        }
      })
      return isExitable;
    }
	
    indices.forEach(function(index) {
      if (map.tileAt(index).transportableMonster) {
        if (map.cellAt(index).neighbors.some(isSummoningCircle)) {
          var cells = map.emptyCells();
          var exitableCells = [];
          cells.forEach(function(cell) {  
            if (isExitable(cell)) exitableCells.push(cell);
          })
          var path = monsters.moveToRandom(map, exitableCells, index);

		  console.log("TRANSPORTING!!!!!!!! "+JSON.stringify(path))
          if (path) {
            var destination = path[path.length -1];
            var upgrade = monsters.upgradeMonster(map, destination);
            turn.addTransport(path, upgrade);
          }
        }
      }
    });
  },
  moveToRandom: function(map, cells, index) {
    if (cells.length < 1) return;
	
    var rand = Math.floor(Math.random() * cells.length);    
    var path = [index, cells[rand]];

    map.cells[path[1]].tileId = map.cells[path[0]].tileId;
    map.cells[path[0]].tileId = null;
    return path;	
  },
  warpMonster: function(map, index) {
    var indices = map.emptyCells();
    var cells = indices.filter(function(i) {
      return monsters.exits(map, map.cells[i]).length > 0;
    })

    return monsters.moveToRandom(map, cells, index);
  },
  moveMonster: function(map, index) {
    if (map.tileAt(index).warpingMonster) return monsters.warpMonster(map, index);
	
    var cells = map.cellAt(index).emptyNeighbors(map.cells);
    return monsters.moveToRandom(map, cells, index);
  },
  move: function(map, turn) {
   var indices = map.cellsByGroup('monster');
   var moving = false;
   do {
     moving = false;
     for (var i = indices.length - 1; i >= 0; i--) {
       if (parseInt(indices[i]) === turn.index) continue;

       var path = monsters.moveMonster(map, indices[i]);
       if (path) {
         moving = true;
         indices.splice(i,1);
         turn.addMove(path);
	    }
     }
   } while (moving);
  },
  act: function(map, turn) {
    monsters.move(map, turn);
    monsters.trap(map, turn);
    monsters.transport(map, turn);
    // monsters.summon(map, turn);
    monsters.enchant(map, turn);
    monsters.canabalize(map, turn);
  },
	
// 
//     // summonings
//     var summonings = [];
//     for (var i = 0; i < movement.moves.length; i++) {
//       var destinationIndex = movement.moves[i][1];
//       if (map.tileAt(destinationIndex).name === 'Cats of Ulthar') continue; // cats don't enter magic circles
// 	
//       var circle = monsters.magicCircleNeighbor(map, destinationIndex);
//       if (circle) {
//         var tileUpgrade = map.tileAt(destinationIndex).nextUpgrade();
// 		console.log("GOT CIRCLE!!!! Upgrade to: "+JSON.stringify(tileUpgrade))
//         if (!tileUpgrade) continue;
// 
//         var emptyCells = [];
//         for (var c = 0; c < map.cells.length; c++) {
//           if (!map.cells[c].tileId) {
//             var exits = [];
//             monsters.setExitsForCell(map, c, exits);
//             if (exits.length > 1) emptyCells.push(c);
//           }
//         }
//         if (emptyCells.length < 1) break;
// 
//         var rand = Math.floor(Math.random() * emptyCells.length);
//         var summonIndex = emptyCells[rand];
//         movement.moves[i].push(summonIndex);
// 
// 	    map.cells[summonIndex].tileId = tileUpgrade._id;
// 	    map.cells[destinationIndex].tileId = null;
// 
//         var summoning = tileUpgrade.compressed;
//         summoning.move = [destinationIndex,summonIndex];
//         summonings.push(summoning);
//         console.log(JSON.stringify(summoning))
//       }
//     }
//     if (summonings.length > 0) movement.summonings = summonings;
// 
//     // cats of ulthar
//     var removed = [];
//     var blessed = [];
//     function isKillableAt(targetIndex) {
//       var tile = map.tileAt(targetIndex);
//       return tile && tile.monster && tile.name !== 'Cats of Ulthar' && targetIndex !== index ? true : false;
//     }
//     function isCursedAt(targetIndex) {
//       return map.cells[targetIndex].tileId && map.cells[targetIndex].cursed ? true : false;
// 	}
//     function bless(targetIndex) {	
//       map.cells[targetIndex].cursed = null;
//       blessed.push(targetIndex);
//     }
// 	
//     for (var i = 0; i < movement.moves.length; i++) {
//       var move = movement.moves[i];
//       var destinationIndex = move.length === 3 ? move[2] : move[1]; // if summoned
//       var tile = map.tileAt(destinationIndex);
//       if (tile.name === 'Cats of Ulthar') {	
//         var indices = map.cellIndicesAt(destinationIndex);
//         if (indices.hasTop) {
//           if (isKillableAt(indices.top)) removed.push(indices.top);
//           else if (isCursedAt(indices.top)) bless(indices.top);
//         }
//         if (indices.hasLeft) {
//           if (isKillableAt(indices.left)) removed.push(indices.left);
//           else if (isCursedAt(indices.left)) bless(indices.left);
//         }
//         if (indices.hasRight) {
//           if (isKillableAt(indices.right)) removed.push(indices.right);
//           else if (isCursedAt(indices.right)) bless(indices.right);
//         }
//         if (indices.hasBottom) {
//           if (isKillableAt(indices.bottom)) removed.push(indices.bottom);
//           else if (isCursedAt(indices.bottom)) bless(indices.bottom);
//         }
// 
// 	    console.log("moving cats, removed "+JSON.stringify(removed)+' from indices '+JSON.stringify(indices))
//       }
//     }
//     if (blessed.length > 0) movement.blessings = blessed;
//     if (removed.length > 0) {
//       for (var i = 0; i < removed.length; i++) map.cells[removed[i]].tileId = null;
//       movement.removed = removed;
//     }
// 
//     console.log('move '+JSON.stringify(movement))
//     return movement;
//   }
}

module.exports = monsters;
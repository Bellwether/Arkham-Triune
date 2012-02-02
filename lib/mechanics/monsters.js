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
    var canabalized = [];
    var canabalizeChance = 75;

    function filterCanabalizable(i) {
      return canabalized.indexOf(i) < 0 &&
             map.cells[i].tileId && 
             map.tileAt(i).monster && 
             !map.tileAt(i).helpingMonster;
    }

    indices.forEach(function(i) {
      if (map.tileAt(i).helpingMonster) {	
        var neighbors = map.cellAt(i).neighbors; 
        var cells = neighbors.filter(filterCanabalizable);

        if (cells.length > 0) {
          var rand = Math.floor(Math.random() * 100);
          if (rand < canabalizeChance) {
            rand = Math.floor(Math.random() * cells.length);
            canabalized.push(cells[rand]);
          };
        }
      }
    });

    canabalized.forEach(function(i) {
      turn.addCanabalized(i);
      map.cells[i].tileId = null;
    });	
  },
  summon: function(map, turn) {
    var indices = map.cellsByGroup('monster');	
    var summoningChance = 25;

    indices.forEach(function(i) {
      if (map.tileAt(i).summoningMonster) {
        var rand = Math.floor(Math.random() * 100);
        if (rand < summoningChance) {
          var neighbors = map.cellAt(i).neighbors; 
          var cells = neighbors.filter(function(c) {
	        return !map.cells[c].tileId && monsters.exits(map, map.cellAt(c)).length > 0;
          })
          if (cells.length > 0) {
            rand = Math.floor(Math.random() * cells.length);
            var monster = map.Tile.findByName("Cultist");
            map.cells[ cells[rand] ].tileId = monster._id;
            turn.addSummoning(cells[rand], monster);
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
        turn.setRewardsFromTrapped(map.rewarder);
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
      // remove cursed field
      map.cells[neighbors[rand]] = {tileId: map.cells[neighbors[rand]].tileId}; 
      return neighbors[rand];
    } else {
      return null;
    }
  },
  curse: function(map, index) {	
    var curseChance = 30;
    var rand = Math.floor(Math.random() * 100);
    if (rand > curseChance) return null;

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
	
    var transportChance = 30;
    indices.forEach(function(index) {
      if (map.tileAt(index).transportableMonster) {
        if (map.cellAt(index).neighbors.some(isSummoningCircle)) {
          var rand = Math.floor(Math.random() * 100);
          if (rand < transportChance) {
            var cells = map.emptyCells();
            var exitableCells = [];
            cells.forEach(function(cell) {  
              if (isExitable(cell)) exitableCells.push(cell);
            })
            var path = monsters.moveToRandom(map, exitableCells, index);
            if (path) {
              var destination = path[path.length -1];
              var upgrade = monsters.upgradeMonster(map, destination);
              turn.addTransport(path, upgrade);
            }
          }
        };
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
    monsters.summon(map, turn);
    monsters.enchant(map, turn);
    monsters.canabalize(map, turn);
  }
}

module.exports = monsters;
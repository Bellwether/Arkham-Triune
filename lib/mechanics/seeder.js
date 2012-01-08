var seeder = {
  pick: function(tileList) {
    var candidates = [];
    for (var i = 0; i < tileList.length; i++) {
      if (tileList[i].seedable) candidates.push(tileList[i]);
    } 
    var rand = Math.floor(Math.random() * candidates.length);
    return candidates[rand];
  },
  splice: function(index, candidates) {	
    for (var i = 0; i < candidates.length; i++) {
      if (candidates[i] === index) {
        candidates.splice(i, 1);
        break;
      }
    }
  },
  isolate: function(map, index, candidates) { 
    var hasTopNeighbor = index >= map.size;
    var hasBottomNeighbor = index <= map.cells.length - map.size;
    var hasLeftNeighbor = index % map.size !== 0;
    var hasRightNeighbor = index % map.size !== map.size-1;
	
    if (hasTopNeighbor) seeder.splice(index - map.size, candidates);
    if (hasBottomNeighbor) seeder.splice(index + map.size, candidates);
    if (hasLeftNeighbor) seeder.splice(index - 1, candidates);
    if (hasRightNeighbor) seeder.splice(index + 1, candidates);
  },
  emplace: function(map, index, candidates) { 
    seeder.splice(index, candidates);
    seeder.isolate(map, index, candidates);
  },
  populate: function(map, tileList) {
    var candidates = [];
    for (var i = 0; i < map.cells.length; i++) candidates.push(i);

    var startingTiles = 6;
    for (var t = 0; t < startingTiles; t++) {
      if (candidates.length < 1) break;

      var rand = Math.floor(Math.random() * candidates.length);
      var index = candidates[rand];
      seeder.emplace(map, index, candidates);

      map.cells[index].tileId = seeder.pick(tileList)._id;
    }
  }
}

module.exports = seeder;
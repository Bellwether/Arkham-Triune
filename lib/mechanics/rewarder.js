var rewarder = {
  matchAward: function(map, index, awards) {	
    var tileId = map.cells[index].tileId;
    awards[tileId] = awards[tileId] || {count: 0, index: null};
    awards[tileId].count = awards[tileId].count + 1;
    awards[tileId].index = index;
  },
  points: function(map, matchAward) {
    var count = matchAward.count;
    var tile = map.tileAt(matchAward.index);
    return tile ? tile.matchPoints(count) : 0;
  },
  award: function(map, matches) { 
    var awards = {};
console.log('rewarder award match len = ' +matches.length)
    for (var i = 0; i < matches.length; i++) {
      rewarder.matchAward(map, matches[i], awards);
    }

    var points = 0;
    for (var tileId in awards) {
      points = points + rewarder.points(map, awards[tileId]);
		console.log('match points ('+JSON.stringify(awards[tileId])+') for '+tileId+' points are '+points);
    }
    return points;
  }
}

module.exports = rewarder;
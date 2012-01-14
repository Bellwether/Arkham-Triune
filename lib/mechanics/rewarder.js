var rewarder = {
  matchAward: function(map, index, awards) {	
    var tileId = map.cells[index].tileId;
    awards[tileId] = awards[tileId] || {count: 0, index: null};
    awards[tileId].count = awards[tileId].count + 1;
    awards[tileId].index = index;
  },
  wisdom: function(points) {
    if (points > 1500) {
      return 50;
    } else if (points > 1000) {
      return 25;
    } else if (points > 750) {
      return 20;
    } else if (points > 500) {
      return 15;	
    } else if (points > 300) {
      return 10;	
    } else if (points > 150) {
      return 5;	
	} else {
      return 0;
	}
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
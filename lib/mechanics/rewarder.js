var rewarder = {
  matchMultiplierPoints: function(matches) {
    return matches.length > 1 ? (matches.length -1) * 100 : 0;
  },
  mapAward: function(map) {
    var tileAward = 0;
    for (var i = 0; i < map.cells.length; i++) {
      var tile = map.tileAt(i);
      var isAwardableTile= tile && tile.level > 1 && tile.landscape ? true : false;
      if (isAwardableTile) {
        tileAward = tileAward + (5 ^ tile.level);
      }
    }
    var scoreAward = parseInt(map.score / 100);
    return (tileAward + scoreAward) / 2;
  },
  wisdom: function(points) {
	console.log('wisdom for points '+points)
    if (points > 1500) {
      return 50;
    } else if (points > 1000) {
      return 25;
    } else if (points > 750) {
      return 20;
    } else if (points > 500) {
      return 15;	
    } else if (points > 250) {
      return 10;	
    } else if (points > 100) {
      return 5;	
	} else {
      return 0;
	}
  },
  points: function(map, match) {
    var count = match.matchLength;
    var tile = map.tileAt(match.index);
	console.log('points for '+JSON.stringify(match) + ', count = '+count+ ' tile ='+(tile ? tile.name+' '+tile.matchPoints(count)+'pts' : tile))
    return tile ? tile.matchPoints(count) : 0;
  }
}

module.exports = rewarder;
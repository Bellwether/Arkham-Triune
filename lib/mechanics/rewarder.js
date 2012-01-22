var rewarder = {
  wisdom: function(points) {
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
var dealer = {
  pushCandidates: function(candidates, weight, index) { 
    for (w = 0; w < weight; w++) {
      candidates.push(index);
    }
  },
  deal: function(tileList, move) {
    var candidates = [];
    for (var i = 0; i < tileList.length; i++) {
      var weight = tileList[i].weight; 
      var isAvailable = move >= tileList[i].move; 
      if (weight && isAvailable) {
        dealer.pushCandidates(candidates, weight, i);
      }
    } 
    var rand = Math.floor(Math.random() * candidates.length);
    var index = candidates[rand];
    return tileList[index];
  }
}

module.exports = dealer;
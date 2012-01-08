var dealer = {
  pushCandidates: function(candidates, weight, index) { 
    for (w = 0; w < weight; w++) {
      candidates.push(index);
    }
  },
  deal: function(tileList) {
    var candidates = [];
    for (var i = 0; i < tileList.length; i++) {
      var weight = tileList[i].weight; 
      if (weight) {
        dealer.pushCandidates(candidates, weight, i);
      }
    } 
    var rand = Math.floor(Math.random() * candidates.length);
    var index = candidates[rand];
    return tileList[index];
  }
}

module.exports = dealer;
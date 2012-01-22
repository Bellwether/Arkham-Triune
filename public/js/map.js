(function ($) {
  $.Moves = function(map, options) {
    this.map = map;
    this.moves = $('#'+options.movesElemId);
  }	
  $.Moves.prototype.label = function label() {
    return this.moves.find('.ui-btn-text');
  }
  $.Moves.prototype.text = function text(val) {
    if (val) {
      var current = parseInt(this.text());
      var updated = current + parseInt(val);
      (this.label() || this.moves).html(updated);
    } else {
      return this.label() ? this.label().html() : this.moves.html();
    }
  }
	
  $.Score = function(map, options) {
    this.map = map;
    this.score = $('#'+options.scoreElemId);
  }
  $.Score.prototype.label = function label() {
    return this.score.find('.ui-btn-text');
  }
  $.Score.prototype.text = function text(val) {
    if (val) {
      var current = parseInt(this.text());
      var updated = current + parseInt(val);
      (this.label() || this.score).html(updated);
    } else {
      return this.label() ? this.label().html() : this.score.html();
    }
  }

  $.SuspendedTile = function(map, options) {	
    this.map = map;
    this.tile = $('#'+options.suspendedTileElemId);
    this.container = this.tile.parents('.ui-radio');

    this.active = true;

    var self = this;
    this.container.removeClass('ui-disabled');

    this.container.click(function(e) {
      if (!self.active) return;

      self.container.addClass('ui-disabled');
      self.active = false;
      map.deactivate();

      map.suspended(function(data, textStatus) {
        if (data && data.suspended) {
          self.text(data.suspended.name);
          self.map.nextTile.text(data.next.name);
        }
	    self.container.removeClass('ui-disabled');
        self.active = true;
        map.activate();
      })
      return false;  
    })
  }
  $.SuspendedTile.prototype.isEmpty = function isEmpty() {
    return this.text().replace(' ','').replace('.','').length > 0;
  }
  $.SuspendedTile.prototype.label = function label() {
    return this.tile.find('.ui-btn-text');
  }
  $.SuspendedTile.prototype.text = function text(val) {
    if (val) {
      (this.label() || this.tile).html(val);
    } else {
      return this.label() ? this.label().html() : this.tile.html();
    }
  }
	
  $.NextTile = function(map, options) {	
    this.map = map;
    this.tile = $('#'+options.nextTileElemId);
  }	
  $.NextTile.prototype.label = function label() {
    return this.tile.find('.ui-btn-text');
  }
  $.NextTile.prototype.text = function text(val) {
    if (val) {
      (this.label() || this.tile).html(val);
    } else {
      return this.label() ? this.label().html() : this.tile.html();
    }
  }
	
  $.MapCell = function(map, cell, index) {
    this.map = map;
    this.cell = cell;
    this.tile = cell.children('.tile');
    this.index = index;
    this.active = false;
    this.selected = false;
  }
  $.MapCell.prototype.isEmpty = function isEmpty() {
    return this.tile.is('.empty');
  }
  $.MapCell.prototype.activate = function activate() {
    this.active = true;
    var panel = $("<div class='slot'></div>");
    var self = this;
    panel.bind("mouseover", function() { 
	  self.select();
    });
    panel.bind("mouseout", function() { 
	  self.deselect();
    });
    panel.bind("vclick", function() {
      if (self.selected) {
        self.map.emplace(self);
      } else {
        self.select();
      }
    });

    this.cell.prepend(panel);
    this.slot = panel;
  }
  $.MapCell.prototype.empty = function empty() { 
    this.tile.attr('class', 'tile empty');
    this.tile.html('[x]');
    this.originalText = '[x]';
  }
  $.MapCell.prototype.deactivate = function deactivate() {
    this.active = false;
    this.slot.remove();	
    this.slot = null;
  }
  $.MapCell.prototype.select = function select() {
    if (this.selected) return;

    this.selected = true;
    this.originalText = this.tile.html();
    this.tile.html(this.map.nextTile.text());
  }
  $.MapCell.prototype.deselect = function deselect() {
    if (!this.selected) return;

    this.selected = false;
    this.tile.html(this.originalText);
    this.originalText = null;
  }
  $.MapCell.prototype.emplace = function emplace(tile) {	
    this.tile.removeClass('empty');
    this.tile.addClass(tile.name.replace(/\s/,'-'));
    this.tile.html(tile.name);
    this.originalText = tile.name;
  }
  $.MapCell.prototype.bless = function bless() {
    this.tile.removeClass('cursed');
  }
  $.MapCell.prototype.curse = function curse() {
    this.tile.addClass('cursed');	
  }
  $.MapCell.prototype.update = function update(classAttr, text) {	
    this.tile.attr('class', classAttr);
    this.tile.html(text);
    this.originalText = text;
  }

  $.fn.Map = function(options) {
    options = options || {};
    var map = $(this);
    if (!map.length) return false;

    map.nextTile = new $.NextTile(map, options);
    map.suspendedTile = new $.SuspendedTile(map, options);
    map.grid = $('#'+options.gridElemId);
    map.score = new $.Score(map, options);
    map.moves = new $.Moves(map, options);

    map.input = map.find('input[name="index"]');
    map.active = false;
    map.cells = [];

    map.grid.find('td').each(function(index) {
      var cell = new $.MapCell(map, $(this), index);
      map.cells.push(cell);
    });

    map.match = function match(index, matched) {
      if (!matched.upgrade) return;

      for (var i = 0; i < matched.matches.length; i++) {
        map.cells[matched.matches[i]].empty();
      }
      map.cells[index].emplace(matched.upgrade);
    }
    map.suspended = function suspended(callback) {
      if (map.nextTile.text() === map.suspendedTile.text()) callback();

      $.sendRequest({
        url: map.attr('action'),
        data: {suspended: true},
      }, callback);
    }

    map.moveCell = function moveCell(from, to) {	
      var mover = map.cells[from];
      var target = map.cells[to];
      var moverClass = mover.tile.attr('class');
      var targetClass = target.tile.attr('class');
      var moverText = mover.tile.html();
      var targetText = target.tile.html();
  
      mover.update(targetClass, targetText);
      target.update(moverClass, moverText);
    }	
    map.isRemoving = function isRemoving() {	
      var title = map.nextTile.text();
      return title.indexOf('Elder Sign') > -1;	
    }
    map.isTargetingMagic = function isTargetingMagic() {
      var title = map.nextTile.text();
      return title.indexOf('Elder Sign') > -1 ||
             title.indexOf('Mythos Tome') > -1;	
    };
    map.isUsingMagic = function isUsingMagic() {
      var title = map.nextTile.text();
      return title.indexOf('Elder Sign') > -1 ||
             title.indexOf('Mythos Tome') > -1;
             title.indexOf('Silver Key') > -1;
    }	
    map.emplace = function emplace(cell) {
      map.deactivate();
      map.input.val(cell.index);

      function onPlacement(data, textStatus) {
        console.log(JSON.stringify(textStatus)+' '+JSON.stringify(data))

        // if (data.tile) { // general success
        //   if (map.isUsingMagic()) {
        //     cell.empty();
        //   } else { 
        //     cell.emplace({name: map.nextTile.text()}); // place tile
        //   }
        //   map.nextTile.text(data.tile.name);
        //   map.moves.text(1);
        // }
        // if (data.matched) {
        //   map.match(cell.index, data.matched);
        // 
        //   if (data.matched.points) {
        //     map.score.text(data.matched.points);
        //   }
        // }
        // if (data.matched && data.matched.placedTile) {
        //   cell.emplace(data.matched.placedTile);
        // }
        // if (data.monsters) {
        //   if (data.monsters.trapped) {
        //     var monsters = data.monsters.trapped.matches;
        //     for (var i = 0; i < monsters.length; i++) {
        //       var tile = monsters[i].tile;
        //       map.cells[monsters[i].index].update(tile.name.replace(' ','-'), tile.name);
        //     }
        //   }
        //   if (data.monsters.upgraded) {
        //     map.match(data.monsters.upgraded.index, data.monsters.upgraded);
        //   }
        // }
        // if (data.monsters && data.monsters.moves) {
        //   for (var i = 0; i < data.monsters.moves.length; i++) {
        //     var fromToTuple = data.monsters.moves[i];
        //     var mover = map.cells[fromToTuple[0]];
        //     var target = map.cells[fromToTuple[1]];
        //     var moverClass = mover.tile.attr('class');
        //     var targetClass = target.tile.attr('class');
        //     var moverText = mover.tile.html();
        //     var targetText = target.tile.html();
        // 
        //     mover.update(targetClass, targetText);
        //     target.update(moverClass, moverText);
        //   }
        // }
        // if (data.monsters && data.monsters.summonings) {
        //   console.log(JSON.stringify(data.monsters.summonings));
        //   for (var i = 0; i < data.monsters.summonings.length; i++) {
        //     var summoning = data.monsters.summonings[i];
        //     map.cells[summoning.move[0]].empty();
        //     map.cells[summoning.move[1]].emplace({name: summoning.name});
        //   }
        // }
        // if (data.monsters && data.monsters.removed) {
        //   for (var i = 0; i < data.monsters.removed.length; i++) {
        //     map.cells[data.monsters.removed[i]].empty();
        //   }	
        // }
        // if (data.monsters && data.monsters.blessings) {
        //   for (var i = 0; i < data.monsters.blessings.length; i++) {
        //     map.cells[data.monsters.blessings[i]].bless();
        //   }	
        // }
        // if (data.removed) {
        //   for (var i = 0; i < data.removed.length; i++) {
        //     map.cells[data.removed[i]].update('tile empty', '[x]');
        //   }
        // };
        if (data.nextTile) {
          map.nextTile.text(data.nextTile.name);
        }
        if (data.placed) {
          var tile = data.placed.tile;
          if (tile) {
            map.moves.text(1);	
            cell.emplace(tile);
          } else {		
            cell.empty();
          }
        }
        if (data.matched) {
          for (var i = 0; i < data.matched.length; i++) {
            for (var j = 0; j < data.matched[i].cells.length; j++) {	
              map.cells[data.matched[i].cells[j]].empty();
            };
            map.cells[data.matched[i].index].emplace(data.matched[i].tile);
          }
        }
        if (data.points) {
          map.score.text(data.points);
        }
        if (data.wisdom) {
          map.wisdom.text(data.wisdom);
        }
        if (data.moved) {
          if (data.moved.moves) {
            for (var i = 0; i < data.moved.moves.length; i++) {
              var path = data.moved.moves[i].path;
              map.moveCell(path[0], path[1]);
            }
          }
        }
        if (data.trapped) {
          for (var i = 0; i < data.trapped.traps.length; i++) {
            map.cells[data.trapped.traps[i]].emplace(data.trapped.tile);
          }
        }
        if (data.removed) {
          for (var i = 0; i < data.removed.length; i++) {
            map.cells[data.removed[i]].empty();
          }
        }
        if (data.complete) {
          $.mobile.changePage(data.url, {
            transition: 'pop',
            reloadPage: true,
            role: 'dialog'
          });
          return;
        }
        map.activate();
      }

      $.sendRequest({
        url: map.attr('action'),
        data: {index: map.input.val()},
      }, onPlacement);
    }
    map.activate = function activate() {
      var parent = map.parent();
      var isRemoving = map.isRemoving();
      for (var i = 0; i < map.cells.length; i++) {
        if (map.isTargetingMagic() || map.cells[i].isEmpty()) map.cells[i].activate();
      }
      parent.append(map);
    }
    map.deactivate = function deactivate() {
      var parent = map.parent();	
      for (var i = 0; i < map.cells.length; i++) {
        if (map.cells[i].active) map.cells[i].deactivate();
      }
      parent.append(map);
    }

    map.activate();

    return map;
  }

  $(document).ready(function() {
    function restartMap(e) {
      e.preventDefault();

	  $(this).simpledialog({
	    'mode' : 'bool',
	    'prompt' : "Are you certain you wish to restart?",
	    'subTitle': "If you start your town over, all progress will be lost forever.",
	    'useModal': true,
	    'buttons' : {
	      'Restart': {
	        click: function () { $('#restart').submit(); },
	        icon: "refresh"
	      },
	      'Cancel': {
            click: function () {},
	        icon: "delete",
	        theme: "c"
	      }
	    }
	  })
    }
	
	$('#restart-button').live('click', restartMap);
  })

  $(document).bind("pagechange", function() {
   $('#map').Map({
      gridElemId: 'grid',
      nextTileElemId: 'next-tile',
      suspendedTileElemId: 'suspended-tile',
      scoreElemId: 'score',
      wisdomElemId: 'wisdom',
      movesElemId: 'moves'
    });
  });
})(jQuery);
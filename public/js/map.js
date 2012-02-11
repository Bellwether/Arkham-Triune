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

  $.Wisdom = function(map, options) {
    this.map = map;
    this.wisdom = $('#'+options.wisdomElemId);
  }
  $.Wisdom.prototype.label = function label() {
    return this.wisdom.find('.ui-btn-text');
  }
  $.Wisdom.prototype.text = function text(val) {
    if (val) {
      var current = parseInt(this.text());
      var updated = current + parseInt(val);
      (this.label() || this.wisdom).html(updated);
    } else {
      return this.label() ? this.label().html() : this.wisdom.html();
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
    this.tile.attr('class', 'tile '+tile.name.replace(/\s/,'-'));
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

  $.Turn = function(map, data, cell) {
    this.map = map;
    this.cell = cell;
    this.fx = [];
    this.data = data;
    return this;
  }
  $.Turn.prototype.queueFx = function queueFx(title, delay) {
    var functor = this[title];
    if (functor && typeof functor === 'function') {
      this.fx.push({callback: functor, delay: delay});
    };
  }
  $.Turn.prototype.run = function run(callback) {
    this.runFx(0, callback);
  }
  $.Turn.prototype.runFx = function runFx(index, callback) {
    if (index >= this.fx.length) {
      callback();
    } else {
      this.fx[index].callback.call(this);

      var self = this;
      setTimeout(function() { 
        self.runFx(index+1, callback);
      }, this.fx[index].delay);
    }
  }
  $.Turn.prototype.fxPlaceTile = function fxPlaceTile() {
    var tile = this.data.placed.tile;
    if (tile) {
      this.map.moves.text(1);	
      this.cell.emplace(tile);
    } else {		
      this.cell.deselect();
    }
  }
  $.Turn.prototype.fxScore = function fxScore() {	
    if (this.data.points) this.map.score.text(this.data.points);
    if (this.data.wisdom) this.map.wisdom.text(this.data.wisdom);
  }
  $.Turn.prototype.fxMatchPlacement = function fxMatchPlacement() {	
    for (var i = 0; i < this.data.matched.length; i++) {
      var match = this.data.matched[i];
      this.map.cells[match.index].emplace(match.tile);

      for (var j = 0; j < match.cells.length; j++) {	
        var index = match.cells[j];
		$.SFX().transfer(this.map.cells[index].tile, this.map.cells[match.index].tile);
        this.map.cells[index].empty();
      };
    }
  }
  $.Turn.prototype.fxMonstersMoved = function fxMonstersMoved() {	
    for (var i = 0; i < this.data.moved.moves.length; i++) {
      var path = this.data.moved.moves[i].path;	
      $.SFX().transfer(this.map.cells[path[0]].tile, this.map.cells[path[1]].tile);
      this.map.moveCell(path[0], path[1]);
    }
  }
  $.Turn.prototype.fxMonstersTransported = function fxMonstersTransported() {	
    for (var i = 0; i < this.data.moved.transports.length; i++) {
      var path = this.data.moved.transports[i].move.path;
      var monsterUpgrade = this.data.moved.transports[i].tile;
      if (monsterUpgrade) this.map.cells[path[0]].emplace(monsterUpgrade);
      this.map.moveCell(path[0], path[1]);
    }
  }
  $.Turn.prototype.fxMonstersCursed = function fxMonstersCursed() {	
    for (var i = 0; i < this.data.enchanted.cursed.length; i++) {
      this.map.cells[ this.data.enchanted.cursed[i] ].tile.addClass('cursed');
    }	
  }
  $.Turn.prototype.fxMonstersBlessed = function fxMonstersBlessed() {	
    for (var i = 0; i < this.data.enchanted.blessed.length; i++) {
      this.map.cells[ this.data.enchanted.blessed[i] ].tile.removeClass('cursed');
    }
  }
  $.Turn.prototype.fxMonstersSummoned = function fxMonstersSummoned() {	
    var tile = this.data.summoned.tile;
    for (var i = 0; i < this.data.summoned.cells.length; i++) {
      this.map.cells[ this.data.summoned.cells[i] ].emplace(tile);
    }
  }
  $.Turn.prototype.fxMonstersTrapped = function fxMonstersTrapped() {	
    var tile = this.data.trapped.tile;
    for (var i = 0; i < this.data.trapped.traps.length; i++) {
      this.map.cells[ this.data.trapped.traps[i] ].emplace(tile);
    }

    if (this.data.trapped.matched) {
      for (var i = 0; i < this.data.trapped.matched.length; i++) {
        var match = this.data.trapped.matched[i];
        for (var j = 0; j < match.cells.length; j++) {	
          this.map.cells[ match.cells[j]].empty();
        };
        this.map.cells[match.index].emplace(match.tile);
      }
    }
  }
  $.Turn.prototype.fxTilesRemoved = function fxTilesRemoved() {	
    for (var i = 0; i < this.data.removed.length; i++) {
      var index = this.data.removed[i];
      var self = this;
      this.map.cells[index].tile.addClass('animated rotateOut');
      setTimeout(function() {
        self.map.cells[index].empty();
      }, 750);
    }	
  }
  $.Turn.prototype.fxMonstersCanabalized = function fxMonstersCanabalized() {
    for (var i = 0; i < this.data.canabalized.length; i++) {
      this.map.cells[this.data.canabalized[i]].empty();
    }	  
  }

  $.fn.Map = function(options) {
    options = options || {};
    var map = $(this);
    if (!map.length) return false;

    map.nextTile = new $.NextTile(map, options);
    map.suspendedTile = new $.SuspendedTile(map, options);
    map.grid = $('#'+options.gridElemId);
    map.score = new $.Score(map, options);
    map.wisdom = new $.Wisdom(map, options);
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

        if (textStatus === 'error') {
          return;
        }

        var turn = new $.Turn(map, data, cell);

        if (data.nextTile) {
          map.nextTile.text(data.nextTile.name);
        }

        if (data.placed) turn.queueFx('fxPlaceTile', 0);
        if (data.matched) turn.queueFx('fxMatchPlacement', 200);
        if (data.removed) turn.queueFx('fxTilesRemoved', 0);
        if (data.placed) turn.queueFx('fxScore', 0);
        if (data.moved && data.moved.moves) turn.queueFx('fxMonstersMoved', 500);
        if (data.moved && data.moved.transports) turn.queueFx('fxMonstersTransported', 350);
        if (data.trapped) turn.queueFx('fxMonstersTrapped', 250);
        if (data.enchanted && data.enchanted.cursed) turn.queueFx('fxMonstersCursed', 100);
        if (data.enchanted && data.enchanted.blessed) turn.queueFx('fxMonstersBlessed', 100);
        if (data.summoned) turn.queueFx('fxMonstersSummoned', 100);
        if (data.canabalized) turn.queueFx('fxMonstersCanabalized', 0);

        turn.run(function() {
          if (data.complete) {
            $.mobile.changePage(data.url, {
              transition: 'pop',
              reloadPage: true,
              role: 'dialog'
            });
            return;
          } else {
            map.activate();
          }
        })
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
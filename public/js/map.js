(function ($) {
  $.AbeyantTile = function(map, options) {	
    this.map = map;
    this.tile = $('#'+options.abeyantTileElemId);
    this.container = this.tile.parents('.ui-radio');

    this.active = true;

    var self = this;
    this.container.removeClass('ui-disabled');

    this.container.click(function(e) {
      if (!self.active) return;
      self.container.addClass('ui-disabled');
      self.active = false;
      map.abeyant(function(data, textStatus) {
        if (data && data.abeyant) {
          self.text(data.abeyant.name);
          self.map.nextTile.text(data.next.name);
        }
	    self.container.removeClass('ui-disabled');
        self.active = true;
      })
    })
  }
  $.AbeyantTile.prototype.isEmpty = function isEmpty() {
    return this.text().replace(' ','').replace('.','').length > 0;
  }
  $.AbeyantTile.prototype.label = function label() {
    return this.tile.find('.ui-btn-text');
  }
  $.AbeyantTile.prototype.text = function text(val) {
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
    this.tile.addClass(tile.name.replace(' ','-'));
    this.tile.html(tile.name);
    this.originalText = tile.name;
  }
  $.MapCell.prototype.update = function update(classAttr, text) {	
    this.tile.attr('class', classAttr);
    this.tile.html(text);
    this.originalText = text;
  }

  $.fn.Map = function(options) {
    options = options || {};
    var map = $(this);
    map.nextTile = new $.NextTile(map, options);
    map.abeyantTile = new $.AbeyantTile(map, options);
    map.grid = $('#'+options.gridElemId);
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
    map.abeyant = function abeyant(callback) {
      if (map.nextTile.text() === map.abeyantTile.text()) callback();

      $.sendRequest({
        url: map.attr('action'),
        data: {abeyant: true},
      }, callback);
    }
	
    map.isUsingMagic = function isUsingMagic() {
      return map.nextTile.text().indexOf('Elder Sign') > -1;
    }	
    map.emplace = function emplace(cell) {
      map.deactivate();
      map.input.val(cell.index);

      function onPlacement(data, textStatus) {
        console.log(JSON.stringify(textStatus)+' '+JSON.stringify(data))

        if (data.tile) {
          cell.emplace({name: map.nextTile.text()});
          map.nextTile.text(data.tile.name);
        }
        if (data.matched) {
          map.match(cell.index, data.matched);

          if (data.matched.points) {
          }
        }
        if (data.monsters && data.monsters.trapped) {
          for (var i = 0; i < data.monsters.trapped.length; i++) {
            var tile = data.monsters.trapped[i].tile;
            map.cells[data.monsters.trapped[i].index].update(tile.name.replace(' ','-'), tile.name);
          }
        }
        if (data.monsters && data.monsters.moves) {
          for (var i = 0; i < data.monsters.moves.length; i++) {
            var fromToTuple = data.monsters.moves[i];
            var mover = map.cells[fromToTuple[0]];
            var target = map.cells[fromToTuple[1]];
            var moverClass = mover.tile.attr('class');
            var targetClass = target.tile.attr('class');
            var moverText = mover.tile.html();
            var targetText = target.tile.html();

            mover.update(targetClass, targetText);
            target.update(moverClass, moverText);
          }
        }
        if (data.removed) {
          for (var i = 0; i < data.removed.length; i++) {
            map.cells[data.removed[i]].update('tile empty', '[x]');
          }
        }
        map.activate();
      }

      $.sendRequest({
        url: map.attr('action'),
        data: {index: map.input.val()},
      }, onPlacement);
    }
    map.activate = function activate() {
      var usingMagic = map.isUsingMagic();
      for (var i = 0; i < map.cells.length; i++) {
        if (usingMagic || map.cells[i].isEmpty()) map.cells[i].activate();
      }
    }
    map.deactivate = function deactivate() {
      for (var i = 0; i < map.cells.length; i++) {
        if (map.cells[i].active) map.cells[i].deactivate();
      }
    }

    map.activate();

    return map;
  }
})(jQuery);	
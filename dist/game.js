'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var EventHandler = function () {
    function EventHandler() {
        _classCallCheck(this, EventHandler);

        this.events = {};
    }

    _createClass(EventHandler, [{
        key: 'emit',
        value: function emit(eventName, data) {
            if (this.events[eventName]) {
                this.events[eventName].forEach(function (fn) {
                    return fn(data);
                });
            }
        }
    }, {
        key: 'on',
        value: function on(eventName, closure) {
            this.events[eventName] = this.events[eventName] || [];
            this.events[eventName].push(closure);
        }
    }, {
        key: 'off',
        value: function off(eventName, closure) {
            if (this.events[eventName]) {
                for (var i in this.events[eventName]) {
                    var event = this.events[eventName][i];
                    if (event == closure) {
                        this.events[eventName].splice(i, 1);
                    }
                }
            }
        }
    }]);

    return EventHandler;
}();

var Minesweeper = function () {
    function Minesweeper(canvas) {
        var mines = arguments.length <= 1 || arguments[1] === undefined ? 5 : arguments[1];
        var cols = arguments.length <= 2 || arguments[2] === undefined ? 10 : arguments[2];
        var rows = arguments.length <= 3 || arguments[3] === undefined ? 10 : arguments[3];

        _classCallCheck(this, Minesweeper);

        var self = this;
        this.minesGenerated = false;
        this.canvas = canvas;
        this.width = canvas.width;
        this.height = canvas.height;
        this.cols = cols;
        this.rows = rows;
        this.mines = mines;
        this.board = [];
        this.events = new EventHandler();
        this.sprites = null;
        this.pauseMouseMovementRender = false;
        this.pauseLeftClickHandling = false;
        this.loadSprites(function (sprites) {
            self.sprites = sprites;
            self.generateBoard();
            self.render();
            self.initMouseListener();
            self.handleEvents();
        });
    }

    _createClass(Minesweeper, [{
        key: 'initMouseListener',
        value: function initMouseListener() {
            var self = this;
            var rect = this.canvas.getBoundingClientRect();

            this.canvas.onclick = function (e) {
                if (e.button != 0) {
                    return;
                }

                var pos = self.getPositionReletiveToCanvasFromEvent(e);
                var tile = self.getTileFromPos(pos.x, pos.y);
                self.events.emit('tile.leftClick', tile);
            };

            this.canvas.oncontextmenu = function (e) {
                e.preventDefault();
                var pos = self.getPositionReletiveToCanvasFromEvent(e);
                self.events.emit('tile.rightClick', self.getTileFromPos(pos.x, pos.y));
            };

            var lastTile = null;
            this.canvas.onmousemove = function (e) {
                var pos = self.getPositionReletiveToCanvasFromEvent(e);
                var tile = self.getTileFromPos(pos.x, pos.y);
                if (tile == null) {
                    return;
                }
                if (JSON.stringify(lastTile) != JSON.stringify(tile)) {
                    if (lastTile) {
                        lastTile.isHovered = false;
                    }
                    tile.isHovered = true;
                    self.events.emit('tile.onHover', tile);
                    lastTile = tile;
                }
            };
        }
    }, {
        key: 'getPositionReletiveToCanvasFromEvent',
        value: function getPositionReletiveToCanvasFromEvent(e) {
            var x, y;

            if (e.offsetX) {
                x = e.offsetX;
                y = e.offsetY;
            } else if (e.layerX) {
                x = e.layerX;
                y = e.layerY;
            }

            return { x: x, y: y };
        }
    }, {
        key: 'revealTiles',
        value: function revealTiles() {
            var delay = arguments.length <= 0 || arguments[0] === undefined ? 100 : arguments[0];
            var random = arguments.length <= 1 || arguments[1] === undefined ? true : arguments[1];
            var tiles = arguments[2];

            if (!tiles) {
                tiles = [];
                for (var y = 0; y < this.rows; y++) {
                    for (var x = 0; x < this.cols; x++) {
                        var tile = this.getTileFromCoords(x, y);
                        if (tile != null) {
                            tiles.push(tile);
                        }
                    }
                }
            }

            var self = this;

            setTimeout(function () {
                if (random) {
                    var randomI = Math.floor(Math.random() * tiles.length);
                    var tile = tiles[randomI];
                    tiles.splice(randomI, 1);
                } else {
                    var tile = tiles.shift();
                }

                tile.isOpen = true;
                self.render();

                if (tiles.length > 0) {
                    self.revealTiles(delay, random, tiles);
                }
            }, delay);
        }
    }, {
        key: 'getTileFromPos',
        value: function getTileFromPos(x, y) {
            var tileSize = this.getTileSize();
            var tileX = Math.floor(x / tileSize);
            var tileY = Math.floor(y / tileSize);

            if (tileX >= this.cols || tileX < 0 || tileY >= this.rows || tileY < 0) {
                return null;
            }

            return this.board[tileY][tileX];
        }
    }, {
        key: 'getTileFromCoords',
        value: function getTileFromCoords(x, y) {
            if (x >= this.cols || x < 0 || y >= this.rows || y < 0) {
                return null;
            }

            return this.board[y][x];
        }
    }, {
        key: 'getTileNeighbourCoords',
        value: function getTileNeighbourCoords(x, y) {
            var neighbours = [];
            var coords = [[-1, -1], [-1, 0], [-1, 1], [0, 1], [1, 1], [1, 0], [1, -1], [0, -1]];

            for (var i in coords) {
                var pos = coords[i];
                neighbours.push([x + pos[0], y + pos[1]]);
            }

            return neighbours;
        }
    }, {
        key: 'getTileNeighbours',
        value: function getTileNeighbours(tile) {
            var closed = arguments.length <= 1 || arguments[1] === undefined ? false : arguments[1];

            var self = this,
                neighbours = [];

            if (tile) {
                var coords = this.getTileNeighbourCoords(tile.x, tile.y);
                coords.forEach(function (pos) {
                    var nX = pos[0];
                    var nY = pos[1];
                    var neighbour = self.getTileFromCoords(nX, nY);
                    if (neighbour) {
                        if (closed) {
                            if (!neighbour.isOpen) {
                                neighbours.push(neighbour);
                            }
                        } else {
                            neighbours.push(neighbour);
                        }
                    }
                });
            }

            return neighbours;
        }
    }, {
        key: 'gameLost',
        value: function gameLost(callback, delay) {
            var c = this.canvas.getContext('2d');
            var self = this;

            var renderRedRect = function renderRedRect() {
                c.fillStyle = "rgba(255, 0, 0, 0.2)";
                c.fillRect(0, 0, self.width, self.height);
            };

            var clearRect = function clearRect() {
                self.render();
            };

            var sequence = [renderRedRect, clearRect, renderRedRect, clearRect, callback];
            sequence.forEach(function (f, i) {
                setTimeout(f, i * delay);
            });
        }
    }, {
        key: 'gameWon',
        value: function gameWon() {
            alert("you Won");
        }
    }, {
        key: 'revealNeighboursRecursive',
        value: function revealNeighboursRecursive(tile) {
            var neighbours = this.getTileNeighbours(tile, true);
            for (var i in neighbours) {
                var neighbour = neighbours[i];
                neighbour.isOpen = true;
                if (neighbour.adjacentMines == 0) {
                    this.revealNeighboursRecursive(neighbour);
                }
            }

            this.render();
        }
    }, {
        key: 'countClosedTiles',
        value: function countClosedTiles() {
            var closedTiles = 0;
            for (var i in this.board) {
                var row = this.board[i];
                for (var j in row) {
                    var tile = row[j];
                    if (!tile.isOpen) {
                        closedTiles++;
                    }
                }
            }

            return closedTiles;
        }
    }, {
        key: 'handleEvents',
        value: function handleEvents() {
            var self = this;
            this.events.on('tile.leftClick', function (tile) {
                if (self.pauseLeftClickHandling) {
                    return;
                }

                if (!self.minesGenerated) {
                    self.generateMines(tile);
                }

                if (tile.adjacentMines == 0 && !tile.isMine) {
                    self.revealNeighboursRecursive(tile);
                }

                if (tile.isMine) {
                    self.pauseMouseMovementRender = true;
                    self.gameLost(function () {
                        tile.exploded = true;
                        self.revealTiles(5);
                        self.pauseMouseMovementRender = false;
                    }, 100);
                } else if (tile.adjacentMines == 0) {}

                tile.isOpen = true;

                if (self.countClosedTiles() == self.mines) {
                    self.gameWon();
                }
                self.render();
            });

            this.events.on('tile.rightClick', function (tile) {
                console.log('right');
                if (tile.isFlag) {
                    tile.isFlag = false;
                } else {
                    tile.isFlag = true;
                }
                self.render();
            });

            this.events.on('tile.onHover', function (tile) {
                var position = tile.getCoords();
                if (tile.isHovered && !self.pauseMouseMovementRender) {
                    self.render();
                }
            });
        }
    }, {
        key: 'getRandomInt',
        value: function getRandomInt(min, max) {
            var floor = arguments.length <= 2 || arguments[2] === undefined ? false : arguments[2];

            var number = Math.random() * (max - min) + min;
            if (floor) {
                number = Math.floor(number);
            }

            return number;
        }
    }, {
        key: 'generateMines',
        value: function generateMines(base) {
            var minesPlaced = 0;
            var blackList = this.getTileNeighbourCoords(base.x, base.y);
            var inBlacklist = function inBlacklist(x, y) {
                for (var i in blackList) {
                    var coords = blackList[i];
                    if (coords[0] == x && coords[1] == y) {
                        return true;
                    }
                }
                return false;
            };
            var self = this;
            while (minesPlaced < this.mines) {
                var randomCol = this.getRandomInt(0, this.cols, true);
                var randomRow = this.getRandomInt(0, this.rows, true);
                var tile = this.getTileFromCoords(randomCol, randomRow);

                if (JSON.stringify(base) == JSON.stringify(tile) || inBlacklist(tile.x, tile.y)) {
                    continue;
                }

                if (!tile.isMine) {
                    tile.isMine = true;
                    this.getTileFromCoords(randomCol, randomRow).isMine = true;
                    minesPlaced++;
                }
            }

            this.minesGenerated = true;

            this.board.forEach(function (row) {
                row.forEach(function (tile) {
                    var neighbours = self.getTileNeighbours(tile);
                    neighbours.forEach(function (el) {
                        if (el.isMine) {
                            tile.adjacentMines++;
                        }
                    });
                });
            });
        }
    }, {
        key: 'loadSprites',
        value: function loadSprites(callback) {
            var tileSize = this.getTileSize();
            var loader = new SpriteLoader();
            loader.add('tile', 'img/tile.png', tileSize);
            loader.add('mine', 'img/mine.png', tileSize);
            loader.add('flag', 'img/flag.png', tileSize);
            loader.add('open', 'img/open.png', tileSize);
            loader.load(callback);
        }
    }, {
        key: 'getTileSize',
        value: function getTileSize() {
            return Math.floor(this.width / this.cols);
        }
    }, {
        key: 'generateBoard',
        value: function generateBoard() {
            for (var y = 0; y < this.rows; y++) {
                var row = [];
                for (var x = 0; x < this.cols; x++) {
                    var tileSize = this.getTileSize();
                    row.push(new Tile(tileSize, x, y));
                }

                this.board.push(row);
            }
        }
    }, {
        key: 'getFontColor',
        value: function getFontColor(number) {
            switch (number) {
                case 1:
                    return "rgb(0, 90, 255)";
                    break;
                case 2:
                    return "rgb(10, 167, 21)";
                    break;
                case 3:
                    return "rgb(255, 0, 0)";
                    break;
                default:
                    return "rgb(0, 0, 0)";
                    break;
            }
        }
    }, {
        key: 'render',
        value: function render() {
            var c = this.canvas.getContext('2d');
            c.clearRect(0, 0, this.width, this.height);
            for (var i in this.board) {
                var row = this.board[i];
                for (var j in row) {
                    var tile = row[j];
                    var tileSize = this.getTileSize();
                    var position = tile.getPosition();
                    var sprite = this.sprites[tile.getSprite()];
                    c.drawImage(sprite, position.x, position.y, tileSize, tileSize);

                    if (tile.isOpen && !tile.isMine && tile.adjacentMines != 0) {
                        var pos = tile.getCenterPosition();
                        c.font = "20px arial";
                        c.textAlign = "center";
                        c.textBaseline = "middle";
                        c.fillStyle = this.getFontColor(tile.adjacentMines);
                        c.fillText(tile.adjacentMines, pos.x, pos.y);
                    }

                    if (tile.isHovered && !tile.isOpen) {
                        c.fillStyle = "rgba(0, 0, 0, 0.05)";
                        c.fillRect(position.x, position.y, tileSize, tileSize);
                    } else if (tile.exploded) {
                        c.fillStyle = "rgba(255, 0, 0, 0.2)";
                        c.fillRect(position.x, position.y, tileSize, tileSize);
                    }
                }
            }
        }
    }]);

    return Minesweeper;
}();

var SpriteLoader = function () {
    function SpriteLoader() {
        _classCallCheck(this, SpriteLoader);

        this.sprites = [];
        this.loadedSprites = {};
    }

    _createClass(SpriteLoader, [{
        key: 'add',
        value: function add(name, src, size) {
            var data = { src: src, size: size, name: name };
            this.sprites.push(data);
        }
    }, {
        key: 'load',
        value: function load(callback) {
            var self = this;
            if (this.sprites.length > 0) {
                var sprite = this.sprites.shift();
                var img = new Image(sprite.size, sprite.size);
                img.src = sprite.src;
                img.onload = function () {
                    self.loadedSprites[sprite.name] = img;
                    self.load(callback);
                };
            } else {
                if (typeof callback == "function") {
                    callback(self.getLoaded());
                }
            }
        }
    }, {
        key: 'getLoaded',
        value: function getLoaded() {
            return this.loadedSprites;
        }
    }]);

    return SpriteLoader;
}();

var Tile = function () {
    function Tile(size, x, y) {
        _classCallCheck(this, Tile);

        this.size = size;
        this.x = x;
        this.y = y;
        this.isOpen = false;
        this.isMine = false;
        this.isFlag = false;
        this.isHovered = false;
        this.adjacentMines = 0;
        this.exploded = false;
    }

    _createClass(Tile, [{
        key: 'getSprite',
        value: function getSprite() {
            if (this.isMine && this.isOpen) {
                return 'mine';
            } else if (this.isFlag && !this.isOpen) {
                return 'flag';
            } else if (this.isOpen && !this.isMine) {
                return 'open';
            } else {
                return 'tile';
            }
        }
    }, {
        key: 'getCoords',
        value: function getCoords() {
            var x = this.x;
            var y = this.y;
            return { x: x, y: y };
        }
    }, {
        key: 'getPosition',
        value: function getPosition() {
            var x = this.x * this.size;
            var y = this.y * this.size;

            return { x: x, y: y };
        }
    }, {
        key: 'getCenterPosition',
        value: function getCenterPosition() {
            var pos = this.getPosition();
            pos.x += Math.floor(this.size / 2);
            pos.y += Math.floor(this.size / 2);

            return pos;
        }
    }]);

    return Tile;
}();

var game = {
    g: null,
    create: function create(canvas) {
        var bombs = arguments.length <= 1 || arguments[1] === undefined ? 5 : arguments[1];
        var cols = arguments.length <= 2 || arguments[2] === undefined ? 10 : arguments[2];
        var rows = arguments.length <= 3 || arguments[3] === undefined ? 10 : arguments[3];

        if (cols * rows <= bombs) {
            return alert("Invalid size/bomb amount");
        }

        this.g = new Minesweeper(canvas, cols, rows, bombs);
    }
};

window.onload = function () {
    var canvas = document.querySelector('#game');
    game.create(canvas, 10);
};
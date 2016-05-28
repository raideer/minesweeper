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
        var mines = arguments.length <= 1 || arguments[1] === undefined ? 10 : arguments[1];
        var cols = arguments.length <= 2 || arguments[2] === undefined ? 9 : arguments[2];
        var rows = arguments.length <= 3 || arguments[3] === undefined ? 9 : arguments[3];

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
        this.tileSize = Math.floor(this.width / this.cols);
        this.gameWidth = this.tileSize * cols;
        this.gameHeight = this.tileSize * rows;
        this.pauseMouseMovementRender = false;
        this.pauseLeftClickHandling = false;
        this.gameStarted = false;
        this.gameEnded = false;
        this.loaded = false;
        this.loadSprites(function (sprites) {
            self.sprites = sprites;
            self.generateBoard();
            self.render();
            self.initMouseListener();
            self.handleEvents();
            self.loaded = true;
            self.events.emit('game.loaded');
        });
    }

    _createClass(Minesweeper, [{
        key: 'whenLoaded',
        value: function whenLoaded(callback) {
            if (this.loaded) {
                callback();
            } else {
                this.events.on('game.loaded', callback);
            }
        }
    }, {
        key: 'initMouseListener',
        value: function initMouseListener() {

            var self = this;
            var rect = this.canvas.getBoundingClientRect();

            this.canvas.onclick = function (e) {
                if (e.button != 0 || self.gameEnded) {
                    return;
                }

                var pos = self.getPositionReletiveToCanvasFromEvent(e);
                var tile = self.getTileFromPos(pos.x, pos.y);
                self.events.emit('tile.leftClick', tile);
            };

            this.canvas.oncontextmenu = function (e) {
                e.preventDefault();
                if (self.gameEnded) {
                    return;
                }
                var pos = self.getPositionReletiveToCanvasFromEvent(e);
                self.events.emit('tile.rightClick', self.getTileFromPos(pos.x, pos.y));
            };

            var lastTile = null;
            this.canvas.onmousemove = function (e) {
                if (self.gameEnded) {
                    return;
                }
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
        key: 'revealMines',
        value: function revealMines() {
            var random = arguments.length <= 0 || arguments[0] === undefined ? true : arguments[0];

            for (var y = 0; y < this.rows; y++) {
                for (var x = 0; x < this.cols; x++) {
                    var tile = this.getTileFromCoords(x, y);
                    if (tile.isMine) {
                        tile.isOpen = true;
                    }
                }
            }

            this.render();
        }
    }, {
        key: 'revealTiles',
        value: function revealTiles() {
            var delay = arguments.length <= 0 || arguments[0] === undefined ? 50 : arguments[0];
            var random = arguments.length <= 1 || arguments[1] === undefined ? true : arguments[1];
            var tiles = arguments[2];

            if (!tiles) {
                tiles = [];
                for (var y = 0; y < this.rows; y++) {
                    var row = [];
                    for (var x = 0; x < this.cols; x++) {
                        var tile = this.getTileFromCoords(x, y);
                        if (tile != null) {
                            row.push(tile);
                        }
                    }
                    tiles.push(row);
                }
            }

            var self = this;

            function run() {
                if (random) {
                    var randomI = Math.floor(Math.random() * tiles.length);
                    var row = tiles[randomI];
                    tiles.splice(randomI, 1);
                } else {
                    var row = tiles.shift();
                }

                for (var i in row) {
                    row[i].isOpen = true;
                }
                self.render();

                if (tiles.length > 0) {
                    self.revealTiles(delay, random, tiles);
                }
            }

            if (delay == 0) {
                run();
            } else {
                setTimeout(function () {
                    run();
                }, delay);
            }
        }
    }, {
        key: 'getTileFromPos',
        value: function getTileFromPos(x, y) {
            var tileSize = this.tileSize;
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
            this.gameEnded = true;
            this.events.emit('game.end', { 'won': false });
            var c = this.canvas.getContext('2d');
            var self = this;

            var renderRedRect = function renderRedRect() {
                c.fillStyle = "rgba(255, 0, 0, 0.2)";
                c.fillRect(0, 0, self.gameWidth, self.gameHeight);
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
            this.gameEnded = true;
            this.events.emit('game.end', { 'won': true });
        }
    }, {
        key: 'stop',
        value: function stop() {
            this.gameEnded = true;
            this.events.emit('game.end', { 'won': false });
            this.revealTiles(50, false);
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
                if (self.pauseLeftClickHandling || tile == null) {
                    return;
                }

                if (!self.gameStarted) {
                    self.events.emit('game.start');
                    self.gameStarted = true;
                }

                if (!self.minesGenerated) {
                    self.generateMines(tile);
                }

                if (tile.isFlag) {
                    tile.isFlag = false;
                    self.render();
                    return;
                }

                if (tile.adjacentMines == 0 && !tile.isMine) {
                    self.revealNeighboursRecursive(tile);
                }

                if (tile.isMine) {
                    self.pauseMouseMovementRender = true;
                    self.gameLost(function () {
                        tile.exploded = true;
                        self.revealMines();
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
                if (tile.isFlag) {
                    self.events.emit('tile.flag', false);
                    tile.isFlag = false;
                } else {
                    self.events.emit('tile.flag', true);
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
            var tileSize = this.tileSize;
            var loader = new SpriteLoader();
            loader.add('tile', 'img/tile.png', tileSize);
            loader.add('mine', 'img/mine.png', tileSize);
            loader.add('flag', 'img/flag.png', tileSize);
            loader.add('open', 'img/open.png', tileSize);
            loader.load(callback);
        }
    }, {
        key: 'getFlaggedNeighbours',
        value: function getFlaggedNeighbours(tile) {
            var n = this.getTileNeighbours(tile);
            var flagged = [];
            for (var i in n) {
                if (n[i].isFlag) {
                    flagged.push(n[i]);
                }
            }

            return flagged;
        }
    }, {
        key: 'getTileSize',
        value: function getTileSize() {
            return Math.floor(this.width / this.cols);
        }
    }, {
        key: 'generateBoard',
        value: function generateBoard() {
            this.board = [];

            for (var y = 0; y < this.rows; y++) {
                var row = [];
                for (var x = 0; x < this.cols; x++) {
                    var tileSize = this.tileSize;
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
                        var fontSize = Math.floor(tileSize * 0.6);
                        c.font = "bold " + fontSize + "px Courier";
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

var Solver = function () {
    function Solver(game) {
        _classCallCheck(this, Solver);

        this.game = game;
        this.solved = false;
        this.solvedTiles = [];
        this.debug = false;
    }

    _createClass(Solver, [{
        key: 'solve',
        value: function solve() {
            var self = this;
            var firstTileX = Math.floor(this.game.cols / 2);
            var firstTileY = Math.floor(this.game.rows / 2);
            var timeout;

            var func = function func() {
                self.run(firstTileX, firstTileY);
                timeout = setTimeout(func, 200);
            };

            func();

            this.game.events.on('game.end', function () {
                clearTimeout(timeout);
            });

            setTimeout(function () {
                clearTimeout(timeout);
            }, 7000);
        }
    }, {
        key: 'isSolved',
        value: function isSolved(x, y) {
            for (var i in this.solvedTiles) {
                var coords = this.solvedTiles[i];
                if (coords[0] == x && coords[1] == y) {
                    return true;
                }
            }
            return false;
        }
    }, {
        key: 'run',
        value: function run(x, y) {
            var tile = this.game.getTileFromCoords(x, y);
            if (tile == null) {
                return;
            }

            if (!tile.isOpen) {
                this.clickOnTile(x, y);
            }

            this.attemptFlagging();
            this.attemptClicking();
        }
    }, {
        key: 'attemptClicking',
        value: function attemptClicking() {
            for (var i in this.game.board) {
                var row = this.game.board[i];
                for (var k in row) {
                    var tile = row[k];
                    if (!tile.isOpen || tile.adjacentMines == 0 || this.isSolved(tile.x, tile.y)) {
                        continue;
                    }
                    var flaggedNeighbours = 0;
                    var closedNeighbours = this.game.getTileNeighbours(tile, true);

                    for (var j in closedNeighbours) {
                        var n = closedNeighbours[j];
                        if (n.isFlag) {
                            flaggedNeighbours++;
                        }
                    }

                    if (tile.adjacentMines == flaggedNeighbours) {
                        for (var j in closedNeighbours) {
                            var n = closedNeighbours[j];
                            if (!n.isFlag) {
                                this.clickOnTile(n.x, n.y);
                            }
                        }
                    }
                }
            }
        }
    }, {
        key: 'attemptFlagging',
        value: function attemptFlagging() {
            for (var i in this.game.board) {
                var row = this.game.board[i];
                for (var k in row) {
                    var tile = row[k];
                    if (!tile.isOpen || tile.adjacentMines == 0 || this.isSolved(tile.x, tile.y)) {
                        continue;
                    }

                    var closedNeighbours = this.game.getTileNeighbours(tile, true);

                    if (tile.adjacentMines == closedNeighbours.length) {
                        for (var j in closedNeighbours) {
                            var n = closedNeighbours[j];
                            if (!n.isFlag) {
                                this.flagTile(n.x, n.y);
                            }
                        }
                    }
                }
            }
        }
    }, {
        key: 'clickOnTile',
        value: function clickOnTile(x, y) {
            var tile = this.game.getTileFromCoords(x, y);
            if (tile != null) {
                this.game.events.emit('tile.leftClick', tile);
            }
        }
    }, {
        key: 'flagTile',
        value: function flagTile(x, y) {
            this.solvedTiles.push([x, y]);
            var tile = this.game.getTileFromCoords(x, y);
            if (tile != null) {
                this.game.events.emit('tile.rightClick', tile);
            }
        }
    }]);

    return Solver;
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
    events: new EventHandler(),
    init: function init(canvas, bombs, cols, rows) {
        this.g = new Minesweeper(canvas, bombs, cols, rows);
        this.time = 0;
        this.loop = null;
    },
    create: function create(canvas) {
        var bombs = arguments.length <= 1 || arguments[1] === undefined ? 40 : arguments[1];
        var cols = arguments.length <= 2 || arguments[2] === undefined ? 16 : arguments[2];
        var rows = arguments.length <= 3 || arguments[3] === undefined ? 16 : arguments[3];

        if (this.loop != null) {
            this.stopTime();
        }
        this.init(canvas, bombs, cols, rows);
        var self = this;
        if (cols * rows <= bombs) {
            return alert("Invalid size/bomb amount");
        }

        this.handleEvents();
    },
    handleEvents: function handleEvents() {
        var self = this;
        this.g.events.on('game.start', function () {
            self.startTime();
            self.events.emit('game.start');
        });

        this.g.events.on('game.end', function (game) {
            self.stopTime();
            self.events.emit('game.stop', game);
        });

        this.g.events.on('tile.flag', function (state) {
            self.events.emit('tile.flag', state);
        });
    },
    stop: function stop() {
        this.g.stop();
    },
    startTime: function startTime() {
        var self = this;
        this.loop = setTimeout(tick, 100);
        function tick() {
            self.time++;
            self.events.emit('time.tick', self.time);
            self.loop = setTimeout(tick, 100);
        }
    },
    stopTime: function stopTime() {
        clearTimeout(this.loop);
    }
};

window.onload = function () {

    var canvas = document.querySelector('#game');

    var difficulties = [[10, 9, 9, 500, 500], [40, 16, 16, 500, 500], [99, 30, 16, 800, 500]];

    var difficulty = 1;

    function createGame() {
        var d = difficulties[difficulty];
        $('#container').width(d[3]).height(d[4]);
        $('#mines').html(d[0]);
        canvas.width = d[3];
        canvas.height = d[4];
        game.create(canvas, d[0], d[1], d[2]);
    }

    $('#newGame').click(function () {
        var state = $(this).data('state');
        if (state == 0) {
            createGame();
        } else {
            game.stop();
        }
    });

    $('#autoSolve').click(function () {
        game.g.whenLoaded(function () {
            var solver = new Solver(game.g);
            solver.solve();
        });
    });

    $('.difficulty').click(function () {
        difficulty = $(this).data('difficulty');
        var d = difficulties[difficulty];
        $('.difficulty').removeClass('grey');
        $(this).addClass('grey');
        $('#newGame').html('New game').data('state', 0);
        createGame();
    });

    createGame();

    game.events.on('game.start', function () {
        $('#timer').html('0000');
        $('#newGame').html('Stop').data('state', 1);
    });

    game.events.on('game.stop', function (g) {
        $('#newGame').html('New game').data('state', 0);
        if (g.won) {
            var time = $('#timer').html();
            $('#won .time').html(time / 10);
            $('#won').modal('show');
        }
    });

    game.events.on('tile.flag', function (flagged) {
        var mines = $('#mines');
        if (flagged) {
            mines.html(mines.html() - 1);
        } else {
            mines.html(parseInt(mines.html()) + 1);
        }
    });

    game.events.on('time.tick', function (time) {
        $('#timer').html(('0000' + time).substr(-4));
    });
};
class Minesweeper{
    constructor(canvas, mines = 10, cols = 9, rows = 9){
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
        this.gameStarted = false;
        this.gameEnded = false;
        this.loadSprites(function(sprites){
            self.sprites = sprites;
            self.generateBoard();
            self.render();
            self.initMouseListener();
            self.handleEvents();
        });
    }

    addStartListener(closure){
        this.events.on('game.start', closure);
    }

    addEndListener(closure){
        this.events.on('game.end', closure);
    }

    initMouseListener(){

        var self = this;
        var rect = this.canvas.getBoundingClientRect();

        this.canvas.onclick = function(e) {
            if(e.button != 0 || self.gameEnded){
                return;
            }

            var pos = self.getPositionReletiveToCanvasFromEvent(e);
            var tile = self.getTileFromPos(pos.x, pos.y);
            self.events.emit('tile.leftClick', tile);
        }

        this.canvas.oncontextmenu = function(e) {
            if(self.gameEnded){
                return;
            }
            e.preventDefault();
            var pos = self.getPositionReletiveToCanvasFromEvent(e);
            self.events.emit('tile.rightClick', self.getTileFromPos(pos.x, pos.y));
        }

        var lastTile = null;
        this.canvas.onmousemove = function(e) {
            if(self.gameEnded){
                return;
            }
            var pos = self.getPositionReletiveToCanvasFromEvent(e);
            var tile = self.getTileFromPos(pos.x, pos.y);
            if(tile == null){
                return;
            }
            if(JSON.stringify(lastTile) != JSON.stringify(tile)){
                if(lastTile){
                    lastTile.isHovered = false;
                }
                tile.isHovered = true;
                self.events.emit('tile.onHover', tile);
                lastTile = tile;
            }
        }
    }

    getPositionReletiveToCanvasFromEvent(e){
        var x, y;

        if(e.offsetX) {
            x = e.offsetX;
            y = e.offsetY;
        }else if(e.layerX) {
            x = e.layerX;
            y = e.layerY;
        }

        return {x, y};
    }

    revealMines(random = true){
        for(var y=0;y<this.rows;y++){
            for(var x=0;x<this.cols;x++){
                var tile = this.getTileFromCoords(x, y);
                if(tile.isMine){
                    tile.isOpen = true;
                }
            }
        }

        this.render();
    }

    revealTiles(delay = 50, random = true, tiles){
        if(!tiles){
            tiles = [];
            for(var y=0;y<this.rows;y++){
                for(var x=0;x<this.cols;x++){
                    var tile = this.getTileFromCoords(x, y);
                    if(tile != null){
                        tiles.push(tile);
                    }
                }
            }
        }

        var self = this;

        function run(){
            if(random){
                var randomI = Math.floor(Math.random()*tiles.length);
                var tile = tiles[randomI];
                tiles.splice(randomI, 1);
            }else{
                var tile = tiles.shift();
            }

            tile.isOpen = true;
            self.render();

            if(tiles.length > 0){
                self.revealTiles(delay, random, tiles);
            }
        }

        if(delay == 0){
            run();
        }else{
            setTimeout(function() {
                run();
            }, delay);
        }

    }

    getTileFromPos(x, y){
        var tileSize = this.getTileSize();
        var tileX = Math.floor(x/tileSize);
        var tileY = Math.floor(y/tileSize);

        if(tileX >= this.cols || tileX < 0 || tileY >= this.rows || tileY < 0){
            return null;
        }

        return this.board[tileY][tileX];
    }

    getTileFromCoords(x, y){
        if(x >= this.cols || x < 0 || y >= this.rows || y < 0){
            return null;
        }

        return this.board[y][x];
    }

    getTileNeighbourCoords(x, y){
        var neighbours = [];
        var coords = [
            [-1, -1], [-1, 0], [-1, 1], [0, 1], [1, 1], [1, 0], [1, -1], [0, -1]
        ];

        for(var i in coords){
            var pos = coords[i];
            neighbours.push([x + pos[0], y + pos[1]]);
        }

        return neighbours;
    }

    getTileNeighbours(tile, closed = false){
        var self = this, neighbours = [];

        if(tile){
            var coords = this.getTileNeighbourCoords(tile.x, tile.y);
            coords.forEach(function(pos) {
                var nX = pos[0];
                var nY = pos[1];
                var neighbour = self.getTileFromCoords(nX, nY);
                if(neighbour){
                    if(closed){
                        if(!neighbour.isOpen){
                            neighbours.push(neighbour);
                        }
                    }else{
                        neighbours.push(neighbour);
                    }
                }
            });
        }

        return neighbours;
    }

    gameLost(callback, delay){
        this.gameEnded = true;
        this.events.emit('game.end', {'won': false});
        var c = this.canvas.getContext('2d');
        var self = this;

        var renderRedRect = function(){
            c.fillStyle = "rgba(255, 0, 0, 0.2)";
            c.fillRect(0, 0, self.width, self.height);
        }

        var clearRect = function() {
            self.render();
        }

        var sequence = [renderRedRect, clearRect, renderRedRect, clearRect, callback];
        sequence.forEach(function(f, i) {
            setTimeout(f, i*delay);
        });
    }

    gameWon(){
        this.gameEnded = true;
        this.events.emit('game.end', {'won': true});
    }

    revealNeighboursRecursive(tile){
        var neighbours = this.getTileNeighbours(tile, true);
        for(var i in neighbours){
            var neighbour = neighbours[i];
            neighbour.isOpen = true;
            if(neighbour.adjacentMines == 0){
                this.revealNeighboursRecursive(neighbour);
            }
        }

        this.render();
    }

    countClosedTiles(){
        var closedTiles = 0;
        for(var i in this.board){
            var row = this.board[i];
            for(var j in row){
                var tile = row[j];
                if(!tile.isOpen){
                    closedTiles++;
                }
            }
        }

        return closedTiles;
    }

    handleEvents(){
        var self = this;

        this.events.on('tile.leftClick', function(tile) {
            if(self.pauseLeftClickHandling || tile == null){
                return;
            }

            if(!self.gameStarted){
                self.events.emit('game.start');
                self.gameStarted = true;
            }

            if(!self.minesGenerated){
                self.generateMines(tile);
            }

            if(tile.isFlag){
                tile.isFlag = false;
                self.render();
                return;
            }

            if(tile.adjacentMines == 0 && !tile.isMine){
                self.revealNeighboursRecursive(tile);
            }

            if(tile.isMine){
                self.pauseMouseMovementRender = true;
                self.gameLost(function(){
                    tile.exploded = true;
                    self.revealMines();
                    self.pauseMouseMovementRender = false;
                }, 100);
            }else if(tile.adjacentMines == 0){

            }

            tile.isOpen = true;

            if(self.countClosedTiles() == self.mines){
                self.gameWon();
            }
            self.render();
        });

        this.events.on('tile.rightClick', function(tile) {
            if(tile.isFlag){
                tile.isFlag = false;
            }else{
                tile.isFlag = true;
            }
            self.render();
        });

        this.events.on('tile.onHover', function(tile) {
            var position = tile.getCoords();
            if(tile.isHovered && !self.pauseMouseMovementRender){
                self.render();
            }
        });
    }

    getRandomInt(min, max, floor = false){
        var number = Math.random() * (max - min) + min;
        if(floor){
            number = Math.floor(number);
        }

        return number;
    }

    generateMines(base){
        var minesPlaced = 0;
        var blackList = this.getTileNeighbourCoords(base.x, base.y);
        var inBlacklist = function(x, y) {
            for(var i in blackList){
                var coords = blackList[i];
                if(coords[0] == x && coords[1] == y){
                    return true;
                }
            }
            return false;
        }
        var self = this;
        while(minesPlaced < this.mines){
            var randomCol = this.getRandomInt(0, this.cols, true);
            var randomRow = this.getRandomInt(0, this.rows, true);
            var tile = this.getTileFromCoords(randomCol, randomRow);

            if(JSON.stringify(base) == JSON.stringify(tile) || inBlacklist(tile.x, tile.y)){
                continue;
            }

            if(!tile.isMine){
                tile.isMine = true;
                this.getTileFromCoords(randomCol, randomRow).isMine = true;
                minesPlaced++;
            }
        }

        this.minesGenerated = true;

        this.board.forEach(function(row) {
            row.forEach(function(tile) {
                var neighbours = self.getTileNeighbours(tile);
                neighbours.forEach(function(el) {
                    if(el.isMine){
                        tile.adjacentMines++;
                    }
                });
            });
        });
    }

    loadSprites(callback){
        var tileSize = this.getTileSize();
        var loader = new SpriteLoader();
        loader.add('tile','img/tile.png', tileSize);
        loader.add('mine','img/mine.png', tileSize);
        loader.add('flag','img/flag.png', tileSize);
        loader.add('open','img/open.png', tileSize);
        loader.load(callback);
    }

    getTileSize(){
        return Math.floor(this.width/this.cols);
    }

    generateBoard(){
        this.board = [];

        for(var y = 0; y < this.rows; y++){
            var row = [];
            for(var x = 0; x < this.cols; x++){
                var tileSize = this.getTileSize();
                row.push(new Tile(tileSize, x, y));
            }

            this.board.push(row);
        }
    }

    getFontColor(number){
        switch(number){
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

    render(){
        var c = this.canvas.getContext('2d');
        c.clearRect(0,0,this.width,this.height);
        for(var i in this.board){
            var row = this.board[i];
            for(var j in row){
                var tile = row[j];
                var tileSize = this.getTileSize();
                var position = tile.getPosition();
                var sprite = this.sprites[tile.getSprite()];
                c.drawImage(sprite, position.x, position.y, tileSize, tileSize);

                if(tile.isOpen && !tile.isMine && tile.adjacentMines != 0){
                    var pos = tile.getCenterPosition();
                    var fontSize = Math.floor(tileSize * 0.6);
                    c.font = "bold " + fontSize + "px Courier";
                    c.textAlign = "center";
                    c.textBaseline = "middle";
                    c.fillStyle = this.getFontColor(tile.adjacentMines);
                    c.fillText(tile.adjacentMines, pos.x, pos.y);
                }

                if(tile.isHovered && !tile.isOpen){
                    c.fillStyle = "rgba(0, 0, 0, 0.05)";
                    c.fillRect(position.x, position.y, tileSize, tileSize);
                }else if(tile.exploded){
                    c.fillStyle = "rgba(255, 0, 0, 0.2)";
                    c.fillRect(position.x, position.y, tileSize, tileSize);
                }
            }
        }
    }
}

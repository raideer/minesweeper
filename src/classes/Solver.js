class Solver{
    constructor(game){
        this.game = game;
        this.solved = false;
        this.solvedTiles = [];
        this.debug = false;
    }

    solve(){
        var self = this;
        var firstTileX = Math.floor(this.game.cols / 2);
        var firstTileY = Math.floor(this.game.rows / 2);
        var timeout;

        var func = function() {
            self.run(firstTileX, firstTileY);
            timeout = setTimeout(func, 200);
        }

        func();

        this.game.events.on('game.end', function() {
            clearTimeout(timeout);
        });

        setTimeout(function() {
            clearTimeout(timeout);
        }, 7000);
    }

    isSolved(x, y){
        for(var i in this.solvedTiles){
            var coords = this.solvedTiles[i];
            if(coords[0] == x && coords[1] == y){
                return true;
            }
        }
        return false;
    }

    run(x, y){
        var tile = this.game.getTileFromCoords(x, y);
        if(tile == null){
            return;
        }

        if(!tile.isOpen){
            this.clickOnTile(x, y);
        }

        this.attemptFlagging();
        this.attemptClicking();

    }

    attemptClicking(){
        for(var i in this.game.board){
            var row = this.game.board[i];
            for(var k in row){
                var tile = row[k];
                if(!tile.isOpen || tile.adjacentMines == 0 || this.isSolved(tile.x, tile.y)){
                    continue;
                }
                var flaggedNeighbours = 0;
                var closedNeighbours = this.game.getTileNeighbours(tile, true);

                for(var j in closedNeighbours){
                    var n = closedNeighbours[j];
                    if(n.isFlag){
                        flaggedNeighbours++;
                    }
                }

                if(tile.adjacentMines == flaggedNeighbours){
                    for(var j in closedNeighbours){
                        var n = closedNeighbours[j];
                        if(!n.isFlag){
                            this.clickOnTile(n.x, n.y);
                        }
                    }
                }
            }
        }
    }

    attemptFlagging(){
        for(var i in this.game.board){
            var row = this.game.board[i];
            for(var k in row){
                var tile = row[k];
                if(!tile.isOpen || tile.adjacentMines == 0 || this.isSolved(tile.x, tile.y)){
                    continue;
                }

                var closedNeighbours = this.game.getTileNeighbours(tile, true);

                if(tile.adjacentMines == closedNeighbours.length){
                    for(var j in closedNeighbours){
                        var n = closedNeighbours[j];
                        if(!n.isFlag){
                            this.flagTile(n.x, n.y);
                        }
                    }
                }
            }
        }
    }

    clickOnTile(x, y){
        var tile = this.game.getTileFromCoords(x, y);
        if(tile != null){
            this.game.events.emit('tile.leftClick', tile);
        }
    }

    flagTile(x, y){
        this.solvedTiles.push([x, y]);
        var tile = this.game.getTileFromCoords(x, y);
        if(tile != null){
            this.game.events.emit('tile.rightClick', tile);
        }
    }
}

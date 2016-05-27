
var game = {
    g: null,
    create: function(canvas, bombs = 5, cols = 10, rows = 10){
        if(cols*rows <= bombs){
            return alert("Invalid size/bomb amount");
        }

        this.g = new Minesweeper(canvas, cols, rows, bombs);
    }
}

window.onload = function() {
    var canvas = document.querySelector('#game');
    game.create(canvas, 10);
}

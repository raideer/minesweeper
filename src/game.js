
var game = {
    events: new EventHandler(),
    init: function (canvas, bombs, cols, rows) {
        this.g = new Minesweeper(canvas, bombs, cols, rows);
        this.time = 0;
        this.loop = null;
    },
    create: function(canvas, bombs = 40, cols = 16, rows = 16){
        if(this.loop != null){
            this.stopTime();
        }
        this.init(canvas, bombs, cols, rows);
        var self = this;
        if(cols*rows <= bombs){
            return alert("Invalid size/bomb amount");
        }

        this.g.addStartListener(function() {
            self.startTime();
            self.events.emit('game.start');
        });

        this.g.addEndListener(function(game) {
            self.stopTime();
            self.events.emit('game.stop', game);

            if(game.won){
                alert('You won!');
            }
        });
    },
    startTime: function() {
        var self = this;
        this.loop = setTimeout(tick, 1000);
        function tick(){
            self.time++;
            self.events.emit('time.tick', self.time);
            self.loop = setTimeout(tick, 1000);
        }
    },
    stopTime: function() {
        clearTimeout(this.loop);
    }
}

window.onload = function() {
    var canvas = document.querySelector('#game');
    document.querySelector('#newGame').onclick = function() {
        game.create(canvas);
        document.querySelector('#timer').innerHTML = "000";
    }
    game.create(canvas);
    game.events.on('time.tick', function(time) {
        document.querySelector('#timer').innerHTML = ('000' + time).substr(-3);
    });
}

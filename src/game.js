
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

    var difficulties = [
        [10, 9, 9, 500, 500],
        [40, 16, 16, 500, 500],
        [99, 30, 16, 800, 500]
    ];

    function setDifficulty(dif){
        var data = difficulties[dif];
        newGame(canvas, data[0], data[1], data[2]);
    }

    function newGame(canvas, m, x, y){
        game.create(canvas, m, x, y);
        document.querySelector('#timer').innerHTML = "000";
    }

    document.querySelector('#newGame').onclick = function() {
        newGame(canvas)
    }

    $('.difficulty').click(function() {
        var dif = $(this).data("difficulty");
        var d = difficulties[dif];
        $('#container').width(d[3]).height(d[4]);
        canvas.width = d[3];
        canvas.height = d[4];
        setDifficulty(dif);
        $('.difficulty').removeClass('grey');
        $(this).addClass('grey');
    });

    game.create(canvas);
    game.events.on('time.tick', function(time) {
        document.querySelector('#timer').innerHTML = ('000' + time).substr(-3);
    });
}

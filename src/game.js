
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

        this.handleEvents();
    },
    handleEvents: function () {
        var self = this;
        this.g.events.on('game.start', function() {
            self.startTime();
            self.events.emit('game.start');
        });

        this.g.events.on('game.end', function(game) {
            self.stopTime();
            self.events.emit('game.stop', game);
        });

        this.g.events.on('tile.flag', function(state) {
            self.events.emit('tile.flag', state);
        });
    },
    stop: function() {
        this.g.stop();
    },
    startTime: function() {
        var self = this;
        this.loop = setTimeout(tick, 100);
        function tick(){
            self.time++;
            self.events.emit('time.tick', self.time);
            self.loop = setTimeout(tick, 100);
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

    var difficulty = 1;

    function createGame(){
        var d = difficulties[difficulty];
        $('#container').width(d[3]).height(d[4]);
        $('#mines').html(d[0]);
        canvas.width = d[3];
        canvas.height = d[4];
        game.create(canvas, d[0], d[1], d[2]);
    }

    $('#newGame').click(function (){
        var state = $(this).data('state');
        if(state == 0){
            createGame();
        }else{
            game.stop();
        }
    });

    $('#autoSolve').click(function() {
        game.g.whenLoaded(function () {
            var solver = new Solver(game.g);
            solver.solve();
        });
    });

    $('.difficulty').click(function() {
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

    game.events.on('game.stop', function(g) {
        $('#newGame').html('New game').data('state', 0);
        if(g.won){
            var time = $('#timer').html();
            $('#won .time').html(time/10);
            $('#won').modal('show');
        }
    });

    game.events.on('tile.flag', function(flagged) {
        var mines = $('#mines');
        if(flagged){
            mines.html(mines.html() - 1);
        }else{
            mines.html(parseInt(mines.html())+ 1);
        }
    });

    game.events.on('time.tick', function(time) {
        $('#timer').html(('0000' + time).substr(-4));
    });
}


/* Game namespace */
var game = {

    data : {
        score : 0
    },
    players: {},
    
    // Run on page load.
    "onload" : function () {
        // Initialize the video.
        if (!me.video.init("screen", me.video.CANVAS, 640, 480, true, "auto")) {
            alert("Your browser does not support HTML5 canvas.");
            return;
        }

        // add "#debug" to the URL to enable the debug Panel
        if (document.location.hash === "#debug") {
         window.onReady(function () {
             me.plugin.register.defer(this, debugPanel, "debug");
         });
        }

        me.audio.init("mp3,ogg");
        // Set a callback to run when loading is complete.
        me.loader.onload = this.loaded.bind(this);
        me.loader.preload(game.resources);
        // Initialize melonJS and display a loading screen.
        me.state.change(me.state.LOADING);
    },

    // Run on game resources loaded.
    "loaded" : function () {
        me.state.set(me.state.PLAY, new game.PlayScreen());

        me.pool.register("mainPlayer", game.PlayerEntity);
        me.pool.register("otherPlayer", game.OtherPlayerEntity);
        me.pool.register("CoinEntity", game.CoinEntity);
        me.pool.register("EnemyEntity", game.EnemyEntity);
         
        me.input.bindKey(me.input.KEY.LEFT, "left");
        me.input.bindKey(me.input.KEY.RIGHT, "right");
        me.input.bindKey(me.input.KEY.SPACE, "jump", true);
         
        // start the game 
        me.state.change(me.state.PLAY);
    },

    "updatePlayerState": function(data) {
        var player = this.players[data.id];
        if (player) {
            console.log(player);
            player.state = data.state;
            player.pos.x = data.pos.x;
            player.pos.y = data.pos.y;
        }
    },

    "addMainPlayer" : function(data) {
        if (!data)
            return;

        this.mainPlayer = me.pool.pull('mainPlayer', data.pos.x, data.pos.y, {
            image: 'chara1',
            width: 32,
            height: 32,
            id: data.id,
            getShape: function () {
                return new me.PolyShape(0, 0, [
                    new me.Vector2d(), new me.Vector2d(0, 32),
                    new me.Vector2d(32, 32), new me.Vector2d(32, 0)
                ]);
            }
        });

        this.players[data.id] = this.mainPlayer;
        me.game.world.addChild(this.mainPlayer, 100);
    },

    "addEnemy" : function(data) {
        if (!data || this.players[data.id])
            return;

        console.log(data);

        var newPlayer = me.pool.pull('OtherPlayer', data.pos.x, data.pos.y, {
            image: 'chara1',
            width: 32,
            height: 32,
            id: data.id,
            getShape: function () {
                return new me.PolyShape(0, 0, [
                    new me.Vector2d(), new me.Vector2d(0, 32),
                    new me.Vector2d(32, 32), new me.Vector2d(32, 0)
                ]);
            }
        });

        this.players[data.id] = newPlayer;
        me.game.world.addChild(newPlayer, 100);
    },
};
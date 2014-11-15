game.PlayScreen = me.ScreenObject.extend({
	/**
	 *  action to perform on state change
	 */
	onResetEvent: function() {
		me.levelDirector.loadLevel("area01");
		game.data.score = 0;

		this.HUD = new game.HUD.Container();
		me.game.world.addChild(this.HUD);
		game.gameReady();

		// me.audio.playTrack("DST-InertExponent");
	},

	/**
	 *  action to perform when leaving this screen (state change)
	 */
	onDestroyEvent: function() {
		me.game.world.removeChild(this.HUD);

		// me.audio.stopTrack();
	}
});

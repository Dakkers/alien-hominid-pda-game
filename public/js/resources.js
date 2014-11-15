game.resources = [

	/**
	* Graphics.
	*/
	// our level tileset
	{name: "area01_level_tiles",  type:"image", src: "data/img/map/area01_level_tiles.png"},
	// our metatiles
	{name: "metatiles32x32",  type:"image", src: "data/img/map/metatiles32x32.png"},
	// main player
	{name: "chara1", type:"image", src: "data/img/sprite/chara1.png"},
	// parallax background
	{name: "area01_bkg0",         type:"image", src: "data/img/area01_bkg0.png"},
	{name: "area01_bkg1",         type:"image", src: "data/img/area01_bkg1.png"},
	// the spinning coin spritesheet
	{name: "spinning_coin_gold",  type:"image", src: "data/img/sprite/spinning_coin_gold.png"},
	// our enemty entity
	{name: "wheelie_right",       type:"image", src: "data/img/sprite/wheelie_right.png"},
	// game font
	{name: "32x32_font",          type:"image", src: "data/img/font/32x32_font.png"},


	/* 
	* Maps. 
	*/
	{name: "area01", type: "tmx", src: "data/map/area01.tmx"},

	/* Atlases 
	 * @example
	 * {name: "example_tps", type: "tps", src: "data/img/example_tps.json"},
	 */

	// music
	{name: "dst-inertexponent", type: "audio", src: "data/bgm/"},

	// sound fx
	{name: "cling", type: "audio", src: "data/sfx/"},
	{name: "stomp", type: "audio", src: "data/sfx/"},
	{name: "jump",  type: "audio", src: "data/sfx/"}
];

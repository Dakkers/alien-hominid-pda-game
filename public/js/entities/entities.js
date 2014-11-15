/*------------------- 
a player entity
-------------------------------- */
game.PlayerEntity = me.Entity.extend({

    /* -----
    constructor
    ------ */

    init: function(x, y, settings) {
        // call the constructor 
        settings.x = x;
        settings.y = y;
        this._super(me.Entity, 'init', [x, y, settings]);

        // animations of sorts
        this.renderable.anim = {};
        this.renderable.addAnimation("stand", [0]);
        this.renderable.addAnimation("walk", [1, 2]);
        this.renderable.addAnimation("jump", [3]);
        this.renderable.addAnimation("death1", [5,6,7,8]);
        this.renderable.setCurrentAnimation("stand");


        // set up for double jumping
        this.jumpsRemaining = 2;

        // player states
        this.dying = false;

        // length of death animation, kinda
        this.deathTimer = 0;

        // set the default horizontal & vertical speed (accel vector)
        this.body.setVelocity(3, 15);

        // set the display to follow our position on both axis
        me.game.viewport.follow(this.pos, me.game.viewport.AXIS.BOTH);


    },
 
    /* -----
    update the player pos
    ------ */
    update: function(dt) {

        if (!this.dying) {
            if (me.input.isKeyPressed('left')) {
                // flip the sprite on horizontal axis
                this.flipX(true);
                // update the entity velocity
                this.body.vel.x -= this.body.accel.x * me.timer.tick;

            } else if (me.input.isKeyPressed('right')) {
                // unflip the sprite
                this.flipX(false);
                // update the entity velocity
                this.body.vel.x += this.body.accel.x * me.timer.tick;

            } else {
                this.body.vel.x = 0;
            }

            if (me.input.isKeyPressed('jump')) {

                this.jumpsRemaining = (this.body.vel.y === 0) ? 2 : this.jumpsRemaining;

                if (this.jumpsRemaining > 0) {
                    this.body.jumping = true;
                    // TODO: use trinary operator to appropriately set the jump velocity.
                    this.body.vel.y -= (this.body.maxVel.y * this.jumpsRemaining--) * me.timer.tick;
                    me.audio.play("jump");

                    if (!this.renderable.isCurrentAnimation("jump"))
                        this.renderable.setCurrentAnimation("jump");
                }

            }
        }
 
        // check & update player movement
        this.body.update(dt);

        // check for collision
        me.collision.check(this, true, this.collideHandler.bind(this), true);

        if (this.dying && this.renderable.anim["death1"].idx == 3) {
            this.renderable.animationpause = true;
            this.deathTimer -= me.timer.tick;

            if (this.deathTimer <= 0)
                me.game.world.removeChild(this);

        }

        // update animation if necessary
        if (this.body.vel.x!=0 || this.body.vel.y!=0 || this.dying) {
            // update object animation
            if (!this.body.jumping && !this.body.falling && !this.renderable.isCurrentAnimation("walk") && !this.dying) {
                this.renderable.setCurrentAnimation("walk");
                this.renderable.setAnimationFrame(0);
            }

            this._super(me.Entity, 'update', [dt]);
            return true;
        } else {
            if (!this.renderable.isCurrentAnimation("stand")) {
                this.renderable.setCurrentAnimation("stand");
                this.renderable.setAnimationFrame(0);
            }
        }
         
        // else inform the engine we did not perform
        // any update (e.g. position, animation)
        return false;
    },

    collideHandler : function(res) {
        if (res.b.body.collisionType === me.collision.types.ENEMY_OBJECT) {
            if (res.overlapV.y > 0 && !this.body.jumping) {
                // bounce!
                this.body.falling = false;
                this.body.vel.y = -this.body.maxVel.y * me.timer.tick;
                // set the jumping flag
                this.body.jumping = true;
                // play sound
                me.audio.play("stomp");
                // if player has double jumped before stomping, do not allow them to jump again
                // if player has jumped once or not at all, allow them to jump once
                this.jumpsRemaining = (this.jumpsRemaining === 0) ? 0 : 1 ;
            }
        }
    },

    dieViaEnemy: function() {
        if (!this.dying) {
            this.dying = true;
            this.body.vel.x = 0;
            this.body.vel.y = 0;
            this.renderable.setCurrentAnimation("death1");
            this.renderable.setAnimationFrame(0);
            // me.audio.play("player_death");

            this.deathTimer = 100;

        }
    }
 
});


game.CoinEntity = me.CollectableEntity.extend({
    // extending the init function is not mandatory
    // unless you need to add some extra initialization
    init: function(x, y, settings) {
        // call the parent constructor
        this._super(me.CollectableEntity, 'init', [x, y, settings]);

        this.body.onCollision = this.onCollision.bind(this);
    },

    // this function is called by the engine, when
    // an object is touched by something (here collected)
    onCollision: function() {
        // do something when collected

        // play sound effect
        me.audio.play("cling");

        // increase score
        game.data.score += 250;

        // make sure it cannot be collected "again"
        this.collidable = false;
        // remove it
        me.game.world.removeChild(this);
    }
});

/* --------------------------
an enemy Entity
------------------------ */
game.EnemyEntity = me.Entity.extend({
    init: function(x, y, settings) {
        // define this here instead of tiled
        settings.image = "wheelie_right";
         
        // save the area size defined in Tiled
        var width = settings.width;
        var height = settings.height;

        // adjust the size setting information to match the sprite size
        // so that the entity object is created with the right size
        settings.spritewidth = settings.width = 64;
        settings.spritewidth = settings.height = 64;
         
        // call the parent constructor
        this._super(me.Entity, 'init', [x, y , settings]);
         
        // set start/end position based on the initial area size
        x = this.pos.x;
        this.startX = x;
        this.endX   = x + width - settings.spritewidth;
        this.pos.x  = x + width - settings.spritewidth;

        // walking & jumping speed
        this.body.setVelocity(4, 6);
         
        // make it collidable
        this.collidable = true;
        this.type = me.game.ENEMY_OBJECT;
    },

    // call by the engine when colliding with another object
    // obj parameter corresponds to the other object (typically the player) touching this one
    onCollision: function(res, obj) {

        // res.y >0 means touched by something on the bottom
        // which mean at top position for this one
        if (this.alive && (res.y > 0) && obj.falling) {
            this.renderable.flicker(750);
        }
    },
 
    // manage the enemy movement
    update: function(dt) {
        // do nothing if not in viewport
        if (!this.inViewport)
            return false;
 
        if (this.alive) {
            if (this.walkLeft && this.pos.x <= this.startX) {
                this.walkLeft = false;
            } else if (!this.walkLeft && this.pos.x >= this.endX) {
                this.walkLeft = true;
            }
            // make it walk
            this.flipX(this.walkLeft);
            this.body.vel.x += (this.walkLeft) ? -this.body.accel.x * me.timer.tick : this.body.accel.x * me.timer.tick;
                     
        } else {
            this.body.vel.x = 0;
        }
             
        // check and update movement
        this.body.update(dt);
         
        // update animation if necessary
        if (this.body.vel.x!=0 || this.body.vel.y!=0) {
            // update object animation
            this._super(me.Entity,'update',[dt]);
            return true;
        }
        
        return false;
    }
});
game.PlayerEntity = me.Entity.extend({

    init: function(x, y, settings) {
        // call the constructor 
        settings.x = x;
        settings.y = y;
        this._super(me.Entity, 'init', [x, y, settings]);
        this.id = settings.id;

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
        this.states = {left: false, right: false, jump: false, climb: false, dying: false, falling: false}; // for animation purposes
        this.STATETHING = null;
        this.stateChanged = false;
        // length of death animation, kinda
        this.deathTimer = 0;

        this.body.setVelocity(3, 15);
    },
 
    update: function(dt) {
        var state;

        // don't allow user input during death animation
        if (!this.dying) {
            if (me.input.isKeyPressed('left')) {
                this.flipX(true);
                this.body.vel.x -= this.body.accel.x * me.timer.tick;
                for (state in this.states)
                    this.states[state] = false;
                this.states.left = true;

            } else if (me.input.isKeyPressed('right')) {
                this.flipX(false);
                this.body.vel.x += this.body.accel.x * me.timer.tick;
                for (state in this.states)
                    this.states[state] = false;
                this.states.right = true;

            } else {
                this.body.vel.x = 0;
                this.states.left = this.states.right = false;
            }

            if (me.input.isKeyPressed('jump')) {
                this.jumpsRemaining = (this.body.vel.y === 0) ? 2 : this.jumpsRemaining;

                if (this.jumpsRemaining > 0) {
                    this.body.jumping = true;
                    // TODO: use trinary operator to appropriately set the jump velocity.
                    this.body.vel.y -= (this.body.maxVel.y * this.jumpsRemaining--) * me.timer.tick;
                    me.audio.play("jump");
                    for (state in this.states)
                        this.states[state] = false;
                    this.states.jump = true;

                    if (!this.renderable.isCurrentAnimation("jump"))
                        this.renderable.setCurrentAnimation("jump");
                }
            }
        }
 
        // check & update player movement
        this.body.update(dt);
        me.collision.check(this, true, this.collideHandler.bind(this), true);

        if (this.dying && this.renderable.anim.death1.idx === 3) {
            this.renderable.animationpause = true;
            this.deathTimer -= me.timer.tick;

            if (this.deathTimer <= 0)
                me.game.world.removeChild(this);
        }

        // update animation if necessary
        if (this.body.vel.x!=0 || this.body.vel.y!=0 || this.dying) {
            // moving but not falling, jumping, dying --> walking
            if (!this.body.jumping && !this.body.falling && !this.renderable.isCurrentAnimation("walk") && !this.dying) {
                this.renderable.setCurrentAnimation("walk");
                this.renderable.setAnimationFrame(0);
            } else if (this.body.falling) {
                this.states.jump = false;
                this.states.falling = true;
            }
            this.stateChanged = true;
        } else {
            if (!this.renderable.isCurrentAnimation("stand")) {
                this.stateChanged = true;
                this.renderable.setCurrentAnimation("stand");
                this.renderable.setAnimationFrame(0);
                for (state in this.states)
                        this.states[state] = false;
            }
        }

        if (this.stateChanged) {
            console.log(this.states);
            game.socket.emit('updatePlayerState', {x: this.pos.x, y: this.pos.y}, this.states);
            this._super(me.Entity, 'update', [dt]);
            return true;
        } 
         
        // else inform the engine we did not perform any update (e.g. position, animation)
        return false;
    },

    collideHandler : function(res) {
        if (res.b.body.collisionType === me.collision.types.ENEMY_OBJECT) {
            if (res.overlapV.y > 0 && !this.body.jumping) {
                // bounce!
                this.body.falling = false;
                this.body.vel.y = -this.body.maxVel.y * me.timer.tick;
                this.body.jumping = true;
                // play sound
                me.audio.play("stomp");
                // if player has double jumped before stomping, do not allow them to jump again
                // if player has jumped once or not at all, allow them to jump once
                this.jumpsRemaining = (this.jumpsRemaining === 0) ? 0 : 1 ;
            } else {
                // INSERT DEATH HERE
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

game.OtherPlayerEntity = me.Entity.extend({
    init: function(x, y, settings) {
        this._super(me.Entity, 'init', [x, y, settings]);
        this.id = settings.id;

        // animations of sorts
        this.renderable.anim = {};
        this.renderable.addAnimation("stand", [0]);
        this.renderable.addAnimation("walk", [1, 2]);
        this.renderable.addAnimation("jump", [3]);
        this.renderable.addAnimation("death1", [5,6,7,8]);
        this.renderable.setCurrentAnimation("stand");

        this.state = {};
    },

    update: function(dt) {
        console.log(this.state);

        if (!Object.keys(this.state).length)
            return false;

        if (this.state.left) {
            this.flipX(true);
            this.renderable.setCurrentAnimation("walk");
        } else if (this.state.right) {
            this.flipX(false);
            this.renderable.setCurrentAnimation("walk");
        } else if (this.state.jump)
            this.renderable.setCurrentAnimation("jump");
        else if (this.state.walk)
            this.renderable.setCurrentAnimation("stand");

        this.state = {};
        this.updateBounds();
        this._super(me.Entity, 'update', [dt]);
        return true;
    }
});


game.CoinEntity = me.CollectableEntity.extend({
    // extending the init function is not mandatory
    // unless you need to add some extra initialization
    init: function(x, y, settings) {
        this._super(me.CollectableEntity, 'init', [x, y, settings]);
        this.body.onCollision = this.onCollision.bind(this);
    },

    onCollision: function() {
        me.audio.play("cling");
        game.data.score += 250;

        // make sure it cannot be collected "again"
        this.collidable = false;
        me.game.world.removeChild(this);
    }
});

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


function Animation(key, x, y) {
    var id = 'player-effect-'+key;
    var canvas = document.getElementById(id);
    if(canvas==undefined) {
        canvas = document.createElement("canvas");
        canvas.id = id;
        var map = document.getElementById('map');
        map.appendChild(canvas);
    }
    
    canvas.style.left = (x-35) + 'px';
    canvas.style.top = (y-80) + 'px';
    this.ctx = document.getElementById(canvas.id).getContext('2d');
    this.ctx.canvas.width = 100;
    this.ctx.canvas.height = 100;
    this.ctx.translate(50, 50);
    this.animation_step = 0;
    this.animation_timeout = false;
};

Animation.prototype.anim = function () {
    if(this.animation_step > 0)
        return;
    var that = this;
    var a = function() {
        that._anim();
    }
    clearTimeout(this.animation_timeout);
    this.animation_timeout = setInterval(a, 20);
};

Animation.prototype._anim = function () {
    if(this.animation_step > 60) {
        clearTimeout(this.animation_timeout);
        this.animation_step = 0;
        this.ctx.clearRect(-60, -60, 100, 100);
        return;
    }
    var alpha = (60 - this.animation_step) / 60;
    this.ctx.clearRect(-60, -60, 100, 100);
    this.ctx.fillStyle = "rgba(200,0,0, "+alpha+")";
    this.ctx.save();
    this.ctx.translate(-20, 0);
    this.ctx.rotate(this.animation_step/5);
    this.ctx.fillRect(-10, -10, 20, 20);
    this.ctx.restore();
    this.ctx.save();
    this.ctx.rotate(Math.PI * 2/3);
    this.ctx.translate(-20, 0);
    this.ctx.rotate(this.animation_step/5);
    this.ctx.fillRect(-10, -10, 20, 20);
    this.ctx.restore();
    this.ctx.save();
    this.ctx.rotate(2 * Math.PI * 2/3);
    this.ctx.translate(-20, 0);
    this.ctx.rotate(this.animation_step/5);
    this.ctx.fillRect(-10, -10, 20, 20);
    this.ctx.restore();
    
    this.ctx.rotate(0.1);
    this.animation_step++;
};

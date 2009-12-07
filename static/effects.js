

function Animation() {
    this.ctx = document.getElementById('canvas').getContext('2d');
    this.ctx.translate(100,100);
    this.animation_step = 0;
    this.animation_timeout = false;
};

Animation.prototype.anim = function () {
    if(this.animation_step > 0)
        return;
    this.ctx.clearRect(0, 0, 200, 200);
    var that = this;
    var a = function() {
        that._anim();
    }
    this.animation_timeout = setInterval(a, 25);
};

Animation.prototype._anim = function () {
    if(this.animation_step > 100) {
        clearTimeout(this.animation_timeout);
        this.animation_step = 0;
        return;
    }
    this.ctx.clearRect(-10, -10, 30, 30);
    this.ctx.fillStyle = "rgb(200,0,0)";
    this.ctx.fillRect(-10, -10, 20, 20);
    this.ctx.rotate(0.2);
    this.animation_step++;
};

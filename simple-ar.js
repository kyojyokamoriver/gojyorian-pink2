const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

// Screen-space placement only. No world/floor tracking or inferred walking.
export class SimpleAR {
  constructor(view, enabled, {floating = false} = {}) {
    this.floating = floating;
    this.view = view;
    this.enabled = enabled;
    this.width = this.height = 1;
    this.points = new Map();
    this.rotate = false;
    this.reset();
    this.rotateButton = document.getElementById('simple-rotate');
    this.rotateButton.addEventListener('click', () => {
      this.rotate = !this.rotate;
      this.rotateButton.setAttribute('aria-pressed', String(this.rotate));
      this.rotateButton.textContent = this.rotate ? '移動する' : '回す';
      this.record();
    });
    document.getElementById('simple-reset').addEventListener('click', () => this.reset());
    view.addEventListener('pointerdown', event => {
      if (!this.enabled() || event.button !== 0 || event.target.closest('button,a,dialog') || this.points.size >= 2) return;
      view.setPointerCapture(event.pointerId);
      this.points.set(event.pointerId,{x:event.clientX,y:event.clientY});
      this.record();
    });
    view.addEventListener('pointermove', event => {
      if (!this.enabled() || !this.points.has(event.pointerId)) return;
      this.points.set(event.pointerId,{x:event.clientX,y:event.clientY});
      const [a,b] = this.points.values(), base = this.base;
      if (!base) return;
      const cx = b ? (a.x+b.x)/2 : a.x, cy = b ? (a.y+b.y)/2 : a.y;
      if (b) {
        this.x = clamp(base.x+(cx-base.cx)/this.width,.05,.95);
        this.y = clamp(base.y+(cy-base.cy)/this.height,.08,.90);
        if (base.distance > 3) {
          this.scale = clamp(base.scale*Math.hypot(b.x-a.x,b.y-a.y)/base.distance,.16,1.4);
          const angle = Math.atan2(b.y-a.y,b.x-a.x)-base.angle;
          this.yaw = base.yaw-Math.atan2(Math.sin(angle),Math.cos(angle));
        }
      } else if (this.rotate) {
        this.yaw = base.yaw+(a.x-base.cx)*.014;
        this.pitch = clamp(base.pitch+(a.y-base.cy)*.007,-.65,.65);
      } else {
        this.x = clamp(base.x+(a.x-base.cx)/this.width,.05,.95);
        this.y = clamp(base.y+(a.y-base.cy)/this.height,.08,.90);
      }
    });
    for (const type of ['pointerup','pointercancel','lostpointercapture']) view.addEventListener(type, event => {
      if (this.points.delete(event.pointerId)) this.record();
    });
  }

  reset() {
    this.x = .5;
    this.y = .58;
    this.scale = .62;
    this.pitch = this.yaw = 0;
    this.points.clear();
    this.helpUntil = performance.now()+6500;
  }

  resize(width, height) {
    this.width = width;
    this.height = height;
    this.record();
  }

  record() {
    const [a,b] = this.points.values();
    this.base = a && {
      cx:b ? (a.x+b.x)/2 : a.x, cy:b ? (a.y+b.y)/2 : a.y,
      distance:b && Math.hypot(b.x-a.x,b.y-a.y),
      angle:b && Math.atan2(b.y-a.y,b.x-a.x),
      x:this.x, y:this.y, scale:this.scale, yaw:this.yaw, pitch:this.pitch
    };
  }

  character(now) {
    const phase = (now+1500)%3650;
    return {
      x:this.x*this.width, y:this.y*this.height+(this.floating ? Math.sin(now/1000*2.25)*Math.min(this.width,this.height)*this.scale*.045 : 0),
      size:Math.min(this.width,this.height)*this.scale,
      yaw:this.yaw, pitch:this.pitch, roll:0,
      blink:phase > 3465 && phase < 3635, phase:now
    };
  }

  shadow(ctx, obj, aspect) {
    ctx.save();
    ctx.translate(obj.x,this.y*this.height+obj.size*(aspect*.48+(this.floating ? .20 : 0)));
    ctx.scale(obj.size*.47,obj.size*.105);
    const gradient = ctx.createRadialGradient(0,0,0,0,0,1);
    gradient.addColorStop(0,'rgba(0,0,0,.32)');
    gradient.addColorStop(.5,'rgba(0,0,0,.15)');
    gradient.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(-1,-1,2,2);
    ctx.restore();
  }
}

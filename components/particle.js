// Particle System for floating ambient glow dust
export class Particle {
	constructor(x, y, angle, color) {
		this.x = x;
		this.y = y;
		const speed = 0.5 + Math.random() * 2.5;
		const spreadAngle = angle + (Math.random() - 0.5) * 0.6;
		this.vx = Math.cos(spreadAngle) * speed;
		this.vy = Math.sin(spreadAngle) * speed;
		this.size = 1 + Math.random() * 2.5;
		this.alpha = 1;
		this.decay = 0.015 + Math.random() * 0.02;
		this.color = color;
	}

	update() {
		this.x += this.vx;
		this.y += this.vy;
		this.alpha -= this.decay;
	}

	draw(ctx) {
		ctx.save();
		ctx.globalAlpha = Math.max(0, this.alpha);
		ctx.fillStyle = this.color;
		ctx.shadowColor = this.color;
		ctx.shadowBlur = 6;
		ctx.beginPath();
		ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
		ctx.fill();
		ctx.restore();
	}
}

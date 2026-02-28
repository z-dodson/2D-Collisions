// ================= VECTOR =================
class Vec2 {
    constructor(x = 0, y = 0) { this.x = x; this.y = y; }
    add(v) { return new Vec2(this.x + v.x, this.y + v.y); }
    sub(v) { return new Vec2(this.x - v.x, this.y - v.y); }
    scale(s) { return new Vec2(this.x * s, this.y * s); }
    dot(v) { return this.x * v.x + this.y * v.y; }
    length() { return Math.hypot(this.x, this.y); }
    normalize() { let l = this.length(); return l ? this.scale(1 / l) : new Vec2(); }
}

// ================= LABELS =================
let nextLabelCode = "A".charCodeAt(0);
let nextWallNumber = 1;

function getNextLabel()     { return String.fromCharCode(nextLabelCode++); }
function getNextWallLabel() { return "W" + nextWallNumber++; }

// ================= BASE BODY =================
let nextId = 1;
class Body {
    constructor() {
        this.id    = nextId++;
        this.label = getNextLabel();
        this.mass  = 1;
        this.vel   = new Vec2();
        this.selected = false;
    }
    update(dt) {
        if (this.pos) this.pos = this.pos.add(this.vel.scale(dt));
    }
}

// ================= SPHERE =================
class Sphere extends Body {
    constructor(x, y, r = 50) {
        super();
        this.pos    = new Vec2(x, y);
        this.radius = r;
    }

    draw(ctx, showArrows) {
        ctx.beginPath();
        ctx.arc(this.pos.x, this.pos.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.selected ? "#ffcc00" : "#4ec9ff";
        ctx.fill();

        ctx.fillStyle  = "white";
        ctx.font       = "bold 14px Arial";
        ctx.textAlign  = "center";
        ctx.fillText(this.label, this.pos.x, this.pos.y);

        ctx.font = "11px Arial";
        ctx.fillText(this.mass + " kg", this.pos.x, this.pos.y + 14);
        ctx.textAlign = "left";

        if (showArrows) this.drawVelocityArrow(ctx);
    }

    drawVelocityArrow(ctx) {
        if (this.vel.length() < 0.01) return;
        const dir    = this.vel.normalize();
        const length = Math.min(this.vel.length() * 25, 60);
        const end    = this.pos.add(dir.scale(length));

        ctx.strokeStyle = "#ff4444";
        ctx.lineWidth   = 2;
        ctx.beginPath();
        ctx.moveTo(this.pos.x, this.pos.y);
        ctx.lineTo(end.x, end.y);
        ctx.stroke();

        const headSize = 6;
        const angle    = Math.atan2(dir.y, dir.x);
        ctx.beginPath();
        ctx.moveTo(end.x, end.y);
        ctx.lineTo(end.x - headSize * Math.cos(angle - 0.4), end.y - headSize * Math.sin(angle - 0.4));
        ctx.lineTo(end.x - headSize * Math.cos(angle + 0.4), end.y - headSize * Math.sin(angle + 0.4));
        ctx.closePath();
        ctx.fillStyle = "#ff4444";
        ctx.fill();
    }

    contains(p) { return this.pos.sub(p).length() < this.radius; }
}

// ================= WALL =================
class Wall extends Body {
    constructor(x1, y1, x2, y2) {
        super();
        this.label = getNextWallLabel();
        this.p1    = new Vec2(x1, y1);
        this.p2    = new Vec2(x2, y2);
        this.mass  = Infinity;
    }

    midpoint() {
        return new Vec2((this.p1.x + this.p2.x) / 2, (this.p1.y + this.p2.y) / 2);
    }

    rotateHandlePos() {
        const mid     = this.midpoint();
        const wallVec = this.p2.sub(this.p1).normalize();
        const perp    = new Vec2(-wallVec.y, wallVec.x);
        return mid.add(perp.scale(30));
    }

    draw(ctx) {
        ctx.strokeStyle = this.selected ? "#ffcc00" : "#fff";
        ctx.lineWidth   = 10;
        ctx.lineCap     = "round";
        ctx.beginPath();
        ctx.moveTo(this.p1.x, this.p1.y);
        ctx.lineTo(this.p2.x, this.p2.y);
        ctx.stroke();

        const mid = this.midpoint();
        ctx.fillStyle  = "rgba(255,255,255,0.85)";
        ctx.font       = "bold 13px Arial";
        ctx.textAlign  = "center";
        ctx.fillText(this.label, mid.x, mid.y - 14);
        ctx.textAlign  = "left";

        if (this.selected) {
            for (const pt of [this.p1, this.p2]) {
                ctx.beginPath();
                ctx.arc(pt.x, pt.y, 7, 0, Math.PI * 2);
                ctx.fillStyle   = "#ffcc00";
                ctx.fill();
                ctx.strokeStyle = "#333";
                ctx.lineWidth   = 1.5;
                ctx.stroke();
            }

            const rh = this.rotateHandlePos();
            ctx.setLineDash([4, 3]);
            ctx.strokeStyle = "rgba(255,200,0,0.5)";
            ctx.lineWidth   = 1.5;
            ctx.beginPath();
            ctx.moveTo(mid.x, mid.y);
            ctx.lineTo(rh.x, rh.y);
            ctx.stroke();
            ctx.setLineDash([]);

            ctx.beginPath();
            ctx.arc(rh.x, rh.y, 9, 0, Math.PI * 2);
            ctx.fillStyle   = "#ff9933";
            ctx.fill();
            ctx.strokeStyle = "#fff";
            ctx.lineWidth   = 1.5;
            ctx.stroke();

            ctx.strokeStyle = "#fff";
            ctx.lineWidth   = 1.5;
            ctx.beginPath();
            ctx.arc(rh.x, rh.y, 4.5, 0.4, Math.PI * 1.7);
            ctx.stroke();
            const arrowAngle = Math.PI * 1.7;
            const ax = rh.x + 4.5 * Math.cos(arrowAngle);
            const ay = rh.y + 4.5 * Math.sin(arrowAngle);
            ctx.beginPath();
            ctx.moveTo(ax, ay);
            ctx.lineTo(ax + 3, ay - 2);
            ctx.lineTo(ax - 1, ay - 3.5);
            ctx.closePath();
            ctx.fillStyle = "#fff";
            ctx.fill();
        }
    }

    containsRotateHandle(p) {
        return this.selected && this.rotateHandlePos().sub(p).length() < 12;
    }

    contains(p) {
        if (this.containsRotateHandle(p)) return false;
        const wallVec = this.p2.sub(this.p1);
        const len     = wallVec.length();
        if (len === 0) return false;
        const t = p.sub(this.p1).dot(wallVec) / wallVec.dot(wallVec);
        if (t < -0.05 || t > 1.05) return false;
        const d = Math.abs(
            (this.p2.y - this.p1.y) * p.x -
            (this.p2.x - this.p1.x) * p.y +
            this.p2.x * this.p1.y -
            this.p2.y * this.p1.x
        ) / len;
        return d < 10;
    }
}

// ================= PHYSICS ENGINE =================
class PhysicsEngine {
    constructor() {
        this.bodies         = [];
        this.restitutionMap = new Map();
    }

    add(b) { this.bodies.push(b); }

    key(a, b) { return [a.label, b.label].sort().join("|"); }

    getRestitution(a, b)      { return this.restitutionMap.get(this.key(a, b)) ?? 0.9; }
    setRestitution(a, b, val) { this.restitutionMap.set(this.key(a, b), val); }

    step(dt) {
        for (let b of this.bodies) b.update(dt);

        for (let i = 0; i < this.bodies.length; i++) {
            for (let j = i + 1; j < this.bodies.length; j++) {
                const a = this.bodies[i], b = this.bodies[j];
                if      (a instanceof Sphere && b instanceof Sphere) this.resolveSphereSphere(a, b);
                else if (a instanceof Sphere && b instanceof Wall)   this.resolveSphereWall(a, b);
                else if (a instanceof Wall   && b instanceof Sphere) this.resolveSphereWall(b, a);
            }
        }
    }

    resolveSphereSphere(a, b) {
        const diff = b.pos.sub(a.pos);
        const dist = diff.length();
        const min  = a.radius + b.radius;
        if (dist >= min) return;

        const n             = diff.normalize();
        const relVel        = b.vel.sub(a.vel);
        const velAlongNormal = relVel.dot(n);
        if (velAlongNormal > 0) return;

        const e       = this.getRestitution(a, b);
        const j       = -(1 + e) * velAlongNormal / (1 / a.mass + 1 / b.mass);
        const impulse = n.scale(j);

        a.vel = a.vel.sub(impulse.scale(1 / a.mass));
        b.vel = b.vel.add(impulse.scale(1 / b.mass));

        const correction = n.scale((min - dist) / 2);
        a.pos = a.pos.sub(correction);
        b.pos = b.pos.add(correction);
    }

    resolveSphereWall(sphere, wall) {
        const wallVec = wall.p2.sub(wall.p1);
        const t       = Math.max(0, Math.min(1,
            sphere.pos.sub(wall.p1).dot(wallVec) / wallVec.dot(wallVec)
        ));
        const closest = wall.p1.add(wallVec.scale(t));
        const diff    = sphere.pos.sub(closest);
        const dist    = diff.length();
        if (dist >= sphere.radius) return;

        const normal         = diff.normalize();
        sphere.pos           = sphere.pos.add(normal.scale(sphere.radius - dist));
        const velAlongNormal = sphere.vel.dot(normal);
        if (velAlongNormal > 0) return;

        const restitution = this.getRestitution(sphere, wall);
        sphere.vel = sphere.vel.sub(normal.scale((1 + restitution) * velAlongNormal));
    }
}

// ================= UI =================
class UI {
    constructor(engine, canvas) {
        this.engine  = engine;
        this.canvas  = canvas;
        this.ctx     = canvas.getContext("2d");
        this.selected = null;

        this.dragMode   = null;
        this.dragOffset = null;

        this.showArrows = true;
        this.running    = false;

        // Which velocity tab is active: 'xy' or 'sd'
        this.activeVelTab = "xy";

        playPause.onclick    = () => {
            this.running = !this.running;
            playPause.innerText = this.running ? "⏸ Pause" : "▶ Play";
        };
        toggleArrows.onclick = () => {
            this.showArrows = !this.showArrows;
            toggleArrows.innerText = this.showArrows ? "Velocity Arrows On" : "Velocity Arrows Off"

        };

        this.resize();
        window.addEventListener("resize", () => this.resize());

        canvas.addEventListener("mousedown", e => this.mouseDown(e));
        canvas.addEventListener("mousemove", e => this.mouseMove(e));
        canvas.addEventListener("mouseup",   () => this.mouseUp());

        this.setupEditor();
        this.setupVelTabs();
    }

    resize() {
        this.canvas.width  = window.innerWidth  - 260;
        this.canvas.height = window.innerHeight;
    }

    getMouse(e) {
        const r = this.canvas.getBoundingClientRect();
        return new Vec2(e.clientX - r.left, e.clientY - r.top);
    }

    select(obj) {
        if (this.selected) this.selected.selected = false;
        this.selected = obj;

        if (obj) {
            obj.selected = true;
            noSel.style.display  = "none";
            editor.style.display = "block";
            this.loadEditor();
        } else {
            editor.style.display = "none";
            noSel.style.display  = "block";
        }
    }

    mouseDown(e) {
        const p = this.getMouse(e);

        if (this.selected instanceof Wall && this.selected.containsRotateHandle(p)) {
            this.dragMode = "wallRotate";
            return;
        }

        for (let b of this.engine.bodies) {
            if (b.contains && b.contains(p)) {
                this.select(b);
                if (b instanceof Sphere) {
                    this.dragMode = "sphere";
                } else if (b instanceof Wall) {
                    this.dragMode   = "wall";
                    this.dragOffset = p.sub(b.p1);
                }
                return;
            }
        }

        this.select(null);
        this.dragMode = null;
    }

    mouseMove(e) {
        const p = this.getMouse(e);

        if (this.dragMode === "sphere" && this.selected instanceof Sphere) {
            this.selected.pos = p;

        } else if (this.dragMode === "wall" && this.selected instanceof Wall) {
            const wall    = this.selected;
            const wallVec = wall.p2.sub(wall.p1);
            wall.p1 = p.sub(this.dragOffset);
            wall.p2 = wall.p1.add(wallVec);

        } else if (this.dragMode === "wallRotate" && this.selected instanceof Wall) {
            const wall    = this.selected;
            const mid     = wall.midpoint();
            const halfLen = wall.p2.sub(wall.p1).length() / 2;
            const angle   = Math.atan2(p.y - mid.y, p.x - mid.x);
            wall.p1 = new Vec2(mid.x - Math.cos(angle) * halfLen, mid.y - Math.sin(angle) * halfLen);
            wall.p2 = new Vec2(mid.x + Math.cos(angle) * halfLen, mid.y + Math.sin(angle) * halfLen);
        }

        if (this.selected instanceof Wall && this.selected.containsRotateHandle(p)) {
            this.canvas.style.cursor = "grab";
        } else if (this.dragMode) {
            this.canvas.style.cursor = "grabbing";
        } else {
            this.canvas.style.cursor = "default";
        }
    }

    mouseUp() {
        this.dragMode = null;
        this.canvas.style.cursor = "default";
    }

    // ── Velocity tabs ──────────────────────────────────────────────────────────

    setupVelTabs() {
        // Tab button switching
        document.querySelectorAll(".vel-tab-btn").forEach(btn => {
            btn.addEventListener("click", () => {
                const tab = btn.dataset.tab;
                if (tab === this.activeVelTab) return;

                // If there's a selected sphere, sync values before switching
                if (this.selected instanceof Sphere) {
                    if (this.activeVelTab === "xy") {
                        this._syncXYtoSD();
                    } else {
                        this._syncSDtoXY();
                    }
                }

                this.activeVelTab = tab;

                // Update button styles
                document.querySelectorAll(".vel-tab-btn").forEach(b =>
                    b.classList.toggle("active", b.dataset.tab === tab)
                );
                // Update panel visibility
                document.getElementById("tab-xy").classList.toggle("active", tab === "xy");
                document.getElementById("tab-sd").classList.toggle("active", tab === "sd");
            });
        });

        // XY inputs → update sphere vel, then mirror to SD panel
        document.getElementById("vx").addEventListener("input", () => {
            if (!(this.selected instanceof Sphere)) return;
            this.selected.vel.x = parseFloat(vx.value) || 0;
            this._syncXYtoSD();
        });
        document.getElementById("vy").addEventListener("input", () => {
            if (!(this.selected instanceof Sphere)) return;
            this.selected.vel.y = parseFloat(vy.value) || 0;
            this._syncXYtoSD();
        });

        // Speed/Dir inputs → update sphere vel, then mirror to XY panel
        document.getElementById("vspeed").addEventListener("input", () => {
            if (!(this.selected instanceof Sphere)) return;
            this._applySpeedDir();
        });
        document.getElementById("vdir").addEventListener("input", () => {
            if (!(this.selected instanceof Sphere)) return;
            this._applySpeedDir();
        });
    }

    // Convert current vel to speed+direction and fill SD inputs
    _syncXYtoSD() {
        if (!(this.selected instanceof Sphere)) return;
        const vel   = this.selected.vel;
        const speed = vel.length();
        // atan2 gives radians; convert to degrees (0° = right, 90° = down)
        const deg   = (Math.atan2(vel.y, vel.x) * 180 / Math.PI + 360) % 360;
        document.getElementById("vspeed").value = +speed.toFixed(3);
        document.getElementById("vdir").value   = +deg.toFixed(1);
    }

    // Convert current SD inputs to XY and update sphere + XY inputs
    _syncSDtoXY() {
        if (!(this.selected instanceof Sphere)) return;
        const speed = parseFloat(document.getElementById("vspeed").value) || 0;
        const deg   = parseFloat(document.getElementById("vdir").value)   || 0;
        const rad   = deg * Math.PI / 180;
        this.selected.vel.x = speed * Math.cos(rad);
        this.selected.vel.y = speed * Math.sin(rad);
        document.getElementById("vx").value = +this.selected.vel.x.toFixed(3);
        document.getElementById("vy").value = +this.selected.vel.y.toFixed(3);
    }

    // Apply SD inputs directly to the sphere and mirror to XY
    _applySpeedDir() {
        this._syncSDtoXY();  // reuses the same logic
    }

    // ── Editor ─────────────────────────────────────────────────────────────────

    setupEditor() {
        document.getElementById("mass").addEventListener("input", () => {
            if (this.selected) this.selected.mass = parseFloat(mass.value) || 1;
        });
    }

    loadEditor() {
        const s = this.selected;
        labelTitle.innerText = "Object " + s.label;
        mass.value = isFinite(s.mass) ? s.mass : "∞";

        const vx = document.getElementById("vx");
        const vy = document.getElementById("vy");

        if (s.vel) {
            vx.value = +s.vel.x.toFixed(3);
            vy.value = +s.vel.y.toFixed(3);
            // Also fill SD panel
            this._syncXYtoSD();
        }

        restMatrix.innerHTML = "";
        for (let other of this.engine.bodies) {
            if (other === s) continue;
            const val = this.engine.getRestitution(s, other);
            const row = document.createElement("div");
            row.className = "reRow";
            row.innerHTML = `${other.label}: <input type="number" step="0.1" min="0" max="1" value="${val}">`;
            row.querySelector("input").addEventListener("input", ev => {
                this.engine.setRestitution(s, other, parseFloat(ev.target.value));
            });
            restMatrix.appendChild(row);
        }
    }

    // ── Grid & draw ────────────────────────────────────────────────────────────

    drawGrid() {
        const ctx     = this.ctx;
        const w       = this.canvas.width;
        const h       = this.canvas.height;
        const spacing = 50;

        ctx.save();
        ctx.strokeStyle = "rgba(255,255,255,0.07)";
        ctx.lineWidth   = 1;

        for (let x = 0; x <= w; x += spacing) {
            ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
        }
        for (let y = 0; y <= h; y += spacing) {
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
        }

        ctx.restore();
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.drawGrid();
        this.ctx.font = "14px Arial";

        for (let b of this.engine.bodies) {
            if (b instanceof Sphere) b.draw(this.ctx, this.showArrows);
            else b.draw(this.ctx);
        }
    }
}

// ================= BOOT =================
const canvas = document.getElementById("canvas");
const engine = new PhysicsEngine();
const ui     = new UI(engine, canvas);

addSphere.onclick = () => engine.add(new Sphere(200, 200, 50));
addWall.onclick   = () => engine.add(new Wall(100, 300, 500, 300));

let last = 0;
function loop(t) {
    const dt = (t - last) / 10;
    last = t;
    if (ui.running) engine.step(dt);
    ui.draw();
    requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
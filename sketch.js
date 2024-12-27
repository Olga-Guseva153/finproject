let player;
let floor;
let countCanyons = 1;
let countCoins = 10;
let countEnemies = 4;
let canyons = [];
let coins = [];
let enemies = [];
let eyeOpen = true;
let blinkTimer = 0;
let score = 0;
let background;
let shotSound = new Audio("shotSound.wav");
let jumpSound = new Audio("jumpSound.wav");
let backMusic = new Audio("backMusic.wav");
let coinSound = new Audio("coinSound.wav");

function preload() {
    background = loadImage("background.jpg");
}

function setup() {
    createCanvas(1878, innerHeight);

    backMusic.volume = 0.3;

    floor = {
        x: 0,
        height: 200,
        color: color(10, 100, 10),
        draw: function () {
            fill(this.color);
            rect(this.x, innerHeight - this.height, width, this.height);
        }
    };

    for (let i = 0; i < countCanyons; i++) {
        canyons.push({
            x: 250 + i * 400,
            y: innerHeight - floor.height,
            width: 100,
            draw: function () {
                fill(100);
                rect(this.x, this.y, this.width, floor.height);
            }
        });
    }

    // Create multiple enemies
    for (let i = 0; i < countEnemies; i++) {
        enemies.push({
            x: 300 + i * 200,
            y: innerHeight - floor.height - 50,
            Left: 400 + i * 200,
            Right: 700 + i * 200,
            direction: 1,
            random: 0,
            dead: false,

            draw: function () {
                if (this.dead) return;
                stroke(0);
                strokeWeight(2);
                fill(230, 117, 164);
                rect(this.x, this.y, 75, 50);
                fill(255);
                ellipse(this.x + 20, this.y + 15, 10, 10);
                ellipse(this.x + 50, this.y + 15, 10, 10);
                fill(0);
                ellipse(this.x + 20, this.y + 15, 5, 5);
                ellipse(this.x + 50, this.y + 15, 5, 5);
            },
            move: function () {
                if (this.dead) return;
                this.x += this.random * this.direction;
                if (this.x <= this.Left) {
                    this.x += this.Left - this.x;
                    this.direction *= -1;
                } else if (this.x >= this.Right) {
                    this.x -= this.x - this.Right;
                    this.direction *= -1;
                }
            }
        });
    }

    for (let i = 0; i < countCoins; i++) {
        coins.push({
            x: 350 + i * 3,
            y: innerHeight - floor.height - 50,
            size: 30,
            random: Math.floor(Math.random() * (7 - 1)) + 1,
            collected: false,

            draw: function () {
                if (this.collected) return;
                strokeWeight(2);
                stroke("orange");
                fill("yellow");
                circle(this.x * this.random, this.y, this.size);
            }
        });
    }

    player = {
        x: 100,
        y: innerHeight - floor.height,
        width: 60,
        height: 60,
        speedGravity: -5,
        color: "#b92d2d",
        grounded: false,
        dead: false,
        bullets: [],
        lastShotTime: 0,
        shootingCooldown: 500,

        draw: function () {
            fill(this.color);
            rect(this.x, this.y, this.width, this.height);
            this.drawEyes();
            this.gunDraw();
        },

        drawEyes: function () {
            fill(0);
            let eyeWidth = 10;
            let eyeHeight = 10;
            let eyeYOffset = 15;
            let eyeXOffset = 12;

            if (this.dead) {
                fill(200);
                ellipse(this.x + eyeXOffset, this.y + eyeYOffset, eyeWidth, eyeHeight);
                ellipse(this.x + this.width - eyeXOffset, this.y + eyeYOffset, eyeWidth, eyeHeight);
            } else {
                if (eyeOpen) {
                    ellipse(this.x + eyeXOffset, this.y + eyeYOffset, eyeWidth, eyeHeight);
                    ellipse(this.x + this.width - eyeXOffset, this.y + eyeYOffset, eyeWidth, eyeHeight);
                } else {
                    fill(200);
                    ellipse(this.x + eyeXOffset, this.y + eyeYOffset, eyeWidth, eyeHeight);
                    ellipse(this.x + this.width - eyeXOffset, this.y + eyeYOffset, eyeWidth, eyeHeight);
                }
            }
        },

        updateEyes: function () {
            blinkTimer++;
            if (blinkTimer > 60) {
                eyeOpen = !eyeOpen;
                blinkTimer = 0;
            }
        },

        gravity: function (floorHeight) {
            if (this.speedGravity < 15) {
                this.speedGravity++;
            }
            this.y += this.speedGravity;
            if (this.dead) {
                if (this.y > height) {
                    this.y = floorHeight;
                    this.x = 100;
                    this.dead = false;
                }
            } else if (this.y + this.height > height - floorHeight) {
                this.y = height - floorHeight - this.height;
                this.grounded = true;
            } else {
                this.grounded = false;
            }
        },

        jump: function () {
            if (this.grounded) {
                this.speedGravity = -20;
                this.grounded = false;
                jumpSound.play();
            }
        },

        moveLeft: function () {
            this.x -= 4;
        },

        moveRight: function () {
            this.x += 4;
        },

        movement: function () {
            if (this.dead) return;
            if (this.x < -10) this.x = innerWidth + 5;
            if (this.x > innerWidth + 10) this.x = -5;
            if (this.grounded && keyIsDown(87)) this.jump();
            if (keyIsDown(68)) this.moveRight();
            if (keyIsDown(65)) this.moveLeft();
        },

        checkCanyon: function () {
            for (let i = 0; i < canyons.length; i++) {
                if (
                    this.y + this.height >= height - floor.height &&
                    this.x > canyons[i].x &&
                    this.x + this.width < canyons[i].x + canyons[i].width
                ) {
                    this.grounded = false;
                    this.dead = true;
                    this.speedGravity = 3;
                }
            }
        },

        checkCollisionWithCoins: function () {
            for (let coin of coins) {
                if (!coin.collected) {
                    let coinX = coin.x * coin.random;
                    let coinY = coin.y;
                    let d = dist(this.x + this.width / 2, this.y + this.height / 2, coinX, coinY);

                    if (d < (coin.size + this.width) / 2) {
                        coin.collected = true;
                        score += 5;
                        coinSound.play();
                    }
                }
            }
        },

        gunDraw: function () {
            noStroke();
            fill(0);
            rect(this.x + this.width, this.y + this.height / 2 - 5, 10, 10);
            rect(this.x + this.width + 10, this.y + this.height / 2 - 2, 30, 4);
        },

        canShoot: function () {
            const currentTime = millis();
            return currentTime - this.lastShotTime >= this.shootingCooldown;
        },

        gunShot: function () {
            if (this.canShoot()) {
                let newBullet = {
                    x: this.x + this.width + 40,
                    y: this.y + this.height / 2,
                    speed: 10,
                    size: 5,
                    color: color(0)
                };
                this.bullets.push(newBullet);
                this.lastShotTime = millis();
                shotSound.play();
            }
        },

        bulletUpdate: function () {
            for (let i = this.bullets.length - 1; i >= 0; i--) {
                let b = this.bullets[i];
                b.x += b.speed;

                // Check collision with enemies
                for (let enemy of enemies) {
                    if (b.x > enemy.x && b.x < enemy.x + 75 && b.y > enemy.y && b.y < enemy.y + 50 && !enemy.dead) {
                        enemy.dead = true;
                        score += 10; // Add 5 points for killing an enemy
                        this.bullets.splice(i, 1);
                        break;
                    }
                }

                if (b.x > width) {
                    this.bullets.splice(i, 1);
                }
            }
        },

        bulletDraw: function () {
            fill(0);
            noStroke();
            for (let bullet of this.bullets) {
                ellipse(bullet.x, bullet.y, bullet.size, bullet.size);
            }
        },

        checkCollisionWithEnemies: function () {
            if (this.dead) return;

            for (let enemy of enemies) {
                if (
                    !enemy.dead &&
                    this.x < enemy.x + 75 &&
                    this.x + this.width > enemy.x &&
                    this.y < enemy.y + 50 &&
                    this.y + this.height > enemy.y
                ) {
                    this.dead = true;
                    this.speedGravity = 3;
                    break;
                }
            }
        }
    };
}

function restart() {
    if (player.dead) {
        score = 0;
    }
}

function drawScore() {
    fill(0);
    noStroke();
    textSize(32);
    textAlign(LEFT, TOP);
    text("Score: " + score, 20, 20);
}

function draw() {
    image(background, 0, 0, innerWidth, innerHeight);
    backMusic.play();
    floor.draw();

    for (let canyon of canyons) {
        canyon.draw();
    }

    for (let coin of coins) {
        coin.draw();
    }

    for (let enemy of enemies) {
        enemy.random = Math.floor(Math.random() * (7 - 1)) + 1;
        enemy.move();
        enemy.draw();
    }

    player.updateEyes();
    player.gravity(floor.height);
    player.movement();
    player.checkCanyon();
    player.checkCollisionWithEnemies();
    player.checkCollisionWithCoins(); // Add this line to check for coin collisions

    if (keyIsDown(70)) {
        player.gunShot();
    }

    player.bulletUpdate();
    player.bulletDraw();
    player.draw();

    drawScore();
    restart();
}

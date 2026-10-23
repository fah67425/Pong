//board
let board;
let boardwidth = 500;
let boardheight = 500;
let context;

//player
let playerwidth = 10;
let playerheight = 50;
let playervelocityY = 0;

//player1
let player1 = {
    x: 10,
    y: (boardheight - playerheight) / 2,
    width: playerwidth,
    height: playerheight,
    velocityY: playervelocityY,
};

//player2
let player2 = {
    x: boardwidth - playerwidth - 10,
    y: (boardheight - playerheight) / 2,
    width: playerwidth,
    height: playerheight,
    velocityY: playervelocityY,
};

//ball
let ballwidth = 10;
let ballheight = 10;
let ball = {
    x: boardwidth / 2,
    y: boardheight / 2,
    width: ballwidth,
    height: ballheight,
    velocityX: 1,
    velocityY: 2,
};

//score
let player1score = 0;
let player2score = 0;

//game state
let gamestarted = false;
let paused = false;
let gamemode = "bot";
let difficulty = "1";
let botspeed = 1.5;

let audiocontext;
let hitFlash = 0;

//display everything
window.onload = function () {
    board = document.getElementById("board");
    board.addEventListener("pointerdown", handleSwipe);
    board.addEventListener("pointermove", handleSwipe);
    board.height = boardheight;
    board.width = boardwidth;
    context = board.getContext("2d");


    document.getElementById("roundbtn").addEventListener("click", togglePause);
    document.getElementById("resumebtn").addEventListener("click", togglePause);
    const gamescreeen = document.getElementById("gamescreen");
    const playbutton = document.getElementById("playbutton");
    const startscreen = document.getElementById("startscreen");
    playbutton.addEventListener("click", () => {
        gamestarted = true;
        startscreen.style.display = "none";
        gamescreeen.style.display = "flex";
    });

    document.addEventListener("keydown", moveplayer);
    document.addEventListener("keyup", stopplayer);

    document.getElementById("difficulty1").addEventListener("click", () => {
        selectdifficulty("bot", 1);
    });
    document.getElementById("difficulty2").addEventListener("click", () => {
        selectdifficulty("bot", 2);
    });
    document.getElementById("difficulty3").addEventListener("click", () => {
        selectdifficulty("bot", 3);
    });
    document.getElementById("multiplayer").addEventListener("click", () => {
        selectdifficulty("multiplayer", 1);
    })

    requestAnimationFrame(update);
};

function setdifficulty(level) {
    difficulty = level;

    if (level == 1) botspeed = 1.5;
    else if (level == 2) botspeed = 2.5;
    else if (level == 3) botspeed = 4;

    player2.velocityY = 0;
}

function selectdifficulty(mode, level) {
    gamemode = mode;
    difficulty = level;

    document.querySelectorAll(".difficulty").forEach(button => {
        button.classList.remove("selected");
    });

    if (mode === "bot") {
        document.getElementById("difficulty" + level).classList.add("selected");
    } else {
        document.getElementById("multiplayer").classList.add("selected");
    }

    setdifficulty(level);
}

function playhitsound() {
    if (!audiocontext) {
        audiocontext = new AudioContext();
    }

    const oscillator = audiocontext.createOscillator();
    const gain = audiocontext.createGain();

    oscillator.type = "square";
    oscillator.frequency.value = 500;

    gain.gain.setValueAtTime(0.1, audiocontext.currentTime);
    gain.gain.exponentialRampToValueAtTime(
        0.001,
        audiocontext.currentTime + 0.08
    );

    oscillator.connect(gain);
    gain.connect(audiocontext.destination);

    oscillator.start();
    oscillator.stop(audiocontext.currentTime + 0.08);
}

function playscoresound(special5score = false) {
    if (!audiocontext) {
        audiocontext = new AudioContext();
    }

    const oscillator = audiocontext.createOscillator();
    const gain = audiocontext.createGain();

    oscillator.type = "sine";

    const now = audiocontext.currentTime;

    oscillator.frequency.setValueAtTime(
        special5score ? 880 : 440,
        now
    );

    if (special5score) {
        oscillator.frequency.setValueAtTime(1175, now + 0.12);
        oscillator.frequency.setValueAtTime(1568, now + 0.24);
    }

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(
        0.001,
        now + (special5score ? 0.4 : 0.15)
    );

    oscillator.connect(gain);
    gain.connect(audiocontext.destination);

    oscillator.start(now);
    oscillator.stop(now + (special5score ? .4 : 0.15));
}

//canvas update
function update() {
    requestAnimationFrame(update); // only one call, at the top
    context.clearRect(0, 0, board.width, board.height);

    // only move things while the game is running
    if (gamestarted && !paused) {
        let nextplayer1Y = player1.y + player1.velocityY;
        if (!outOfBounds(nextplayer1Y)) {
            player1.y = nextplayer1Y;
        }

        if (gamemode == "bot") {
            let targetY = ball.y - player2.height / 2;
            let difference = targetY - player2.y;

            if (Math.abs(difference) > 2) {
                player2.velocityY = difference > 0 ? botspeed : -botspeed;
            } else {
                player2.velocityY = 0;
            }
        }

        let nextplayer2Y = player2.y + player2.velocityY;
        if (!outOfBounds(nextplayer2Y)) {
            player2.y = nextplayer2Y;
        }

        ball.x += ball.velocityX;
        ball.y += ball.velocityY;

        // bounce off top and bottom
        if (ball.y <= 0 || ball.y + ball.height >= boardheight) {
            ball.velocityY *= -1;
        }

        // bounce off paddles
        if (detectCollision(ball, player1)) {
            if (ball.x <= player1.x + player1.width) {
                ball.velocityX *= -1;
                playhitsound();
                hitFlash = 6;
            }
        } else if (detectCollision(ball, player2)) {
            if (ball.x + ball.width >= player2.x) {
                ball.velocityX *= -1;
                playhitsound();
                hitFlash = 6;
            }
        }

        // scoring
        if (ball.x < 0) {
            player2score++;
            playscoresound(
                player2score % 5 === 0
            );

            resetGame(1);
        } else if (ball.x + ball.width > boardwidth) {
            player1score++;
            playscoresound(
                player1score % 5 === 0
            );
            resetGame(-1);
        }
    }

    // drawing always happens, so the board is visible before Start
    //context.fillStyle = "red";
    context.fillStyle = hitFlash > 0 ? "yellow" : "red";
    context.fillRect(player1.x, player1.y, player1.width, player1.height);
    context.fillRect(player2.x, player2.y, player2.width, player2.height);

    if (hitFlash > 0) {
        hitFlash--;
    }

    context.fillStyle = "purple";
    context.fillRect(ball.x, ball.y, ball.width, ball.height);

    context.fillStyle = "red";
    context.font = "45px sans-serif";
    context.fillText(player1score, boardwidth / 5, 45);
    context.fillText(player2score, (boardwidth * 4) / 5 - 45, 45);

    // center line
    for (let i = 10; i < board.height; i += 25) {
        context.fillRect(board.width / 2 - 10, i, 5, 5);
    }
}

//keep paddles inside the board
function outOfBounds(yPosition) {
    return yPosition < 0 || yPosition + playerheight > boardheight;
}

//player movement (start moving on keydown)
function moveplayer(e) {
    if (e.code == "KeyW") {
        player1.velocityY = -3;
    } else if (e.code == "KeyS") {
        player1.velocityY = 3;
    }


    if (gamemode == "multiplayer") {
        if (e.code == "KeyI") {
            player2.velocityY = -3;
        } else if (e.code == "KeyK") {
            player2.velocityY = 3;
        }
    }
}

//player movement (stop moving on keyup)
function stopplayer(e) {
    if (e.code == "KeyW" || e.code == "KeyS") {
        player1.velocityY = 0;
    }

    if (gamemode == "multiplayer") {
        if (e.code == "KeyI" || e.code == "KeyK") {
        player2.velocityY = 0;
        }
    }
}


//detect collision
function detectCollision(a, b) {
    return (
        a.x < b.x + b.width &&
        a.x + a.width > b.x &&
        a.y < b.y + b.height &&
        a.y + a.height > b.y
    );
}

//reset ball after a point
function resetGame(direction) {
    ball = {
        x: boardwidth / 2,
        y: boardheight / 2,
        width: ballwidth,
        height: ballheight,
        velocityX: direction,
        velocityY: 2,
    };
}

//pause with Space
function togglePause() {
    if (!gamestarted) return;
    paused = !paused;
    document.getElementById("pausetext").style.display = paused ? "block" : "none";
    document.getElementById("roundmenu").style.display = paused ? "block" : "none";
}

document.addEventListener("keydown", (e) => {
    if (e.code == "Space") togglePause();
});
//stoppaddle

//board.addEventListener("pointerdown", handleSwipe);
//board.addEventListener("pointermove", handleSwipe);

function handleSwipe(e) {
    if (e.pointerType == "mouse") return;
    if (!gamestarted || paused) return;

    const rect = board.getBoundingClientRect();
    const scaleY = boardheight / rect.height;

    const fingerY = (e.clientY - rect.top) * scaleY;
    player1.y = Math.max(
        0,
        Math.min(boardheight - player1.height,
            fingerY - player1.height / 2
        )
    );
}


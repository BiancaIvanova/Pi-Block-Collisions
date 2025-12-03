const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const clackSound = document.getElementById("clack");
const startBtn = document.getElementById("startBtn");
const counterDiv = document.getElementById("counter");

startBtn.addEventListener("click", () => {
    const n = parseInt(document.getElementById("digits").value);
    startSimulation(n);
});

function startSimulation(n) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const bigMass = 100 ** (n - 1);
    const smallMass = 1;

    let bigVelocity = -1;
    let smallVelocity = 0;
    let totalCollisions = 0;
    let collisionType = 1;

    let smallPos = 100;
    let bigPos = 300;

    const smallSize = 30;
    const bigSize = 50;

    let simulationFinished = false; // flag for finishing

    function step() {
        smallPos += smallVelocity;
        bigPos += bigVelocity;

        if (!simulationFinished)
        {
            // Collisions
            if (collisionType === 1 && bigPos <= smallPos + smallSize)
            {
                // block/block collision
                const newSmallVelocity = ((smallVelocity + 2 * bigMass * bigVelocity) - bigMass * smallVelocity) / (bigMass + 1);
                const newBigVelocity = ((2 * smallVelocity - bigVelocity + bigMass * bigVelocity) / (bigMass + 1));
                smallVelocity = newSmallVelocity;
                bigVelocity = newBigVelocity;
                collisionType = 2;
                totalCollisions++;
                clackSound.currentTime = 0;
                playClack();
            }
            else if (collisionType === 2 && smallPos <= 0)
            {
                // block/wall collision
                smallVelocity = -smallVelocity;
                collisionType = 1;
                totalCollisions++;
                clackSound.currentTime = 0;
                playClack();
            }

            // Stop condition: mark simulation finished
            if (bigVelocity >= 0 && smallVelocity >= 0 && bigVelocity > smallVelocity) {
                simulationFinished = true;
                counterDiv.textContent = `Total Collisions: ${totalCollisions}`;
            } else {
                counterDiv.textContent = `Collisions: ${totalCollisions}`;
            }
        }

        draw();
        requestAnimationFrame(step);
    }

    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // wall
        ctx.fillStyle = "black";
        ctx.fillRect(0, 0, 5, canvas.height);

        // small block
        ctx.fillStyle = "red";
        ctx.fillRect(smallPos, canvas.height - smallSize - 20, smallSize, smallSize);

        // big block
        ctx.fillStyle = "blue";
        ctx.fillRect(bigPos, canvas.height - bigSize - 20, bigSize, bigSize);
    }

    step();
}

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playClack() {
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(1000, audioCtx.currentTime);
    gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.01);
}

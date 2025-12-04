const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const startBtn = document.getElementById("startBtn");
const counterDiv = document.getElementById("counter");

startBtn.addEventListener("click", () => {
    const n = parseInt(document.getElementById("digits").value);
    startSimulation(n);
});

function startSimulation(n)
{
    const bigMass = 100 ** (n - 1);
    const smallMass = 1;

    const smallSize = 30;
    const bigSize = 50;

    let smallVelocity = 0;
    let bigVelocity = -1;

    let smallPos = 100;
    let bigPos = 300;

    const dt = 0.05; // precompute time step

    const positions = [];
    let totalCollisions = 0;
    let collisionType = 1;
    let finished = false;

    while (!finished)
    {
        let nextSmallPos = smallPos + smallVelocity * dt;
        let nextBigPos = bigPos + bigVelocity * dt;

        if (collisionType === 2 && nextSmallPos <= 0)
        {
            // block/wall collision
            const t = smallPos / Math.abs(smallVelocity);
            smallPos = 0;
            bigPos += bigVelocity * t;
            smallVelocity = -smallVelocity;
            collisionType = 1;
            totalCollisions++;
        }
        else if (collisionType === 1 && nextBigPos <= nextSmallPos)
        {
            // block/block collision
            const t = (bigPos - smallPos) / (smallVelocity - bigVelocity);
            smallPos += smallVelocity * t;
            bigPos += bigVelocity * t;

            const newSmallVelocity = ((smallVelocity + 2 * bigMass * bigVelocity) - bigMass * smallVelocity) / (bigMass + 1);
            const newBigVelocity = ((2 * smallVelocity - bigVelocity + bigMass * bigVelocity) / (bigMass + 1));
            smallVelocity = newSmallVelocity;
            bigVelocity = newBigVelocity;

            collisionType = 2;
            totalCollisions++;
        }
        else
        {
            smallPos = nextSmallPos;
            bigPos = nextBigPos;
        }

        if (bigVelocity >= 0 && smallVelocity >= 0 && bigVelocity > smallVelocity) {
            finished = true;
        }

        positions.push([smallPos, bigPos, totalCollisions]);
    }

    console.log("Precomputed positions:", positions);

    // save csv
    savePrecomputedCSV(positions);

    // PLAYBACK
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const totalTime = 5000; // total simulation time in ms
    const frameCount = 600; // total frames to render

    // quadratic ease-in-ease-out mapping function
    function easeInOutQuad(t) {
        return t < 0.5 ? 2*t*t : -1 + (4 - 2*t)*t;
    }

    // Precompute index mapping from linear frames to quadratic positions
    const maxIdx = positions.length - 1;
    const frameIndices = [];
    for (let i = 0; i < frameCount; i++) {
        const t = i / (frameCount - 1);           // normalized 0..1
        const eased = easeInOutQuad(t);          // quadratic ease-in-ease-out
        const idx = Math.floor(eased * maxIdx);  // map to CSV index
        frameIndices.push(idx);
    }

    let frame = 0;

    function drawStep() {
        if (frame >= frameCount)
        {
            counterDiv.textContent = `Total Collisions: ${positions[positions.length - 1][2]}`;
            return;
        }

        const idx = frameIndices[frame];
        const [sPos, bPos, collisions] = positions[idx];
        counterDiv.textContent = `Collisions: ${collisions}`;

        // only play clack if a collision occurred in the previous frame
        if (frame > 0 && collisions > positions[frameIndices[frame - 1]][2])
        {
            playClack(audioCtx);
        }

        // draw blocks
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "black";
        ctx.fillRect(0, 0, 5, canvas.height);

        ctx.fillStyle = "red";
        ctx.fillRect(sPos, canvas.height - smallSize - 20, smallSize, smallSize);

        ctx.fillStyle = "blue";
        ctx.fillRect(bPos, canvas.height - bigSize - 20, bigSize, bigSize);

        frame++;
        const delay = totalTime / frameCount;
        setTimeout(() => requestAnimationFrame(drawStep), delay);
    }

    drawStep();

}


function playClack(audioCtx)
{
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


function savePrecomputedCSV(positions)
{
    let csvContent = "smallPos,bigPos,totalCollisions\n";

    positions.forEach(row => {
        csvContent += row.join(",") + "\n";
    });

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const dlAnchor = document.createElement("a");

    dlAnchor.href = url;
    dlAnchor.download = "precomputed_simulation.csv";

    document.body.appendChild(dlAnchor);

    dlAnchor.click();
    dlAnchor.remove();
}

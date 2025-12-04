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
    const wallThickness = 5;

    let smallVelocity = 0;
    let bigVelocity = -1;

    let smallPos = 100;
    let bigPos = 300;

    const dt = 0.05; // precompute time step

    const positions = [];
    let totalCollisions = 0;
    let collisionType = 1;
    let finished = false;

    const extraTimeAfterLastClack = 10.0; // seconds to continue after last collision
    const extraSteps = Math.ceil(extraTimeAfterLastClack / dt);

    let lastCollisionStep = 0;
    let stepCount = 0;
    finished = false;

    while (true) {
        let collisionOccurred = false;

        // Compute next positions
        let nextSmallPos = smallPos + smallVelocity * dt;
        let nextBigPos = bigPos + bigVelocity * dt;

        // Only check collisions if simulation is not finished
        if (!finished) {
            // Block/wall collision
            if (collisionType === 2 && nextSmallPos <= 0) {
                const t = smallPos / Math.abs(smallVelocity);
                smallPos = 0;
                bigPos += bigVelocity * t;
                smallVelocity = -smallVelocity;
                collisionType = 1;
                totalCollisions++;
                collisionOccurred = true;
            }
            // Block/block collision
            else if (collisionType === 1 && nextBigPos <= nextSmallPos) {
                const t = (bigPos - smallPos) / (smallVelocity - bigVelocity);
                smallPos += smallVelocity * t;
                bigPos += bigVelocity * t;

                const newSmallVelocity = ((smallVelocity + 2 * bigMass * bigVelocity) - bigMass * smallVelocity) / (bigMass + 1);
                const newBigVelocity = ((2 * smallVelocity - bigVelocity + bigMass * bigVelocity) / (bigMass + 1));
                smallVelocity = newSmallVelocity;
                bigVelocity = newBigVelocity;

                collisionType = 2;
                totalCollisions++;
                collisionOccurred = true;
            } else {
                smallPos = nextSmallPos;
                bigPos = nextBigPos;
            }

            // Mark simulation finished if all collisions done
            if (bigVelocity >= 0 && smallVelocity >= 0 && bigVelocity > smallVelocity) {
                finished = true;
            }
        } else {
            // After last collision: just update positions with velocities
            smallPos += smallVelocity * dt;
            bigPos += bigVelocity * dt;
        }

        if (collisionOccurred) lastCollisionStep = stepCount;

        positions.push([smallPos, bigPos, totalCollisions]);
        stepCount++;

        // Stop only after extraSteps past last collision
        if (finished && stepCount >= lastCollisionStep + extraSteps) break;
    }


    console.log("Precomputed positions:", positions);

    // save csv
    savePrecomputedCSV(positions);

    // PLAYBACK
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const totalTime = 5000; // total simulation time in ms
    const frameCount = 600; // total frames to render

    function smoothEase(t) {
        const t1 = 0.1;
        const t2 = 0.9;

        if (t <= t1) {
            return t / t1 * 0.1; // linear start
        } else if (t >= t2) {
            return 0.9 + (t - t2) / (1 - t2) * 0.1; // linear end
        } else {
            // middle quadratic: y = a*(t-t1)^2 + b*(t-t1) + c
            const p0 = 0.1;  // y at t1
            const p1 = 0.9;  // y at t2
            const m0 = 1;    // slope at t1
            const m1 = 1;    // slope at t2

            const dt = t2 - t1;

            // solve a*(dt)^2 + b*dt + c = p1
            // derivative: 2*a*(t-t1) + b = slope
            // at t=t1: c = p0, b = m0
            const c = p0;
            const b = m0 * 0.8; // scale slope to fit middle duration
            const a = (p1 - c - b*dt) / (dt*dt);

            return a*(t - t1)**2 + b*(t - t1) + c;
        }
    }



    // Precompute index mapping from linear frames to quadratic positions
    const maxIdx = positions.length - 1;
    const frameIndices = [];
    for (let i = 0; i < frameCount; i++) {
        const t = i / (frameCount - 1);           // normalized 0..1
        const eased = smoothEase(t);          // quadratic ease-in-ease-out
        const idx = Math.floor(eased * maxIdx);  // map to CSV index
        frameIndices.push(idx);
    }

    let frame = 0;

    function drawStep()
    {
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
        ctx.fillRect(0, 0, wallThickness, canvas.height);

        ctx.fillStyle = "red";
        ctx.fillRect(sPos + wallThickness, canvas.height - smallSize - 20, smallSize, smallSize);

        ctx.fillStyle = "blue";
        ctx.fillRect(bPos + (bigSize/2) + wallThickness, canvas.height - bigSize - 20, bigSize, bigSize);

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

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
    const canvas = document.getElementById("canvas");
    const ctx = canvas.getContext("2d");

    const cssWidth = window.innerWidth * 0.8;
    const cssHeight = cssWidth / 3;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = cssWidth * dpr;
    canvas.height = cssHeight * dpr;

    canvas.style.width = cssWidth + "px";
    canvas.style.height = cssHeight + "px";

    ctx.scale(dpr, dpr);

    const bigMass = 100 ** (n - 1);
    const smallMass = 1;

    const smallSize = cssWidth / 500 * 30;
    const bigSize = cssWidth / 500 * 50;
    const wallThickness = cssWidth / 500 * 3;

    let smallVelocity = 0;
    let bigVelocity = -1;

    let smallPos = cssWidth / 500 * 100;
    let bigPos = cssWidth / 500 * 300;

    const dt = 0.05; // precompute time step

    const positions = [];
    let totalCollisions = 0;
    let collisionType = 1;
    let finished = false;

    const extraTimeAfterLastClack = 10.0;
    const extraSteps = Math.ceil(extraTimeAfterLastClack / dt);

    let lastCollisionStep = 0;
    let stepCount = 0;
    finished = false;

    smallMassDiv.textContent = `Small Block Mass: ${smallMass}`;
    bigMassDiv.textContent = `Big Block Mass: ${bigMass}`;

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

    // Save csv if the box is checked
    if (document.getElementById("downloadRaw").checked) {
        savePrecomputedCSV(positions);
    }``

    // PLAYBACK
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const totalTime = 5000; // total simulation time in ms
    const frameCount = 600; // total frames to render

    function smoothEase(t) {
        const t1 = 0.1;
        const t2 = 0.9;
        const p0 = 0.1;
        const p1 = 0.9;
        const m0 = 1;  // slope at t1
        const m1 = 1;  // slope at t2

        if (t <= t1) {
            return t / t1 * p0; // linear start
        } else if (t >= t2) {
            return p1 + (t - t2) / (1 - t2) * (1 - p1); // linear end
        } else {
            const dt = t2 - t1;
            const tt = t - t1;

            // y(0) = p0
            // y(dt) = p1
            // y'(0) = m0
            // y'(dt) = m1

            const d = m0;
            const b = (3*(p1 - p0) - (2*m0 + m1)*dt) / (dt*dt);
            const a = (m1 - d - 3*b*dt) / (4*dt*dt*dt);

            return a*tt**4 + b*tt**3 + d*tt + p0;
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
            counterDiv.textContent = `Collisions: ${positions[positions.length - 1][2]}`;

            let computedPi = positions[positions.length - 1][2] / (10 ** (n - 1));
            showSplashText(computedPi);
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


        // Draw everything
        ctx.clearRect(0, 0, cssWidth, cssHeight);

        // Wall with diagonal lines
        const wallX = wallThickness*1.5;  // distance from left edge

        // Diagonal hatch lines
        ctx.strokeStyle = "black";
        ctx.lineWidth = 3;
        const hatchSpacing = 25; // spacing between lines
        for (let y = 0; y < cssHeight; y += hatchSpacing) {
            ctx.beginPath();
            ctx.moveTo(-5, y);
            ctx.lineTo(wallX + wallThickness, y + wallThickness*2);
            ctx.stroke();
        }

        // Wall
        ctx.fillStyle = "black";
        ctx.fillRect(wallX*1.2, 0, wallThickness, cssHeight);

        // Floor
        ctx.fillStyle = "rgb(124,127,135)";
        ctx.fillRect(wallThickness + wallX*1.2, cssHeight - 19, cssWidth - wallThickness, 19);

        // Small block
        ctx.fillStyle = "rgb(175,187,234)";
        ctx.fillRect(sPos + wallThickness + wallX*1.2, cssHeight - smallSize - 20, smallSize, smallSize);

        // Big block
        ctx.fillStyle = "rgb(42, 55, 122)";
        ctx.fillRect(bPos + (smallSize) + wallThickness + wallX*1.2, cssHeight - bigSize - 20, bigSize, bigSize);

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

async function showSplashText(piValue) {
    // const response = await fetch("resources/splashtext.txt");
    // const text = await response.text();
    // const lines = text.split("\n").filter(l => l.trim().length > 0);
    // const randomLine = lines[Math.floor(Math.random() * lines.length)];

    const splashTexts = [
        "Woah! Splashtext!",
        "The most inefficient way to compute pi.",
        "Spoken like a true engineer.",
        "Momentum never lies.",
        "Physics has entered the chat."
    ];
    const randomLine = splashTexts[Math.floor(Math.random() * splashTexts.length)];

    const splashContainer = document.getElementById("splashContainer");
    splashContainer.innerHTML = ""; // clear previous content

    // Title
    const title = document.createElement("h1");
    title.className = "splashTitle";
    title.innerHTML = `<span class="pi-letter">π</span> = ${piValue}`;
    splashContainer.appendChild(title);

    // Subtitle
    const subtitle = document.createElement("div");
    subtitle.className = "splashSubtitle";
    subtitle.textContent = randomLine;
    splashContainer.appendChild(subtitle);

    setTimeout(() => {
        splashContainer.innerHTML = "";
    }, 3000); // match animation duration
}

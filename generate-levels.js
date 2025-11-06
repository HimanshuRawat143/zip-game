// --- generate-levels.js (FIXED) ---
// This script is SLOW ON PURPOSE.
// It uses the "real" backtracking algorithm to create high-quality, complex puzzles.
// Run this ONCE from your terminal with: node generate-levels.js
// BE PATIENT! Generating 100 levels (especially 6x6) will take several minutes.

const fs = require('fs');

console.log("Starting high-quality level generation...");
console.log("This will be slow. Please be patient...");

// --- The "Real" Backtracking Algorithm ---
function generateLevel(levelNumber) {
    let gridSize;
    let numWaypoints;

    // --- NEW PROGRESSION ---
    if (levelNumber <= 5) {
        gridSize = 4; // Levels 1-5
        numWaypoints = Math.max(4, 8 - (levelNumber - 1));
    } else if (levelNumber <= 20) {
        gridSize = 5; // Levels 6-20
        numWaypoints = Math.max(3, 10 - (levelNumber - 6));
    } else {
        gridSize = 6; // Levels 21+
        numWaypoints = Math.max(3, 12 - (levelNumber - 21));
    }
    
    // --- This is the "slow" algorithm from your file ---
    const totalCells = gridSize * gridSize;
    const visited = Array(gridSize).fill(null).map(() => Array(gridSize).fill(false));
    const solutionPath = [];
    const DIRS = [[-1, 0], [1, 0], [0, -1], [0, 1]];

    function findPath(r, c) {
        visited[r][c] = true;
        solutionPath.push([r, c]);

        if (solutionPath.length === totalCells) {
            return true;
        }

        // Shuffle directions for randomness
        for (let i = DIRS.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [DIRS[i], DIRS[j]] = [DIRS[j], DIRS[i]];
        }

        for (const [dr, dc] of DIRS) {
            const nr = r + dr;
            const nc = c + dc;
            if (nr >= 0 && nr < gridSize && nc >= 0 && nc < gridSize && !visited[nr][nc]) {
                if (findPath(nr, nc)) {
                    return true;
                }
            }
        }
        
        visited[r][c] = false; 
        solutionPath.pop(); 
        return false; 
    }
    
    // --- START OF THE FIX ---
    // This loop guarantees that we find a path, no matter what.
    // If findPath fails from one random start, it will reset and try again
    // from a *new* random start until it succeeds.
    let pathFound = false;
    while (!pathFound) {
        // Reset visited array and solution path for the new attempt
        for (let r = 0; r < gridSize; r++) {
            for (let c = 0; c < gridSize; c++) {
                visited[r][c] = false;
            }
        }
        solutionPath.length = 0; // Clears the array

        // Try a new random start
        const startR = Math.floor(Math.random() * gridSize);
        const startC = Math.floor(Math.random() * gridSize);
        
        // Run the algorithm
        pathFound = findPath(startR, startC);
        
        // If pathFound is true, the loop will exit.
        // If false, it loops and tries again.
    }
    // --- END OF THE FIX ---
    // We are now 100% guaranteed to have a full solutionPath


    // 3. Select waypoints from the "real" path
    const indices = new Set();
    indices.add(0); // Add start
    indices.add(totalCells - 1); // Add end

    const middleWaypoints = numWaypoints - 2;
    for (let i = 1; i <= middleWaypoints; i++) {
        const index = Math.floor(i * (totalCells / (middleWaypoints + 1)));
        indices.add(Math.min(index, totalCells - 1));
    }

    const sortedIndices = Array.from(indices).sort((a, b) => a - b);
    const finalWaypoints = {};
    for(let i = 0; i < sortedIndices.length; i++) {
        // This check prevents an error if the path was somehow still empty
        if (solutionPath[sortedIndices[i]]) {
             finalWaypoints[i + 1] = solutionPath[sortedIndices[i]];
        } else {
            // This should no longer happen, but it's safe to have
            console.error(`CRITICAL ERROR: Failed to find waypoint for level ${levelNumber}`);
        }
    }

    // 4. Return the *game data only*.
    return {
        level: levelNumber,
        gridSize: gridSize,
        waypoints: finalWaypoints,
        numWaypoints: sortedIndices.length,
        totalCells: totalCells
    };
}


// --- Main Execution ---
function runGeneration() {
    const TOTAL_LEVELS_TO_GENERATE = 100; // Generate 100 levels
    const allLevels = [];

    const startTime = Date.now();
    console.log(`Generating ${TOTAL_LEVELS_TO_GENERATE} levels...`);

    for (let i = 1; i <= TOTAL_LEVELS_TO_GENERATE; i++) {
        const levelGenTime = Date.now();
        const level = generateLevel(i);
        allLevels.push(level);
        
        const timeTaken = (Date.now() - levelGenTime) / 1000;
        console.log(`... Level ${i} (${level.gridSize}x${level.gridSize}) generated in ${timeTaken.toFixed(2)}s`);
    }

    // Save the levels to a JSON file
    fs.writeFileSync('levels.json', JSON.stringify(allLevels, null, 2));
    
    const totalTime = (Date.now() - startTime) / 1000;
    console.log(`\n✅ Success! ${TOTAL_LEVELS_TO_GENERATE} levels saved to levels.json.`);
    console.log(`Total time taken: ${totalTime.toFixed(2)} seconds.`);
}

runGeneration();

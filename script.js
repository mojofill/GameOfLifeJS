const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

const HEIGHT = document.body.clientHeight;
const WIDTH = document.body.clientWidth;

canvas.height = HEIGHT;
canvas.style.height = HEIGHT;
canvas.width = WIDTH;
canvas.style.width = WIDTH;

let simulationOn = false;

const UNIT_WIDTH = 25;
const RENDER_FPS = 60;
const SIMULATION_FPS = 10;
let FPS = 60;

let gridMap = [];

for (let y = 0; y < 4 * Math.ceil(HEIGHT / UNIT_WIDTH); y++) {
    gridMap.push([])
    for (let x = 0; x < 4 * Math.ceil(WIDTH / UNIT_WIDTH); x++) gridMap[y].push(false);
}

const camera = {
    x: gridMap.length / 2 * UNIT_WIDTH,
    y: -gridMap[0].length / 4 * UNIT_WIDTH,
}

const mouse = {
    x: 0,
    y: 0,
    left: false,
    right: false,
    shift: false,
    cameraOffset: {
        lastHeldPosition: {
            x: null,
            y: null,
        },
        x: 0,
        y: 0,
    }
}


let simulationFrameCount = 0;

function init() {
    listeners()
    setTimeout(render, 1000 / RENDER_FPS);
}

function listeners() {
    document.addEventListener('keydown', (e) => {
        mouse.shift = e.code === 'ShiftLeft' || e.code === 'ShiftRight';
    })

    document.addEventListener('keyup', () => mouse.shift = false);

    document.addEventListener("mousemove", (e) => {
        mouse.x = e.x;
        mouse.y = e.y;
    })

    document.addEventListener('mousedown', (e) => {
        mouse.left = e.button == 0;
        mouse.right = e.button == 2;
    })

    document.addEventListener('mouseup', (e) => {
        mouse.left = false;
        mouse.right = false;
    })

    document.addEventListener('keyup', (e) => {
        if (e.code === 'KeyP') {
            simulationOn = !simulationOn;
            document.title = simulationOn ? "Simulating..." : "Game Of Life";
        }
    })
}

function reset() {
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
}

function simulate() {
    let cells_to_kill = [];
    let cells_to_live = [];

    for (let y = 0; y < gridMap.length; y++) {
        for (let x = 0; x < gridMap[y].length; x++) {
            let neighbors = [];
            for (let offsetX = -1; offsetX <= 1; offsetX++) {
                for (let offsetY = -1; offsetY <= 1; offsetY++) {
                    if (x + offsetX >= 0 && x + offsetX < gridMap[y].length && y + offsetY >= 0 && y + offsetY < gridMap.length && (offsetX !== 0 || offsetY !== 0)) {
                        neighbors.push([x + offsetX, y + offsetY]);
                    }
                }
            }
            let live_neighbors = 0;
            for (const neighbor of neighbors) {
                if (gridMap[neighbor[1]][neighbor[0]]) live_neighbors++;
            }

            if (gridMap[y][x]) {
                if (live_neighbors < 2 || live_neighbors > 3) cells_to_kill.push([x, y]);
            }
            else { // dead cell
                if (live_neighbors === 3) cells_to_live.push([x, y]);
            }
        }
    }

    for (const cell of cells_to_kill) {
        gridMap[cell[1]][cell[0]] = false;
    }

    for (const cell of cells_to_live) {
        gridMap[cell[1]][cell[0]] = true;
    }
}

function render() {
    reset();

    for (let y=0; y < gridMap.length; y++) {
        for (let x=0; x < gridMap[y].length; x++) {
            ctx.fillStyle = gridMap[y][x] ? "white" : "black";
            if (Math.floor(mouse.x / UNIT_WIDTH) + Math.floor(camera.x / UNIT_WIDTH) === x && Math.floor(mouse.y / UNIT_WIDTH) - Math.floor(camera.y / UNIT_WIDTH) === y) {
                if(!gridMap[y][x]) ctx.fillStyle = "gray";
            }
            ctx.fillRect(x * UNIT_WIDTH - camera.x + mouse.cameraOffset.x, y * UNIT_WIDTH + camera.y - mouse.cameraOffset.y, UNIT_WIDTH, UNIT_WIDTH);
        }
    }

    if (mouse.shift && mouse.left) { // camera movement
        if (mouse.cameraOffset.lastHeldPosition.x === null) {
            mouse.cameraOffset.lastHeldPosition = {
                x: mouse.x,
                y: mouse.y,
            };
        }

        mouse.cameraOffset.x = mouse.x - mouse.cameraOffset.lastHeldPosition.x;
        mouse.cameraOffset.y = -(mouse.y - mouse.cameraOffset.lastHeldPosition.y);
    }

    else {
        camera.x -= mouse.cameraOffset.x;
        camera.y -= mouse.cameraOffset.y;

        mouse.cameraOffset.x = 0;
        mouse.cameraOffset.y = 0;

        mouse.cameraOffset.lastHeldPosition = {
            x: null,
            y: null,
        }

        if (mouse.left || mouse.right) {
            let x = Math.floor(mouse.x / UNIT_WIDTH) + Math.floor(camera.x / UNIT_WIDTH);
            let y = Math.floor(mouse.y / UNIT_WIDTH) - Math.floor(camera.y / UNIT_WIDTH);

            gridMap[y][x] = mouse.left;
        }
    }

    if (simulationOn) {
        if (simulationFrameCount >= 100 / SIMULATION_FPS) {
            simulate();
            simulationFrameCount = 0;
        }
        else {
            simulationFrameCount++;
        }
    }

    setTimeout(render, 1000 / RENDER_FPS)
}

init();

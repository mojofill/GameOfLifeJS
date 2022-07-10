const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

const HEIGHT = document.body.clientHeight;
const WIDTH = document.body.clientWidth;

canvas.height = HEIGHT;
canvas.style.height = HEIGHT;
canvas.width = WIDTH;
canvas.style.width = WIDTH;

let simulationOn = false;

let UNIT_WIDTH = 25;
const RENDER_FPS = 120;
let SIMULATION_FPS = 100;
let FPS = 60;

const LIVE_CELL_COLOR = "rgb(0, 102, 102)";
const DEAD_CELL_COLOR = "rgb(0, 51, 102)";

document.body.style.backgroundColor = DEAD_CELL_COLOR;

let randomBias = 0.5; // its always 50/50

let gridMap = [];

for (let y = 0; y < 4 * Math.ceil(HEIGHT / UNIT_WIDTH); y++) {
    gridMap.push([])
    for (let x = 0; x < 4 * Math.ceil(WIDTH / UNIT_WIDTH); x++) gridMap[y].push(false);
}

const camera = {
    x: gridMap.length / 2 * UNIT_WIDTH,
    y: -gridMap[0].length / 4 * UNIT_WIDTH,
}

let addWidth = 0;

const mouse = {
    x: 0,
    y: 0,
    left: false,
    right: false,
    ctrl: false,
    shift: false,
    t: false,
    cameraOffset: {
        lastHeldPosition: {
            x: null,
            y: null,
        },
        x: 0,
        y: 0,
    }
}

const keys = {
    minus: false,
    plus: false,
}

class Time {
    currTime;
    pastTime;
    constructor() {
        this.currTime = new Date().getTime() / 1000;
        this.pastTime = new Date().getTime() / 1000;
    }

    get deltaTime() {
        return this.currTime - this.pastTime;
    }

    updateTime() {
        this.pastTime = this.currTime;
        this.currTime = new Date().getTime() / 1000;
    }
}

const time = new Time();

class Templates {
    GosperGliderGun() {
        let map = [];
        for (let y = 0; y < 11; y++) {
            map.push([]);
            for (let x = 0; x < 38; x++) {
                map[y].push(false);
            }
        }

        // right square
        map[5][1] = map[5][2] = map[6][1] = map[6][2] = true;

        // big gun part 1
        map[3][13] = map[3][14] = map[4][12] = map[5][11] = map[6][11] = map[7][11] = map[8][12] = map[9][13] = map[9][14] = map[6][15] = map[4][16] = map[8][16] = map[5][17] = map[6][17] = map[7][17] = map[6][18] = true;

        return map;
    }
}

const templates = new Templates();

let simulationFrameCount = 0;

function init() {
    listeners()
    setTimeout(render, 1000 / RENDER_FPS);
}

function listeners() {
    document.addEventListener('keydown', (e) => {
        mouse.ctrl = e.code === 'ControlLeft' || e.code === 'ControlRight';
        mouse.shift = e.code === "ShiftLeft" || e.code === "ShiftRight";
        keys.minus = e.code === "Minus";
        keys.plus = e.code === "Equal";
        mouse.t = e.code === "KeyT";

        if (e.code === "ArrowDown") {
            randomBias -= 0.01;
            if (randomBias <= 0) randomBias = 0;
            console.log(randomBias);
        }

        if (e.code === "ArrowUp") {
            randomBias += 0.01;
            if (randomBias >= 1) randomBias = 1;
            console.log(randomBias);
        }
    })

    document.addEventListener('keyup', (e) => {
        if (e.code === "ControlLeft" || e.code === "ControlRight") {
            mouse.ctrl = false;
        }
        if (e.code === "ShiftLeft" || e.code === "ShiftRight") {
            mouse.shift = false;
        }
        if (e.code === "Minus") mouse.minus = false;
        if (e.code == "Equal") mouse.plus = false;

        if (e.code === 'KeyP') {
            simulationOn = !simulationOn;
            document.title = simulationOn ? "Simulating..." : "Game Of Life";
        }

        if (e.code === "KeyF") {
            // full screen
            UNIT_WIDTH = Math.floor(Math.max(WIDTH, HEIGHT) / Math.max(gridMap[0].length, gridMap.length));
            camera.x = 0;
            camera.y = 0;
        }

        if (e.code === "Backspace") {
            for (let y = 0; y < gridMap.length; y++) {
                for (let x = 0; x < gridMap[0].length; x++) {
                    gridMap[y][x] = false;
                }
            }
        }

        if (e.code === "KeyR") {
            // create random map
            for (let y = 0; y < gridMap.length; y++) {
                for (let x = 0; x < gridMap[y].length; x++) {
                    gridMap[y][x] = Math.random() - randomBias >= 0;
                }
            }
        }

        if (e.code === "KeyA") {
            addWidth = addWidth - 1 >= 0 ? addWidth - 1 : addWidth;
        }

        if (e.code === "KeyS") {
            addWidth++;
        }
    }
    );

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
}

function reset() {
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    ctx.fillStyle = document.body.style.backgroundColor;
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

    if (keys.minus || keys.plus) {
        if (mouse.shift) {
            SIMULATION_FPS = keys.minus ? SIMULATION_FPS - 1 >= 0 ? SIMULATION_FPS - 1 : SIMULATION_FPS : SIMULATION_FPS + 1;
        }
        else {
            UNIT_WIDTH = keys.minus ? UNIT_WIDTH - time.deltaTime >= 0 ? UNIT_WIDTH - time.deltaTime : UNIT_WIDTH : UNIT_WIDTH + time.deltaTime;

            camera.x -= time.deltaTime * UNIT_WIDTH / 2;
            camera.y -= time.deltaTime * UNIT_WIDTH / 2;

            if (keys.minus) {
                if (UNIT_WIDTH - time.deltaTime >= 0) {
                    UNIT_WIDTH -= time.deltaTime;
                    camera.x -= time.deltaTime * UNIT_WIDTH;
                    camera.y += time.deltaTime * UNIT_WIDTH;
                }
            }
            else {
                UNIT_WIDTH += time.deltaTime;
                camera.x += time.deltaTime * UNIT_WIDTH;
                camera.y -= time.deltaTime * UNIT_WIDTH;
            }
        }
    }

    if (mouse.ctrl && mouse.left) { // camera movement
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
            for (let _y = 0; _y < addWidth; _y++) {
                for (let _x = 0; _x < addWidth; _x++) {
                    if (x + _x >= 0 && x + _x < gridMap[0].length && y + _y >= 0 && y + _y < gridMap.length) {
                        gridMap[y + _y][x + _x] = mouse.left;
                    }
                }
            }
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

    for (let y=0; y < gridMap.length; y++) {
        for (let x=0; x < gridMap[y].length; x++) {
            ctx.fillStyle = gridMap[y][x] ? LIVE_CELL_COLOR : DEAD_CELL_COLOR;
            if (Math.floor(mouse.x / UNIT_WIDTH) + Math.floor(camera.x / UNIT_WIDTH) === x && Math.floor(mouse.y / UNIT_WIDTH) - Math.floor(camera.y / UNIT_WIDTH) === y) {
                if(!gridMap[y][x]) {
                    ctx.fillStyle = "gray";
                }
            }
            
            ctx.fillRect(x * UNIT_WIDTH - camera.x + mouse.cameraOffset.x, y * UNIT_WIDTH +  camera.y - mouse.cameraOffset.y, UNIT_WIDTH, UNIT_WIDTH);
        }
    }

    time.updateTime();

    setTimeout(render, 1000 / RENDER_FPS)
}

init();

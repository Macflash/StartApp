function Game() {
    this.code = 0;
    this.bugs = []; // each can have a rating of difficulty 1-5 for example
    this.office = new Office(50, 25);
    this.employees = [];
    this.furniture = [];
}

// Object to represent the entire physical office.
function Office(width, height) {
    // set height and width
    this.width = width;
    this.height = height;

    // initialize office grid
    this.grid = [];
    for (var i = 0; i < width; i++) {
        this.grid[i] = [];
    }

    // maybe a redundant list of all furniture would be helpful
    // if they ever want to move to a larger office
    this.furnitureManifest = [];
}

function Employee(){
    this.x = 0;
    this.y = 0;
}

function Dev() {
}

function PM() {

}


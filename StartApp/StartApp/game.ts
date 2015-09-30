/// <reference path="inc/raphael.d.ts" />

enum GameVals { ticksPerDay = 100, daysPerPayPeriod = 7, updateInterval = 50, tileSize = 25 };

enum ClickType { SELECT, DEMOLISH, BUILD };

enum SlotType { floor, counter, workspace, computer, monitor, exit };

enum NeedLevel { satisfied, want, urgent };

enum Need { sleep, water, food, bathroom, nicotin, work, coffee, fun };

class Game {
    tick: number;
    day: number;
    money: number;
    code: number;
    bugs: Array<number>;
    office: Office;
    employees: Array<Employee>;
    furniture: Array<IFurniture>;
    constructor() {
        this.tick = 0;
        this.day = 1;
        this.money = 10000;
        this.code = 0;
        this.bugs = new Array<number>();
        this.office = new Office();

        this.employees = new Array<Employee>();
        this.employees.push(new Employee());

        this.furniture = new Array<IFurniture>();
    }

    clickHandler(clicktype, x, y, sourcetype) {
        console.log(clicktype + " click at " + x + "," + y + " from " + sourcetype);
        
        // go down to the last slot item
        var last = null;
        var cur = this.office.grid[x][y];
        while (cur.slot != null) {
            last = cur;
            cur = cur.slot;
        }

        // check the clicktype
        if (clicktype == 'demolish') { 
            if (last == null) {
                console.log("Can't demolish floor");
                console.log(cur);
            }  
            else {
                if (cur.parent != null) {
                    cur.parent.destroy();
                }
                else {
                    cur.destroy();
                }
                last.slot = null;
            }
        }
        else if (clicktype == 'wall') {
            if (cur.provides == SlotType.floor) {
                this.office.add(x, y, new Wall());
            }
            else {
                console.log("Can't build wall there");
            }
        }
        else if (clicktype == 'desk') {
            if (cur.provides == SlotType.floor) {
                this.office.add(x, y, new BasicDeskPiece());
            }
            else {
                console.log("Can't build desk there");
            }
        }
        else if (clicktype == 'bigdesk') {
            if (cur.provides == SlotType.floor) {
                this.office.add(x, y, new BigDesk());
            }
            else {
                console.log("Can't build big desk there");
            }
        }
        else if (clicktype == 'computer') {
            if (cur.provides == SlotType.counter) {
                this.office.add(x, y, new Computer());
            }
            else {
                console.log("Can't build computer there");
            }
        }
        else if (clicktype == 'monitor') {
            if (cur.provides == SlotType.counter) {
                this.office.add(x, y, new Monitor());
            }
            else {
                console.log("Can't build monitor there");
            }
        }
    }
}

class Office {
    width: number;
    height: number;
    grid: Array<Array<IFurniture>>;
    constructor() {
        this.width = 30;
        this.height = 15;
        this.grid = [];

        // initialize the floor grid
        for (var i = 0; i < this.width; i++) {
            this.grid[i] = [];
            for (var j = 0; j < this.height; j++) {
                this.grid[i][j] = new Floor();
                if (j == 0 || j == this.height - 1) {
                    this.grid[i][j].slot = new Wall();
                }
                if (Math.random() > .8 && (i != 1 && j != 1)) {
                    this.grid[i][j].slot = new Wall();
                }
                if (i == 20 && j == 8){
                    this.grid[i][j].slot = new WorkSpot();
                }
            }
        }
    }

    draw(paper: RaphaelPaper, cHandler: Function) {
        for (var i = 0; i < this.width; i++) {
            for (var j = 0; j < this.height; j++) {
                this.grid[i][j].draw(paper, i, j, cHandler);
            }
        }
    }

    add(x: number, y: number, item: IFurniture): boolean {
        var last = null;
        var cur = this.grid[x][y];
        while (cur.slot != null) {
            last = cur;
            cur = cur.slot;
        }
        if (cur.provides == item.requires) {
            cur.slot = item;
            if (item.downChild != null) {
                if (!this.add(x, y + 1, item.downChild)) {
                    return false;
                }
            }
            if (item.rightChild != null){
                if (!this.add(x + 1, y, item.rightChild)) {
                    return false;
                }
            }
            cur.slot = item;
            return true;
        }
        return false;
    }
}

interface IFurniture {
    // for tree structure of large furniture
    parent: IFurniture;
    rightChild: IFurniture;
    downChild: IFurniture;

    // elements needed for drawing this piece of furniture
    drawingElements: Array<any>;

    // needs certain height to be placed, and can provide one height for more furniture
    requires: SlotType;
    provides: SlotType;

    slot: IFurniture;
    draw(paper: RaphaelPaper, x: number, y: number, clickHandler: Function);
    destroy();
    passable(): boolean;
    tileProvides(type: SlotType): boolean;
}

abstract class Furniture implements IFurniture {
    // for tree structure of large furniture
    parent: IFurniture;
    rightChild: IFurniture;
    downChild: IFurniture;

    // elements needed for drawing this piece of furniture
    drawingElements: Array<RaphaelElement>;

    // needs certain height to be placed, and can provide one height for more furniture
    requires: SlotType;
    provides: SlotType;
    slot: IFurniture;

    draw(paper: RaphaelPaper, x: number, y: number, clickHandler: Function) {
        if (this.slot != null) {
            if (this.slot.drawingElements == null) {
                this.slot.destroy();
                this.slot = null;
            }
            else {
                this.slot.draw(paper, x, y, clickHandler);
            }
        }
    }
    constructor() {
        this.parent = null;
        this.rightChild = null;
        this.downChild = null;
        this.requires = null;
        this.provides = null;
        this.slot = null;
        this.drawingElements = new Array<RaphaelElement>();
    }
    destroy() {
        if (this.rightChild != null) {
            this.rightChild.destroy();
            this.rightChild = null;
        }
        if (this.downChild != null) {
            this.downChild.destroy();
            this.downChild = null;
        }
        if (this.slot != null) {
            this.slot.destroy();
            this.slot = null;
        }
        if (this.drawingElements != null) {
            this.drawingElements.forEach((value: RaphaelElement, index: number, array: RaphaelElement[]) => { value.remove(); });
            this.drawingElements = null;
        }
    }
    passable(): boolean {
        // if we dont have floor available we aren't passable
        if (this.provides != SlotType.floor && this.provides != SlotType.workspace) {
            return false;
        }
        // if we have children in our floor slot then let them decide
        if (this.slot != null) {
            return this.slot.passable();
        }
        // otherwise we are clear!
        return true;
    }
    tileProvides(type: SlotType): boolean {
        // if we provide this then we got it covered!
        if (this.provides == type) {
            console.log("hey we provide this!");
            return true;
        }
        // if we have children in our slot then let them decide
        if (this.slot != null) {
            return this.slot.tileProvides(type);
        }
        // otherwise we dont!
        return false;
    }
}

class Floor extends Furniture {
    constructor() {
        super();
        this.provides = SlotType.floor;
    }
    draw(paper: RaphaelPaper, x: number, y: number, clickHandler: Function) {
        // we have no drawing elements!
        if (this.drawingElements.length == 0) {
            // Create our drawing element
            var e = paper.rect(x * GameVals.tileSize, y * GameVals.tileSize, GameVals.tileSize, GameVals.tileSize
            ).attr({ stroke: '#D3D3D3', fill: '#EEE' });
            e.click(function () {
                clickHandler(x, y, "floor");
            });
            this.drawingElements.push(e);
        }
        super.draw(paper, x, y, clickHandler);
    }
}

class Wall extends Furniture {
    constructor() {
        super();
        this.requires = SlotType.floor;
    }
    draw(paper: RaphaelPaper, x: number, y: number, clickHandler: Function) {
        // we have no drawing elements!
        if (this.drawingElements.length == 0) {
            // Create our drawing element
            var e = paper.rect(x * GameVals.tileSize, y * GameVals.tileSize, GameVals.tileSize, GameVals.tileSize
            ).attr({ fill: '#555' });
            e.click(function () { clickHandler(x, y, "wall"); });
            this.drawingElements.push(e);
        }
        super.draw(paper, x, y, clickHandler);
    }
}

class BasicDeskPiece extends Furniture {
    constructor() {
        super();
        this.requires = SlotType.floor;
        this.provides = SlotType.counter;
    }
    draw(paper: RaphaelPaper, x: number, y: number, clickHandler: Function) {
        // we have no drawing elements!
        if (this.drawingElements.length == 0) {
            // Create our drawing element
            var e = paper.rect(x * GameVals.tileSize, y * GameVals.tileSize, GameVals.tileSize, GameVals.tileSize
            ).attr({ fill: '#F5F5DC' });
            e.click(function () { clickHandler(x, y, "desk"); });
            this.drawingElements.push(e);
        }
        super.draw(paper, x, y, clickHandler);
    }
}

class WorkSpot extends Furniture {
    constructor() {
        super();
        this.requires = SlotType.floor;
        this.provides = SlotType.workspace;
    }
    draw(paper: RaphaelPaper, x: number, y: number, clickHandler: Function) {
        // we have no drawing elements!
        if (this.drawingElements.length == 0) {
            // Create our drawing element
            var e = paper.rect(x * GameVals.tileSize, y * GameVals.tileSize, GameVals.tileSize, GameVals.tileSize
            ).attr({ fill: '#33FF33', opacity: '.5' });
            e.click(function () { clickHandler(x, y, "workspot"); });
            this.drawingElements.push(e);
        }
        super.draw(paper, x, y, clickHandler);
    }
}

class BigDesk extends Furniture {
    constructor() {
        super();
        this.requires = SlotType.floor;
        this.provides = SlotType.counter;
        this.downChild = new BasicDeskPiece();
        this.downChild.parent = this;
        this.rightChild = new BasicDeskPiece();
        this.rightChild.parent = this;
        this.rightChild.downChild = new WorkSpot();
        this.rightChild.downChild.parent = this;
        this.rightChild.rightChild = new BasicDeskPiece();
        this.rightChild.rightChild.parent = this;
        this.rightChild.rightChild.downChild = new BasicDeskPiece();
        this.rightChild.rightChild.downChild.parent = this;
    }
    draw(paper: RaphaelPaper, x: number, y: number, clickHandler: Function) {
        // we have no drawing elements!
        if (this.drawingElements.length == 0) {
            // Create our drawing element
            var e = paper.rect(x * GameVals.tileSize, y * GameVals.tileSize, GameVals.tileSize, GameVals.tileSize
            ).attr({ fill: '#F5F5DC' });
            e.click(function () { clickHandler(x, y, "desk"); });
            this.drawingElements.push(e);
        }
        super.draw(paper, x, y, clickHandler);
    }
}

class Computer extends Furniture{
    constructor() {
        super();
        this.requires = SlotType.counter;
        this.provides = SlotType.computer;
    }
    draw(paper: RaphaelPaper, x: number, y: number, clickHandler: Function) {
        // we have no drawing elements!
        if (this.drawingElements.length == 0) {
            // Create our drawing element
            var e = paper.rect(
                (x + .2) * GameVals.tileSize, (y + .1) * GameVals.tileSize,
                GameVals.tileSize * .6, GameVals.tileSize * .8
            ).attr({ fill: '#333' });
            e.click(function () { clickHandler(x, y, "computer"); });
            this.drawingElements.push(e);
        }
        super.draw(paper, x, y, clickHandler);
    }
}

class Monitor extends Furniture{
    constructor() {
        super();
        this.requires = SlotType.counter;
        this.provides = SlotType.monitor;
    }
    draw(paper: RaphaelPaper, x: number, y: number, clickHandler: Function) {
        // we have no drawing elements!
        if (this.drawingElements.length == 0) {
            // Create our drawing element
            var e = paper.rect(
                (x + .1) * GameVals.tileSize, (y + .4) * GameVals.tileSize,
                GameVals.tileSize * .8, GameVals.tileSize * .2
            ).attr({ fill: '#333' });
            e.click(function () { clickHandler(x, y, "monitor"); });
            this.drawingElements.push(e);
        }
        super.draw(paper, x, y, clickHandler);
    }
}

class Employee {
    x: number;
    y: number;
    salary: number;
    tick: number;
    drawingElements: Array<RaphaelElement>;
    path: PathNode;
    constructor() {
        this.x = 1;
        this.y = 1;
        this.salary = 100;
        this.tick = 0;
        this.drawingElements = new Array<RaphaelElement>();
    }
    move(office: Office) {
        if (office.grid[this.x][this.y].tileProvides(SlotType.workspace)){
            console.log("THERE!");
        }
        else if (this.path == null) {
            var start = new Date().getTime();
            var searcher = new SearchGrid(new Coord(this.x, this.y), SlotType.workspace, office);
            var result = searcher.run();
            this.path = result.toPath();
            var end = new Date().getTime();
            var time = end - start;
            console.log('Execution time: ' + time);
            console.log(this.path);
        }
        else {
            //follow path
            if (this.x == this.path.x && this.y == this.path.y) {
                this.path = this.path.next;
                //can we go there?
                if (office.grid[this.path.x][this.path.y].passable()) {
                    //move there!
                    this.x = this.path.x;
                    this.y = this.path.y;
                }
                else {
                    console.log("recalculating!");
                    this.path = null;
                }
            }
            else {
                console.log("TRIED TO FOLLOW PATH YOU WERENT ON");
            }
        }
    }
    update(office: Office) {
        this.tick++;
        if (this.tick > 10) {
            this.tick = 0;
            //are we doing something already?

            //yes? do it!

            //no? figure out what we need to do

            //see if we can do it here

            // yes? do it!

            // no? MOVE it!
            this.move(office);
        }
    }

    draw(paper: RaphaelPaper) {
        if (this.drawingElements.length == 0) {
            var e = paper.circle((this.x + .5) * GameVals.tileSize, (this.y + .5) * GameVals.tileSize, GameVals.tileSize * .4).attr({ fill: '#f00', stroke: 'f00' });
            this.drawingElements.push(e);
        }
        this.drawingElements.forEach((value: RaphaelElement, index: number, array: RaphaelElement[]) => {
            value.animate({
                "cx": (this.x + .5) * GameVals.tileSize,
                "cy": (this.y + .5) * GameVals.tileSize
            }, GameVals.updateInterval * 10, ">");
        });
    }

    destroy() {
        this.drawingElements.forEach((value: RaphaelElement) => { value.remove(); });
        this.drawingElements = null;
    }
    
}

class PathNode {
    x: number;
    y: number;
    next: PathNode;
    constructor(x: number, y: number, n: PathNode) {
        this.x = x;
        this.y = y;
        this.next = n;
    }
}

class SearchNode {
    parent: SearchNode
    c: Coord;
    fscore: number;
    constructor(c: Coord, f: number, parent?: SearchNode) {
        this.c = c;
        this.fscore = f;
        this.parent = parent;
    }
    toPath(nextNodes?: PathNode): PathNode {
        // need to navigate backwards
        var cur = new PathNode(this.c.x, this.c.y, nextNodes);
        if (this.parent == null) {
            return cur;
        }
        return this.parent.toPath(cur);
    }
}

class SearchGrid {
    // the type of stuff we are looking for
    type: SlotType;
    office: Office;
    open: Array<SearchNode>;
    closed: Array<SearchNode>;
    result: SearchNode;
    getLowest(array: Array<SearchNode>): SearchNode {
        var min = Number.MAX_VALUE;
        var mindex = -1;
        for (var index in array) {
            if (array[index].fscore <= min) {
                min = array[index].fscore;
                mindex = index;
            }
        }
        if (mindex == -1) {
            console.log("ERROR: didn't find lowest");
        }
        return array[mindex];
    }
    contains(array: Array<SearchNode>, coord: Coord): boolean {
        for (var k in array) {
            if (array[k].c.x == coord.x && array[k].c.y == coord.y) { return true; }
        }
        return false;
    }
    remove(n: SearchNode, array: Array<SearchNode>): void {
        for (var k in array){
            if (n == array[k]) { array.splice(k, 1); break; }
        }
    }
    run(): SearchNode {
        //console.log("20,8:" + this.office.grid[20][8].tileProvides(SlotType.workspace));
        var i = 0;
        while (i < 1000) {
            if (i % 1 == 0) {
                //console.log(i);
                //console.log("open: " + this.open.length);
               // console.log("closed: " + this.closed.length);
                //console.log("closed has 1,1: " + this.contains(this.closed, new Coord(1, 1)));
                //console.log("open has 1,1: " + this.contains(this.open, new Coord(1, 1)));
            }
            i++;            
            // breadth first means first one we find is probably best
            var cur = this.getLowest(this.open);
            //check if we are the result
            if (this.office.grid[cur.c.x][cur.c.y].tileProvides(this.type)) {
          //      console.log("hey!!!");
                return cur;
            }

            //add neighbors of lowest
            //check passable, and not in closed list
            var l = cur.c.left();
            if (!this.contains(this.open, l) && !this.contains(this.closed, l)) {
                if (this.office.grid[l.x][l.y].passable()) {
                    var s = new SearchNode(l, cur.fscore + 1, cur);
                    if (this.office.grid[s.c.x][s.c.y].tileProvides(this.type)) {
                        return s;
                    }
                    this.open.push(s);
                }
            }
            var r = cur.c.right(this.office.width);
            if (!this.contains(this.open, r) && !this.contains(this.closed, r)) {
                //console.log("not closed or open yet checking if passable");
                if (this.office.grid[r.x][r.y].passable()) {
                    //console.log("tile was passable");
                    var s = new SearchNode(r, cur.fscore + 1, cur);
                    if (this.office.grid[s.c.x][s.c.y].tileProvides(this.type)) {
                        return s;
                    }
                    this.open.push(s);
                }
            }
            var u = cur.c.up();
            if (!this.contains(this.open, u) && !this.contains(this.closed, u)) {
                if (this.office.grid[u.x][u.y].passable()) {
                    var s = new SearchNode(u, cur.fscore + 1, cur);
                    if (this.office.grid[s.c.x][s.c.y].tileProvides(this.type)) {
                        return s;
                    }
                    this.open.push(s);
                }
            }
            var d = cur.c.down(this.office.height);
            if (!this.contains(this.open, d) && !this.contains(this.closed, d)) {
                if (this.office.grid[d.x][d.y].passable()) {
                    var s = new SearchNode(d, cur.fscore + 1, cur);
                    if (this.office.grid[s.c.x][s.c.y].tileProvides(this.type)) {
                        return s;
                    }
                    this.open.push(s);
                }
            }
            this.remove(cur, this.open);
            this.closed.push(cur);
        }
        console.log("timmeeed out!");
    }
    constructor(start: Coord, type: SlotType, o: Office) {
        this.type = type;
        this.office = o;
        this.open = new Array<SearchNode>();
        this.closed = new Array<SearchNode>();
        this.open.push(new SearchNode(start, 0));
    }
}

class Coord {
    x: number;
    y: number;
    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }
    left() { if (this.x <= 0) { return this; } return new Coord(this.x - 1, this.y); }
    right(max: number) { if (this.x + 1 >= max) { return this; } return new Coord(this.x + 1, this.y); }
    up() { if (this.y <= 0) { return this; } return new Coord(this.x, this.y - 1); }
    down(max: number) { if (this.y + 1 >= max) { return this; } return new Coord(this.x, this.y + 1); }
}

interface Effect {
    need: Need;
    amount: number;
    duration: number;
}

interface INeed {
    amt: number;
    frequency: number;
    update(effects: Array<Effect>): NeedLevel;
    satiate(newLevel: NeedLevel): void;
}
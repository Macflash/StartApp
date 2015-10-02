﻿/// <reference path="inc/raphael.d.ts" />

enum GameVals { ticksPerDay = 960, daysPerPayPeriod = 7, updateInterval = 50, tileSize = 25 };

enum ClickType { SELECT, DEMOLISH, BUILD };

enum SlotType { floor, counter, workspace, computer, monitor, exit, toilet, sink, coffeemachine };

enum NeedLevel { satisfied, want, urgent };

enum NeedType { sleep, water, food, bathroom, nicotine, work, coffee, fun };

// can have multiple requirements, like time
// or multiple steps which could be like a chain of actions
class Action {
    progress: number;
    ticksToFinish: number;
    satisfies: NeedType;
    requires: SlotType[];
    name: string;
    hoursToFinish: any;
    constructor(name: string, hoursToFinish: number, satisfies: NeedType, requires: SlotType[]) {
        this.name = name;
        this.satisfies = satisfies;
        this.requires = requires;
        this.ticksToFinish = GameVals.ticksPerDay * hoursToFinish / 24;
        this.progress = 0;
        this.hoursToFinish = hoursToFinish;
    }
    clone(): Action {
        return new Action(this.name, this.hoursToFinish, this.satisfies, this.requires); 
    }
    done(): boolean {
        this.progress++;
        if (this.progress >= this.ticksToFinish) {
            return true;
        }
        return false;
    }
}

var Actions = new Array<Action>();
//Actions.push(new Action("Sleep", 6, NeedType.sleep, [SlotType.exit]));
//Actions.push(new Action("Get Water", 0, NeedType.water, [SlotType.sink]));
Actions.push(new Action("Get Food", 1, NeedType.food, [SlotType.exit]));
//Actions.push(new Action("Use Bathroom", 0, NeedType.bathroom, [SlotType.toilet]));
Actions.push(new Action("Smoke", 0, NeedType.nicotine, [SlotType.exit]));
Actions.push(new Action("Work", .5, NeedType.work, [SlotType.computer, SlotType.monitor]));
//Actions.push(new Action("Make Coffee", .1, NeedType.coffee, [SlotType.coffeemachine]));

function FindAction(need: NeedType) {
    for (var k in Actions) {
        if (Actions[k].satisfies == need) {
            var t = Actions[k].clone();
            console.log("picked " + t.name + " it will take " + t.ticksToFinish); 
            return t;
        }
    }
    //anything that can't be done at work results in going home, where all needs are reset
    console.log("can't get satisfaction for " + need);
    return new Action("GO HOME for " + NeedType[need], 1, need, [SlotType.exit]);
}

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
                console.log("Can't demolish that");
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
                if (i == 0 || i == this.width - 1) {
                    this.grid[i][j].slot = new Wall();
                }
                if (i == 0 && j == 1) {
                    this.grid[i][j].slot = new Exit();
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

    canAdd(x: number, y: number, item: IFurniture): boolean {
        var last = null;
        var cur = this.grid[x][y];
        while (cur.slot != null) {
            last = cur;
            cur = cur.slot;
        }
        if (cur.provides == item.requires) {
            if (item.downChild != null) {
                if (!this.canAdd(x, y + 1, item.downChild)) {
                    return false;
                }
            }
            if (item.rightChild != null) {
                if (!this.canAdd(x + 1, y, item.rightChild)) {
                    return false;
                }
            }
            return true;
        }

        return false;
    }
    
    //if this returns true you should charge them for the furniture
    add(x: number, y: number, item: IFurniture): boolean {
        if (this.canAdd(x, y, item)) {
            var last = null;
            var cur = this.grid[x][y];
            while (cur.slot != null) {
                last = cur;
                cur = cur.slot;
            }
            if (cur.provides == item.requires) {
                if (item.downChild != null) {
                    if (!this.add(x, y + 1, item.downChild)) {
                        console.log("ERROR: BAD ITEM ADD");
                        return false;
                    }
                }
                if (item.rightChild != null) {
                    if (!this.add(x + 1, y, item.rightChild)) {
                        console.log("ERROR: BAD ITEM ADD");
                        return false;
                    }
                }
                cur.slot = item;
                return true;
            }
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

    // what this piece itself provides
    tileProvides(x?: boolean): SlotType[];
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
        if (this.provides != SlotType.floor) {
            return false;
        }
        // if we have children in our floor slot then let them decide
        if (this.slot != null) {
            return this.slot.passable();
        }
        // otherwise we are clear!
        return true;
    }
    tileProvides(x?: boolean): SlotType[] {
        var types = new Array<SlotType>();
        types.push(this.provides);

        // if we have children in our slot then what we provide doesn't matter, its used
        if (this.slot != null) {
            types = this.slot.tileProvides(x);
        }
        // but we should see what our children have too
        if (this.rightChild != null) {
            types = types.concat(this.rightChild.tileProvides(x));
        }
        if (this.downChild != null) {
            types = types.concat(this.downChild.tileProvides(x));
        }

        return types;

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
    passable() {
        return true;
    }
    draw(paper: RaphaelPaper, x: number, y: number, clickHandler: Function) {
        // we have no drawing elements!
        if (this.drawingElements.length == 0) {
            // Create our drawing element
            var e = paper.rect(x * GameVals.tileSize, y * GameVals.tileSize, GameVals.tileSize, GameVals.tileSize
            ).attr({ fill: '#33FF33', opacity: '.2' });
            e.click(function () { clickHandler(x, y, "workspot"); });
            this.drawingElements.push(e);
        }
        super.draw(paper, x, y, clickHandler);
    }
    tileProvides(x?: boolean): SlotType[] {
        //catch if we get called by our own parent
        if (x === true) {
            return [];
        }
        return this.parent.tileProvides(true);
    }
}

class Exit extends Furniture {
    constructor() {
        super();
        this.requires = SlotType.floor;
        this.provides = SlotType.exit;
    }
    passable() {
        return true;
    }
    draw(paper: RaphaelPaper, x: number, y: number, clickHandler: Function) {
        // we have no drawing elements!
        if (this.drawingElements.length == 0) {
            // Create our drawing element
            var e = paper.rect(x * GameVals.tileSize, y * GameVals.tileSize, GameVals.tileSize, GameVals.tileSize
            ).attr({ fill: '#ff3333', opacity: '.5' });
            e.click(function () { clickHandler(x, y, "exit"); });
            this.drawingElements.push(e);
        }
        super.draw(paper, x, y, clickHandler);
    }
    tileProvides(x?: boolean): SlotType[] {
        return [SlotType.exit];
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

function Contains(hay: SlotType[], needles: SlotType[]): boolean{
    for (var index in needles) {
        var found = false;
        for (var jindex in hay) {
            if (needles[index] == hay[jindex]) {
                found = true;
                break;
            }
        }
        if (!found) {
            return false;
        }
    }
    return true;
}

class Employee {
    x: number;
    y: number;
    salary: number;
    needs: Needs;
    drawingElements: Array<RaphaelElement>;
    path: PathNode;
    currentAction: Action;
    moveTicks: number;
    constructor() {
        this.moveTicks = 0;
        this.x = 1;
        this.y = 1;
        this.salary = 100;
        this.drawingElements = new Array<RaphaelElement>();
        // sleep, water, food, bathroom, nicotine, work, coffee, fun };
        this.needs = new Needs([1, 1.1, 1.5, 2, 0, 8, 1.9, .5]);
    }
    move(wants: SlotType[], office: Office) {
        if (Contains(office.grid[this.x][this.y].tileProvides(), wants)) {
            //console.log("THERE!");
        }
        else if (this.path == null) {
            var start = new Date().getTime();
            var searcher = new SearchGrid(new Coord(this.x, this.y), wants, office);
            var result = searcher.run();
            if (result != null) {
                this.path = result.toPath();
            }
            else {
                console.log("no lowest for " + wants);
            }
            var end = new Date().getTime();
            var time = end - start;
            //console.log('Execution time: ' + time);
            //console.log(this.path);
        }
        else {
            //follow path
            if (this.x == this.path.x && this.y == this.path.y) {
                this.path = this.path.next;
                if (this.path != null) {
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
                    //just wait till the next turn, cause we havent checked if this tile works for us.
                    //console.log("ERROR: tried to move to the next node even though this is the end");
                }
            }
            else {
                console.log("WTF TRIED TO FOLLOW PATH YOU WERENT ON!!!!!");
            }
        }
    }
    update(office: Office): number {
        var c = 0;
        this.moveTicks++;
        //update needs
        var t = this.needs.update(null);

        //are we doing something already?
        if (this.currentAction != null) {
            
            // are we there?
            if (Contains(office.grid[this.x][this.y].tileProvides(), this.currentAction.requires)) {
                if (this.currentAction.done()) {
                    if (this.currentAction.satisfies == NeedType.work) {
                        c = 1;
                    }
                    //console.log("finished " + this.currentAction.name);
                    if (this.currentAction.satisfies != null) {
                        //console.log("this finished action satisfies " + this.currentAction.satisfies);
                        this.needs.satiate(this.currentAction.satisfies, NeedLevel.satisfied);
                        //console.log(this.needs);
                    }
                    this.currentAction = null;
                }
            }
            else {
                if (this.moveTicks > 4) {
                    this.move(this.currentAction.requires, office);
                    this.moveTicks = 0;
                }
                //wait 10 ticks now
                //this.currentAction = new Action("moving", .1, null, [SlotType.floor]);
            }
        }
        else {
            this.currentAction = FindAction(t);
            //console.log("picked " + this.currentAction.name);
            //console.log(this.needs);
        }
        return c;
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
    types: SlotType[];
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
        var i = 0;
        while (i < 1000) {
            i++;            
            // breadth first means first one we find is probably best
            var cur = this.getLowest(this.open);
            if (cur == null) {
                // try again?
                return null;
            }

            //check if we are the result
            if (Contains(this.office.grid[cur.c.x][cur.c.y].tileProvides(), this.types)) {
                return cur;
            }

            //add neighbors of lowest
            //check passable, and not in closed list
            var l = cur.c.left();
            if (!this.contains(this.open, l) && !this.contains(this.closed, l)) {
                if (this.office.grid[l.x][l.y].passable()) {
                    var s = new SearchNode(l, cur.fscore + 1, cur);
                    if (Contains(this.office.grid[s.c.x][s.c.y].tileProvides(), this.types)) {
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
                    if (Contains(this.office.grid[s.c.x][s.c.y].tileProvides(), this.types)) {
                        return s;
                    }
                    this.open.push(s);
                }
            }
            var u = cur.c.up();
            if (!this.contains(this.open, u) && !this.contains(this.closed, u)) {
                if (this.office.grid[u.x][u.y].passable()) {
                    var s = new SearchNode(u, cur.fscore + 1, cur);
                    if (Contains(this.office.grid[s.c.x][s.c.y].tileProvides(), this.types)) {
                        return s;
                    }
                    this.open.push(s);
                }
            }
            var d = cur.c.down(this.office.height);
            if (!this.contains(this.open, d) && !this.contains(this.closed, d)) {
                if (this.office.grid[d.x][d.y].passable()) {
                    var s = new SearchNode(d, cur.fscore + 1, cur);
                    if (Contains(this.office.grid[s.c.x][s.c.y].tileProvides(), this.types)) {
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
    constructor(start: Coord, types: SlotType[], o: Office) {
        this.types = types;
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

class Need {
    amt: number;
    rate: number;
    constructor(timesPerDay: number) {
        this.amt = 0;
        this.rate = 100 * (timesPerDay / GameVals.ticksPerDay);
    }
    update(effects: Array<Effect>): NeedLevel {
        this.amt += this.rate;
        if (this.amt >= 150) {
            this.amt = 150;
            return NeedLevel.urgent
        }
        else if (this.amt < 100) {
            return NeedLevel.satisfied;
        }
        return NeedLevel.want;
    }
    satiate(newLevel: NeedLevel): void {
        if (newLevel == NeedLevel.satisfied) {
            // boom took care of that eh?
            this.amt = 0;
        }
        else if (newLevel == NeedLevel.want) {
            // ie it satisfies the need but they still want some more soon
            this.amt = 50;
        }
        else if (newLevel == NeedLevel.urgent) {
            // basically they are gonna need it right away again
            this.amt = 100;
        }
    }
}

class Needs {
    list: Need[];
    constructor(f: number[]) {
        this.list = new Array<Need>();
        for (var index in f) {
            this.list[index] = new Need(f[index]);
        }
    }
    //updates and returns most pressing need AS ITS STRING
    update(effects: Effect[]): NeedType {
        var highest_level = NeedLevel.satisfied;
        var highest_need = null;
        for (var n in this.list) {
            var l = this.list[n].update(effects);
            if (l > highest_level) {
                highest_level = l;
                highest_need = n;
            }
        }
        if (highest_need == null) {
            return NeedType.work;
        }
        //console.log("highest need: " + highest_need);
        return highest_need;
    }
    satiate(t: NeedType, newLevel: NeedLevel): void {
        //console.log("trying to satisfy " + t);
        this.list[t].satiate(newLevel);
    }
}
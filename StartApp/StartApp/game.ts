/// <reference path="inc/raphael.d.ts" />

//var CurrentClickType = null;
//function ClickHandler(x: number, y: number, type: string) {
//    console.log(type + " click at " + x + ", " + y);
//    console.log(CurrentClickType);
//}

enum GameVals { ticksPerDay = 100, daysPerPayPeriod = 7, updateInterval = 50, tileSize = 25 };

enum ClickType { SELECT, DEMOLISH, BUILD };

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
            if (cur.provides == FurnitureHeight.floor) {
                this.office.add(x, y, new Wall());
            }
            else {
                console.log("Can't build wall there");
            }
        }
        else if (clicktype == 'desk') {
            if (cur.provides == FurnitureHeight.floor) {
                this.office.add(x, y, new BasicDeskPiece());
            }
            else {
                console.log("Can't build desk there");
            }
        }
        else if (clicktype == 'bigdesk') {
            if (cur.provides == FurnitureHeight.floor) {
                this.office.add(x, y, new BigDesk());
            }
            else {
                console.log("Can't build big desk there");
            }
        }
        else if (clicktype == 'computer') {
            if (cur.provides == FurnitureHeight.counter) {
                this.office.add(x, y, new Computer());
            }
            else {
                console.log("Can't build computer there");
            }
        }
        else if (clicktype == 'monitor') {
            if (cur.provides == FurnitureHeight.counter) {
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

enum FurnitureHeight { floor, counter, workspace, computer, monitor };

interface IFurniture {
    // for tree structure of large furniture
    parent: IFurniture;
    rightChild: IFurniture;
    downChild: IFurniture;

    // elements needed for drawing this piece of furniture
    drawingElements: Array<any>;

    // needs certain height to be placed, and can provide one height for more furniture
    requires: FurnitureHeight;
    provides: FurnitureHeight;

    slot: IFurniture;
    draw(paper: RaphaelPaper, x: number, y: number, clickHandler: Function);
    destroy();
}

abstract class Furniture implements IFurniture {
    // for tree structure of large furniture
    parent: IFurniture;
    rightChild: IFurniture;
    downChild: IFurniture;

    // elements needed for drawing this piece of furniture
    drawingElements: Array<RaphaelElement>;

    // needs certain height to be placed, and can provide one height for more furniture
    requires: FurnitureHeight;
    provides: FurnitureHeight;
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
}

class Floor extends Furniture {
    constructor() {
        super();
        this.provides = FurnitureHeight.floor;
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
        this.requires = FurnitureHeight.floor;
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
        this.requires = FurnitureHeight.floor;
        this.provides = FurnitureHeight.counter;
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
        this.requires = FurnitureHeight.floor;
        this.provides = FurnitureHeight.workspace;
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
        this.requires = FurnitureHeight.floor;
        this.provides = FurnitureHeight.counter;
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
        this.requires = FurnitureHeight.counter;
        this.provides = FurnitureHeight.computer;
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
        this.requires = FurnitureHeight.counter;
        this.provides = FurnitureHeight.monitor;
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
    constructor() {
        this.x = 0;
        this.y = 0;
        this.salary = 100;
        this.tick = 0;
        this.drawingElements = new Array<RaphaelElement>();
    }
    update() {
        this.tick++;
        if (this.tick > 10) {
            this.tick = 0;
            if (this.y < 5) {
                this.y += 1;
            }
            if (this.x < 20) {
                this.x += 1
            }
            return 1;
        }
        return 0;
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
            //array[index] = value.attr("cx", (this.x + .5) * GameVals.tileSize);
            //array[index] = value.attr("cy", (this.y + .5) * GameVals.tileSize);
        });
    }
    destroy() {
        this.drawingElements.forEach((value: RaphaelElement) => { value.remove(); });
        this.drawingElements = null;
    }
}
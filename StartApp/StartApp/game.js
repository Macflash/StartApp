/// <reference path="inc/raphael.d.ts" />
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var GameVals;
(function (GameVals) {
    GameVals[GameVals["ticksPerDay"] = 960] = "ticksPerDay";
    GameVals[GameVals["daysPerPayPeriod"] = 7] = "daysPerPayPeriod";
    GameVals[GameVals["updateInterval"] = 50] = "updateInterval";
    GameVals[GameVals["tileSize"] = 25] = "tileSize";
})(GameVals || (GameVals = {}));
;
var ClickType;
(function (ClickType) {
    ClickType[ClickType["SELECT"] = 0] = "SELECT";
    ClickType[ClickType["DEMOLISH"] = 1] = "DEMOLISH";
    ClickType[ClickType["BUILD"] = 2] = "BUILD";
})(ClickType || (ClickType = {}));
;
var SlotType;
(function (SlotType) {
    SlotType[SlotType["floor"] = 0] = "floor";
    SlotType[SlotType["counter"] = 1] = "counter";
    SlotType[SlotType["workspace"] = 2] = "workspace";
    SlotType[SlotType["computer"] = 3] = "computer";
    SlotType[SlotType["monitor"] = 4] = "monitor";
    SlotType[SlotType["exit"] = 5] = "exit";
    SlotType[SlotType["toilet"] = 6] = "toilet";
    SlotType[SlotType["sink"] = 7] = "sink";
    SlotType[SlotType["coffeemachine"] = 8] = "coffeemachine";
})(SlotType || (SlotType = {}));
;
var NeedLevel;
(function (NeedLevel) {
    NeedLevel[NeedLevel["satisfied"] = 0] = "satisfied";
    NeedLevel[NeedLevel["want"] = 1] = "want";
    NeedLevel[NeedLevel["urgent"] = 2] = "urgent";
})(NeedLevel || (NeedLevel = {}));
;
var NeedType;
(function (NeedType) {
    NeedType[NeedType["sleep"] = 0] = "sleep";
    NeedType[NeedType["water"] = 1] = "water";
    NeedType[NeedType["food"] = 2] = "food";
    NeedType[NeedType["bathroom"] = 3] = "bathroom";
    NeedType[NeedType["nicotine"] = 4] = "nicotine";
    NeedType[NeedType["work"] = 5] = "work";
    NeedType[NeedType["coffee"] = 6] = "coffee";
    NeedType[NeedType["fun"] = 7] = "fun";
})(NeedType || (NeedType = {}));
;
var CodeMilestones = [1000, 5000, 10000, 25000, 50000, 100000, 250000, 1000000, 1000000000];
// can have multiple requirements, like time
// or multiple steps which could be like a chain of actions
var Action = (function () {
    function Action(name, hoursToFinish, satisfies, requires) {
        this.name = name;
        this.satisfies = satisfies;
        this.requires = requires;
        this.ticksToFinish = GameVals.ticksPerDay * hoursToFinish / 24;
        this.progress = 0;
        this.hoursToFinish = hoursToFinish;
    }
    Action.prototype.clone = function () {
        return new Action(this.name, this.hoursToFinish, this.satisfies, this.requires);
    };
    Action.prototype.done = function () {
        this.progress++;
        if (this.progress >= this.ticksToFinish) {
            return true;
        }
        return false;
    };
    return Action;
})();
var Actions = new Array();
Actions.push(new Action("Sleep", 6, NeedType.sleep, [SlotType.exit]));
Actions.push(new Action("Get Water", 0, NeedType.water, [SlotType.sink]));
Actions.push(new Action("Get Food", 1, NeedType.food, [SlotType.exit]));
Actions.push(new Action("Use Bathroom", 0, NeedType.bathroom, [SlotType.toilet]));
Actions.push(new Action("Smoke", 0, NeedType.nicotine, [SlotType.exit]));
Actions.push(new Action("Work", .5, NeedType.work, [SlotType.computer, SlotType.monitor]));
Actions.push(new Action("Make Coffee", .1, NeedType.coffee, [SlotType.coffeemachine]));
function FindAction(need) {
    for (var k in Actions) {
        //should check here to see if there is a tile that actually provides this first
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
var Game = (function () {
    function Game() {
        this.milestone = 0;
        this.tick = 0;
        this.day = 0;
        this.week = 0;
        this.money = 10000;
        this.code = 0;
        this.bugs = new Array();
        this.office = new Office();
        this.employees = new Array();
        this.employees.push(new Employee());
        this.furniture = new Array();
    }
    Game.prototype.clickHandler = function (clicktype, x, y, sourcetype) {
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
        else if (typeof (clicktype) == typeof (Function)) {
            var t = new clicktype();
            console.log(t);
            if (this.money > t.cost) {
                this.money -= t.cost;
                this.office.add(x, y, t);
            }
        }
    };
    return Game;
})();
var Office = (function () {
    function Office() {
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
    Office.prototype.draw = function (paper, cHandler) {
        for (var i = 0; i < this.width; i++) {
            for (var j = 0; j < this.height; j++) {
                this.grid[i][j].draw(paper, i, j, cHandler);
            }
        }
    };
    Office.prototype.canAdd = function (x, y, item) {
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
    };
    //if this returns true you should charge them for the furniture
    Office.prototype.add = function (x, y, item) {
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
    };
    return Office;
})();
var PlacableFurniture = new Array();
var Furniture = (function () {
    function Furniture() {
        this.cost = 100;
        this.parent = null;
        this.rightChild = null;
        this.downChild = null;
        this.requires = null;
        this.provides = null;
        this.slot = null;
        this.drawingElements = new Array();
    }
    Furniture.prototype.draw = function (paper, x, y, clickHandler) {
        if (this.slot != null) {
            if (this.slot.drawingElements == null) {
                this.slot.destroy();
                this.slot = null;
            }
            else {
                this.slot.draw(paper, x, y, clickHandler);
            }
        }
    };
    Furniture.prototype.destroy = function () {
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
            this.drawingElements.forEach(function (value, index, array) { value.remove(); });
            this.drawingElements = null;
        }
    };
    Furniture.prototype.passable = function () {
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
    };
    Furniture.prototype.tileProvides = function (x) {
        var types = new Array();
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
    };
    return Furniture;
})();
var Floor = (function (_super) {
    __extends(Floor, _super);
    function Floor() {
        _super.call(this);
        this.provides = SlotType.floor;
    }
    Floor.prototype.draw = function (paper, x, y, clickHandler) {
        // we have no drawing elements!
        if (this.drawingElements.length == 0) {
            // Create our drawing element
            var e = paper.rect(x * GameVals.tileSize, y * GameVals.tileSize, GameVals.tileSize, GameVals.tileSize).attr({ stroke: '#D3D3D3', fill: '#EEE' });
            e.click(function () {
                clickHandler(x, y, "floor");
            });
            this.drawingElements.push(e);
        }
        _super.prototype.draw.call(this, paper, x, y, clickHandler);
    };
    return Floor;
})(Furniture);
var Wall = (function (_super) {
    __extends(Wall, _super);
    function Wall() {
        _super.call(this);
        this.requires = SlotType.floor;
    }
    Wall.prototype.draw = function (paper, x, y, clickHandler) {
        // we have no drawing elements!
        if (this.drawingElements.length == 0) {
            // Create our drawing element
            var e = paper.rect(x * GameVals.tileSize, y * GameVals.tileSize, GameVals.tileSize, GameVals.tileSize).attr({ fill: '#555' });
            e.click(function () { clickHandler(x, y, "wall"); });
            this.drawingElements.push(e);
        }
        _super.prototype.draw.call(this, paper, x, y, clickHandler);
    };
    return Wall;
})(Furniture);
PlacableFurniture.push(Wall);
var BasicDeskPiece = (function (_super) {
    __extends(BasicDeskPiece, _super);
    function BasicDeskPiece() {
        _super.call(this);
        this.requires = SlotType.floor;
        this.provides = SlotType.counter;
    }
    BasicDeskPiece.prototype.draw = function (paper, x, y, clickHandler) {
        // we have no drawing elements!
        if (this.drawingElements.length == 0) {
            // Create our drawing element
            var e = paper.rect(x * GameVals.tileSize, y * GameVals.tileSize, GameVals.tileSize, GameVals.tileSize).attr({ fill: '#F5F5DC' });
            e.click(function () { clickHandler(x, y, "desk"); });
            this.drawingElements.push(e);
        }
        _super.prototype.draw.call(this, paper, x, y, clickHandler);
    };
    return BasicDeskPiece;
})(Furniture);
var WorkSpot = (function (_super) {
    __extends(WorkSpot, _super);
    function WorkSpot() {
        _super.call(this);
        this.requires = SlotType.floor;
        this.provides = SlotType.workspace;
        this.occupied = null;
        this.c = new Coord(0, 0);
    }
    WorkSpot.prototype.passable = function () {
        if (this.occupied == null) {
            return true;
        }
        if (this.occupied.x != this.c.x || this.occupied.y != this.c.y) {
            this.occupied = null;
            return true;
        }
        console.log("occupied");
        return false;
    };
    WorkSpot.prototype.draw = function (paper, x, y, clickHandler) {
        this.c.x = x;
        this.c.y = y;
        // we have no drawing elements!
        if (this.drawingElements.length == 0) {
            // Create our drawing element
            var e = paper.rect(x * GameVals.tileSize, y * GameVals.tileSize, GameVals.tileSize, GameVals.tileSize).attr({ fill: '#33FF33', opacity: '.2' });
            e.click(function () { clickHandler(x, y, "workspot"); });
            this.drawingElements.push(e);
        }
        _super.prototype.draw.call(this, paper, x, y, clickHandler);
    };
    WorkSpot.prototype.tileProvides = function (x) {
        //catch if we get called by our own parent
        if (x === true) {
            return [];
        }
        return this.parent.tileProvides(true);
    };
    return WorkSpot;
})(Furniture);
var Exit = (function (_super) {
    __extends(Exit, _super);
    function Exit() {
        _super.call(this);
        this.requires = SlotType.floor;
        this.provides = SlotType.exit;
    }
    Exit.prototype.passable = function () {
        return true;
    };
    Exit.prototype.draw = function (paper, x, y, clickHandler) {
        // we have no drawing elements!
        if (this.drawingElements.length == 0) {
            // Create our drawing element
            var e = paper.rect(x * GameVals.tileSize, y * GameVals.tileSize, GameVals.tileSize, GameVals.tileSize).attr({ fill: '#ff3333' });
            e.click(function () { clickHandler(x, y, "exit"); });
            this.drawingElements.push(e);
        }
        this.drawingElements.forEach(function (value) {
            value.toFront();
        });
        _super.prototype.draw.call(this, paper, x, y, clickHandler);
    };
    Exit.prototype.tileProvides = function (x) {
        return [SlotType.exit];
    };
    return Exit;
})(Furniture);
var Table = (function (_super) {
    __extends(Table, _super);
    function Table() {
        _super.call(this);
        this.requires = SlotType.floor;
        this.provides = SlotType.counter;
        this.downChild = new WorkSpot();
        this.downChild.parent = this;
    }
    Table.prototype.draw = function (paper, x, y, clickHandler) {
        // we have no drawing elements!
        if (this.drawingElements.length == 0) {
            // Create our drawing element
            var e = paper.rect(x * GameVals.tileSize, y * GameVals.tileSize, GameVals.tileSize, GameVals.tileSize).attr({ fill: '#FEE' });
            e.click(function () { clickHandler(x, y, "table"); });
            this.drawingElements.push(e);
        }
        _super.prototype.draw.call(this, paper, x, y, clickHandler);
    };
    return Table;
})(Furniture);
PlacableFurniture.push(Table);
var BigDesk = (function (_super) {
    __extends(BigDesk, _super);
    function BigDesk() {
        _super.call(this);
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
    BigDesk.prototype.draw = function (paper, x, y, clickHandler) {
        // we have no drawing elements!
        if (this.drawingElements.length == 0) {
            // Create our drawing element
            var e = paper.rect(x * GameVals.tileSize, y * GameVals.tileSize, GameVals.tileSize, GameVals.tileSize).attr({ fill: '#F5F5DC' });
            e.click(function () { clickHandler(x, y, "desk"); });
            this.drawingElements.push(e);
        }
        _super.prototype.draw.call(this, paper, x, y, clickHandler);
    };
    return BigDesk;
})(Furniture);
PlacableFurniture.push(BigDesk);
var Computer = (function (_super) {
    __extends(Computer, _super);
    function Computer() {
        _super.call(this);
        this.requires = SlotType.counter;
        this.provides = SlotType.computer;
    }
    Computer.prototype.draw = function (paper, x, y, clickHandler) {
        // we have no drawing elements!
        if (this.drawingElements.length == 0) {
            // Create our drawing element
            var e = paper.rect((x + .2) * GameVals.tileSize, (y + .1) * GameVals.tileSize, GameVals.tileSize * .6, GameVals.tileSize * .8).attr({ fill: '#333' });
            e.click(function () { clickHandler(x, y, "computer"); });
            this.drawingElements.push(e);
        }
        _super.prototype.draw.call(this, paper, x, y, clickHandler);
    };
    return Computer;
})(Furniture);
PlacableFurniture.push(Computer);
var Monitor = (function (_super) {
    __extends(Monitor, _super);
    function Monitor() {
        _super.call(this);
        this.requires = SlotType.counter;
        this.provides = SlotType.monitor;
    }
    Monitor.prototype.draw = function (paper, x, y, clickHandler) {
        // we have no drawing elements!
        if (this.drawingElements.length == 0) {
            // Create our drawing element
            var e = paper.rect((x + .1) * GameVals.tileSize, (y + .4) * GameVals.tileSize, GameVals.tileSize * .8, GameVals.tileSize * .2).attr({ fill: '#333' });
            e.click(function () { clickHandler(x, y, "monitor"); });
            this.drawingElements.push(e);
        }
        _super.prototype.draw.call(this, paper, x, y, clickHandler);
    };
    return Monitor;
})(Furniture);
PlacableFurniture.push(Monitor);
var CoffeeMachine = (function (_super) {
    __extends(CoffeeMachine, _super);
    function CoffeeMachine() {
        _super.call(this);
        this.requires = SlotType.counter;
        this.provides = SlotType.coffeemachine;
    }
    CoffeeMachine.prototype.draw = function (paper, x, y, clickHandler) {
        // we have no drawing elements!
        if (this.drawingElements.length == 0) {
            // Create our drawing element
            var e = paper.rect((x + .4) * GameVals.tileSize, (y + .3) * GameVals.tileSize, GameVals.tileSize * .4, GameVals.tileSize * .2).attr({ fill: '#EEE' });
            e.click(function () { clickHandler(x, y, "coffeemachine"); });
            this.drawingElements.push(e);
        }
        _super.prototype.draw.call(this, paper, x, y, clickHandler);
    };
    return CoffeeMachine;
})(Furniture);
PlacableFurniture.push(CoffeeMachine);
var Toilet = (function (_super) {
    __extends(Toilet, _super);
    function Toilet() {
        _super.call(this);
        this.requires = SlotType.floor;
        this.provides = SlotType.toilet;
    }
    Toilet.prototype.tileProvides = function () {
        return [SlotType.toilet];
    };
    Toilet.prototype.draw = function (paper, x, y, clickHandler) {
        // we have no drawing elements!
        if (this.drawingElements.length == 0) {
            // Create our drawing element
            var e = paper.ellipse((x + .5) * GameVals.tileSize, (y + .5) * GameVals.tileSize, GameVals.tileSize * .4, GameVals.tileSize * .5).attr({ fill: '#DDD' });
            e.click(function () { clickHandler(x, y, "toilet"); });
            this.drawingElements.push(e);
            e = paper.rect((x + .1) * GameVals.tileSize, (y + .1) * GameVals.tileSize, GameVals.tileSize * .8, GameVals.tileSize * .2).attr({ fill: '#EEE' });
            e.click(function () { clickHandler(x, y, "toilet"); });
            this.drawingElements.push(e);
        }
        _super.prototype.draw.call(this, paper, x, y, clickHandler);
    };
    return Toilet;
})(WorkSpot);
PlacableFurniture.push(Toilet);
var Sink = (function (_super) {
    __extends(Sink, _super);
    function Sink() {
        _super.call(this);
        this.requires = SlotType.counter;
        this.provides = SlotType.sink;
    }
    Sink.prototype.draw = function (paper, x, y, clickHandler) {
        // we have no drawing elements!
        if (this.drawingElements.length == 0) {
            // Create our drawing element
            var e = paper.ellipse((x + .5) * GameVals.tileSize, (y + .5) * GameVals.tileSize, GameVals.tileSize * .4, GameVals.tileSize * .3).attr({ fill: '#DDD' });
            e.click(function () { clickHandler(x, y, "sink"); });
            this.drawingElements.push(e);
        }
        _super.prototype.draw.call(this, paper, x, y, clickHandler);
    };
    return Sink;
})(Furniture);
PlacableFurniture.push(Sink);
function GetTopFurniturePiece(start) {
    var last = null;
    var cur = start;
    while (cur.slot != null && typeof (cur.slot) != typeof (Employee)) {
        last = cur;
        cur = cur.slot;
    }
    return cur;
}
function Contains(hay, needles) {
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
var Employee = (function () {
    function Employee() {
        this.moveTicks = 0;
        this.x = 1;
        this.y = 1;
        this.salary = 100;
        this.drawingElements = new Array();
        // sleep, water, food, bathroom, nicotine, work, coffee, fun };
        this.needs = new Needs([1, 1.1, 1.5, 2, 0, 8, 1.9, .5]);
    }
    Employee.prototype.move = function (wants, office) {
        if (Contains(office.grid[this.x][this.y].tileProvides(), wants)) {
            console.log("THERE!");
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
        }
        else {
            //follow path
            if (this.x == this.path.x && this.y == this.path.y) {
                this.drawingElements.forEach(function (value) {
                    value.toFront();
                });
                this.path = this.path.next;
                if (this.path != null) {
                    //can we go there?
                    if (office.grid[this.path.x][this.path.y].passable()) {
                        //remove yourself from the last place
                        var t = GetTopFurniturePiece(office.grid[this.path.x][this.path.y]);
                        if (t.hasOwnProperty('occupied')) {
                            t.occupied = this;
                        }
                        //and add yourself to the new one!
                        this.x = this.path.x;
                        this.y = this.path.y;
                    }
                    else {
                        this.path = null;
                        this.moveTicks = 100;
                    }
                }
                else {
                }
            }
            else {
                console.log("WTF TRIED TO FOLLOW PATH YOU WERENT ON!!!!!");
            }
        }
    };
    Employee.prototype.update = function (office) {
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
                    }
                    this.currentAction = null;
                }
            }
            else {
                if (this.moveTicks > 4) {
                    this.move(this.currentAction.requires, office);
                    this.moveTicks = 0;
                }
            }
        }
        else {
            this.currentAction = FindAction(t);
        }
        return c;
    };
    Employee.prototype.draw = function (paper) {
        var _this = this;
        if (this.drawingElements.length == 0) {
            //var e = paper.circle((this.x + .5) * GameVals.tileSize, (this.y + .5) * GameVals.tileSize, GameVals.tileSize * .4).attr({ fill: '#f00', stroke: 'f00' });
            var e = paper.image("img/dev.png", (this.x + .1) * GameVals.tileSize, (this.y + .1) * GameVals.tileSize, 16, 16);
            this.drawingElements.push(e);
        }
        this.drawingElements.forEach(function (value) {
            value.animate({
                "x": (_this.x + .1) * GameVals.tileSize,
                "y": (_this.y + .1) * GameVals.tileSize
            }, GameVals.updateInterval * 10, ">");
        });
    };
    Employee.prototype.destroy = function () {
        this.drawingElements.forEach(function (value) { value.remove(); });
        this.drawingElements = null;
    };
    return Employee;
})();
var PathNode = (function () {
    function PathNode(x, y, n) {
        this.x = x;
        this.y = y;
        this.next = n;
    }
    PathNode.prototype.last = function () {
        if (this.next == null) {
            return this;
        }
        return this.next.last();
    };
    return PathNode;
})();
var SearchNode = (function () {
    function SearchNode(c, f, parent) {
        this.c = c;
        this.fscore = f;
        this.parent = parent;
    }
    SearchNode.prototype.toPath = function (nextNodes) {
        // need to navigate backwards
        var cur = new PathNode(this.c.x, this.c.y, nextNodes);
        if (this.parent == null) {
            return cur;
        }
        return this.parent.toPath(cur);
    };
    return SearchNode;
})();
var SearchGrid = (function () {
    function SearchGrid(start, types, o) {
        this.types = types;
        this.office = o;
        this.open = new Array();
        this.closed = new Array();
        this.open.push(new SearchNode(start, 0));
    }
    SearchGrid.prototype.getLowest = function (array) {
        var min = Number.MAX_VALUE;
        var mindex = -1;
        for (var index in array) {
            if (array[index].fscore <= min) {
                min = array[index].fscore;
                mindex = index;
            }
        }
        if (mindex == -1) {
        }
        return array[mindex];
    };
    SearchGrid.prototype.contains = function (array, coord) {
        for (var k in array) {
            if (array[k].c.x == coord.x && array[k].c.y == coord.y) {
                return true;
            }
        }
        return false;
    };
    SearchGrid.prototype.remove = function (n, array) {
        for (var k in array) {
            if (n == array[k]) {
                array.splice(k, 1);
                break;
            }
        }
    };
    SearchGrid.prototype.run = function () {
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
    };
    return SearchGrid;
})();
var Coord = (function () {
    function Coord(x, y) {
        this.x = x;
        this.y = y;
    }
    Coord.prototype.left = function () { if (this.x <= 0) {
        return this;
    } return new Coord(this.x - 1, this.y); };
    Coord.prototype.right = function (max) { if (this.x + 1 >= max) {
        return this;
    } return new Coord(this.x + 1, this.y); };
    Coord.prototype.up = function () { if (this.y <= 0) {
        return this;
    } return new Coord(this.x, this.y - 1); };
    Coord.prototype.down = function (max) { if (this.y + 1 >= max) {
        return this;
    } return new Coord(this.x, this.y + 1); };
    return Coord;
})();
var Need = (function () {
    function Need(timesPerDay) {
        this.amt = 0;
        this.rate = 100 * (timesPerDay / GameVals.ticksPerDay);
    }
    Need.prototype.update = function (effects) {
        this.amt += this.rate;
        if (this.amt >= 150) {
            this.amt = 150;
            return NeedLevel.urgent;
        }
        else if (this.amt < 100) {
            return NeedLevel.satisfied;
        }
        return NeedLevel.want;
    };
    Need.prototype.satiate = function (newLevel) {
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
    };
    return Need;
})();
var Needs = (function () {
    function Needs(f) {
        this.list = new Array();
        for (var index in f) {
            this.list[index] = new Need(f[index]);
        }
    }
    //updates and returns most pressing need AS ITS STRING
    Needs.prototype.update = function (effects) {
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
    };
    Needs.prototype.satiate = function (t, newLevel) {
        //console.log("trying to satisfy " + t);
        this.list[t].satiate(newLevel);
    };
    return Needs;
})();
//# sourceMappingURL=game.js.map
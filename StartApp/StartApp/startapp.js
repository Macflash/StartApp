/// <reference path="inc/angular.d.ts" />
/// <reference path="inc/angular-cookies.d.ts" />

// declare a module
var app = angular.module('startApp', ['ui.bootstrap']);

app.controller('mainGameController', function ($scope, $interval) {
    $scope.selected = -1;
    $scope.employeeIdCounter = 0;
    $scope.placableFurniture = PlacableFurniture;
    console.log($scope.placableFurniture);
    $scope.playing = false;
    $scope.interval = null;
    $scope.currentClickType = "select";
    $scope.setClickType = function (type) { $scope.currentClickType = type; }
    $scope.ClickHandler = function (x, y, sourcetype) {
        $scope.game.clickHandler($scope.currentClickType, x, y, sourcetype);
    }
    $scope.paper = Raphael("StartAppCanvas", 100, 100);
    $scope.paper.click = function (event) {
        console.log("X: " + event.x + " Y: " + event.y);
    }

    $scope.stop = function () {
        if ($scope.interval != null) {
            $interval.cancel($scope.interval);
            $scope.interval = null;
        }
    }

    if ($scope.game == null) {
        console.log("making new game");
        $scope.game = new Game();
    }
    $scope.clear = function () {
        console.log("clearing old game, making new game");
        $scope.stop();
        $scope.game = new Game();
    }
    $scope.draw = function () {
        $scope.game.office.draw($scope.paper, $scope.ClickHandler);
        for (var e in $scope.game.employees) {
            $scope.game.employees[e].draw($scope.paper, $scope.selected);
        }
    }
    $scope.run = function () {
        var start = Date.now();
        // increment tick counter
        $scope.game.tick++;
        
        if ($scope.game.code >= CodeMilestones[$scope.game.milestone]) {
            $scope.game.milestone++;
        }

        // increment day counter
        if ($scope.game.tick >= GameVals.ticksPerDay) {
            $scope.game.tick = 0;
            $scope.game.day++;
        }

        if($scope.game.tick % 50 == 0){
            $scope.codebar = 100 * $scope.game.code / CodeMilestones[$scope.game.milestone];
        }

        // if its the first tick of the first day of the pay period pay people
        if ($scope.game.day % GameVals.daysPerPayPeriod == 0 && $scope.game.tick == 0) {
            $scope.game.week++;
            for (var e in $scope.game.employees) {
                $scope.game.money -= $scope.game.employees[e].salary;
            }
        }

        $scope.game.update();
        $scope.draw();
    }

    $scope.hire = function () {
        $scope.employeeIdCounter++;
        $scope.game.employees.push(new Employee($scope.employeeIdCounter));
    }

    $scope.fire = function () {
        var temp = $scope.game.employees.pop();
        temp.destroy();
    }

    $scope.start = function () {
        if ($scope.interval == null) {
            $scope.paper.setSize($scope.game.office.width * GameVals.tileSize, $scope.game.office.height * GameVals.tileSize);
            $scope.interval = $interval($scope.run, GameVals.updateInterval);
        }
    }
});

app.controller('appTabsController', function ($scope) {
}).directive('appTabs', function () {
    return {
        replace: true,
        templateUrl: 'templates/tabs.html'
    };
});

app.controller('appSidebarController', function ($scope) {
}).directive('appSidebar', function () {
    return {
        replace: true,
        templateUrl: 'templates/sidebar.html'
    };
});

app.controller('appCanvasController', function ($scope) {
}).directive('appCanvas', function () {
    return {
        replace: true,
        templateUrl: 'templates/canvas.html'
    };
});
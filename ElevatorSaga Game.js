{
init: function(elevators, floors) {
    var MAX_CAPACITY = 4;
    var floorQueueUp = [];
    var floorQueueDown = [];

    // ***** Setup Floor Event Handlers *****
    for (var floor of floors) {
        floor.on("up_button_pressed down_button_pressed", function(event) {
            // Elevator Selector to route Floor Event to appropriate elevator
            var elevatorIndex = elevatorSelector(this.floorNum(), event);
            if (elevatorIndex > -1) {
                elevators[elevatorIndex].goToFloor(this.floorNum());
                elevators[elevatorIndex].setIndicator(event);
                var logElevatorQue = elevators[elevatorIndex].destinationQueue;
            }
            // If no elevator found: Add to Up or Down Floor Queue & Sort 
            else {
                if (event=="up_botton_pressed") {
                    floorQueueUp.push(this.floorNum());
                    floorQueueUp.sortAsc();
                } else {
                    floorQueueDown.push(this.floorNum());
                    floorQueueDown.sortDesc();
                }
            }

            console.log(event + " on floor: " + this.floorNum() + " Up Queue: " + floorQueueUp + " Down Queue: " + floorQueueDown + " Elevator Queue: " + logElevatorQue);
            console.log("Selected Elevator: " + elevatorIndex);
        });
    }

    // Finds Elevator going same direction + has not passed yet + has space + closest
    function elevatorSelector(floorNum, event) {

        function notFull(elevator) {
            return elevator.obj.getRiderCount() < MAX_CAPACITY;
        }
        function notPassed(elevator) {
            if (elevator.obj.goingUp) {
                return elevator.obj.currentFloor() <= floorNum;
            } else {
                return elevator.obj.currentFloor() >= floorNum;  
            }
        }
        function sortClosest(elevator1, elevator2) {
            if (Math.abs(elevator1.obj.currentFloor()-floorNum) > Math.abs(elevator2.obj.currentFloor()-floorNum)) {
                return 1;
            } else if (Math.abs(elevator1.obj.currentFloor()-floorNum) < Math.abs(elevator2.obj.currentFloor()-floorNum)) {
                return -1;
            }
            return 0;
        }

        var potentialElevators = [];
        for (var i=0; i<elevators.length; i++) {
            potentialElevators.push({index: i, obj: elevators[i]});
        }
        potentialElevators = potentialElevators.filter(notFull);
        potentialElevators = potentialElevators.filter(notPassed);
        potentialElevators = potentialElevators.sort(sortClosest);

        if (potentialElevators.length == 0) {
            return -1;
        }
        else {
            return potentialElevators[0].index;
        }
    }
    
    // ***** Setup Elevator Event Handlers *****
    for (var elevator of elevators) {
        elevator.goingUp = true;
        elevator.ridersPerFloor = new Array(floors.length);
        for (var i = 0; i < elevator.ridersPerFloor.length; i++) elevator.ridersPerFloor[i] = 0;

        // ****** Event Handlers *******
        elevator.on("floor_button_pressed", function(floorNum) {
            this.ridersPerFloor[floorNum]++;

            if (this.getRiderCount()<MAX_CAPACITY) {
                this.goToFloor(floorNum);
            }

            console.log("Elevator Btn Pushed for floor " + floorNum + ". Rider Cnt: " + this.getRiderCount() + ". Elevator Queue: " + this.destinationQueue);
        });

        elevator.on("passing_floor", function(floorNum, direction) {
            // If floor exists anywhere in destination Queue, Stop here.
            if (this.destinationQueue.indexOf(floorNum) > 0) {
                this.destinationQueue.splice(0,0,floorNum);
                this.checkDestinationQueue();
            }
            // If elevator has vacany & floor exists anywhere in appropriate Up & Down queue, Stop here.
            if (this.getRiderCount()<MAX_CAPACITY && this.goingUp && floorQueueUp.indexOf(floorNum)>-1) {
                this.destinationQueue.splice(0,0,floorNum);
                this.checkDestinationQueue();
                floorQueueUp.splice(floorQueueUp.indexOf(floorNum),1);
            } else if (this.getRiderCount()<MAX_CAPACITY && !this.goingUp && floorQueueDown.indexOf(floorNum)>-1) {
                this.destinationQueue.splice(0,0,floorNum);
                this.checkDestinationQueue();
                floorQueueUp.splice(floorQueueDown.indexOf(floorNum),1);
            }
        });

        // - Calculate Elevator Occupancy
        // - If vacany: Find floor from floor queue going same direction and that we haven't passed yet. Add to Elevator's Dest Queue
        // - Set Elevator Indicator
        elevator.on("stopped_at_floor", function(floorNum) {
            this.ridersPerFloor[floorNum] = 0;
            clearFloorQueues(floorNum);

            function isGreater(element) {
                return element > floorNum;
            }

            if (this.getRiderCount()<MAX_CAPACITY) {
                if (this.goingUp) {
                    var i = floorQueueUp.findIndex(isGreater);
                    if (i != -1) {
                        this.goToFloor(floorQueueUp.splice(i,1));
                        this.setIndicator();
                    }
                } else {
                    var i = floorQueueDown.findIndex(isGreater);
                    if (i != -1) {
                        this.goToFloor(floorQueueDown.splice(i,1));
                        this.setIndicator();
                    }
                }
            }
        });

        // - Calculate next direction. If difference of Up & Down Queue size is significant, go with higher queue.  
        //   If around same, determine based off current floor.
        // - If all queues are empty, go to Floor 0 since higher percentage of people start here.
        elevator.on("idle", function() {
            var queueDelta = Math.abs(floorQueueUp.length - floorQueueDown.length);
            var queueVariance = queueDelta/floors.length;
            var targetQueue = [];
            if (queueVariance == 0) {
                this.goToFloor(0);
            }
            // One of the queues is at least 20% larger
            else if (queueVariance >= .2) {
                if (floorQueueUp.length >floorQueueDown.length) {
                    targetQueue = floorQueueUp;
                    this.goingUp = true;
                    this.setIndicator("up_button_pressed");
                } else {
                    targetQueue = floorQueueDown;
                    this.goingUp = false;
                    this.setIndicator("down_button_pressed");
                }
            // Almost equal
            } else {
                // Choose queue based on current floor
                if (this.currentFloor()<=floors.length/2) {
                    targetQueue = floorQueueUp;
                    this.goingUp = true;
                    this.setIndicator("up_button_pressed");
                } else {
                    targetQueue = floorQueueDown;
                    this.goingUp = false;                    
                    this.setIndicator("down_button_pressed");
                }
            }
            this.destinationQueue = targetQueue.slice(0);
            this.checkDestinationQueue();

            console.log("Idle Elevator Processed")
        });

        // ****** Elevator Functions *******
        elevator.getRiderCount = function() {
            return this.ridersPerFloor.reduce(function(a,b) {
                return a+b;
            });
        };

        elevator.setIndicator = function(event) {
            if (event == "up_button_pressed") {
                this.goingDownIndicator(false);
                this.goingUpIndicator(true);
                this.goingUp = true;
            } else if (event == "down_button_pressed") {
                this.goingDownIndicator(true);
                this.goingUpIndicator(false);
                this.goingUp = false;
            } else if (this.destinationQueue[0]>=this.currentFloor()) {
                this.goingDownIndicator(false);
                this.goingUpIndicator(true);
                this.goingUp = true;
            } else {
                this.goingUpIndicator(false);
                this.goingDownIndicator(true);
                this.goingUp = false;
            }
        }
    }

    // *******  Helper Utilities  *******
    function clearFloorQueues(floorNum) {
        var filter = function(el) {return el!=floorNum;};
        floorQueueUp = floorQueueUp.filter(filter);
        floorQueueDown = floorQueueDown.filter(filter);
    };
    function removeDuplicates(queue) {
        for(var i=0;i<=9;i++) {
            removeRecursion(queue,i);
        }
        function removeRecursion(queue,i) {
            if (queue.indexOf(i) != queue.lastIndexOf(i)) {
                queue.splice(queue.lastIndexOf(i),1);
                removeRecursion(queue,i);
            } else {
                return;
            }
        }
    }

    //Extending Array Class with Helpers
    Array.prototype.sortAsc = function () {
        function sortNumber(a,b) {
            return a - b;
        }
        return this.sort(sortNumber);
    };
    Array.prototype.sortDesc = function () {
        function sortNumber(a,b) {
            return b - a;
        }
        return this.sort(sortNumber);
    };
    if (!Array.prototype.findIndex) {
      Array.prototype.findIndex = function(predicate) {
        if (this == null) {
          throw new TypeError('Array.prototype.findIndex called on null or undefined');
        }
        if (typeof predicate !== 'function') {
          throw new TypeError('predicate must be a function');
        }
        var list = Object(this);
        var length = list.length >>> 0;
        var thisArg = arguments[1];
        var value;

        for (var i = 0; i < length; i++) {
          value = list[i];
          if (predicate.call(thisArg, value, i, list)) {
            return i;
          }
        }
        return -1;
      };
    }

},
update: function(dt, elevators, floors) {
    elevators.forEach(function(e) {
    });
}
}

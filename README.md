## My Elevator Saga Algorithm for the game [http://www.elevatorsaga.com]

**Summary**

 For each Call button press on a floor this algorithm will determine the best elevator to use based off which elevator is going in that direction, if it hasn't passed yet, has vacany, and is the closest.  If no eligible elevators are found, the request goes on a back log queue (Divided into Up and Down Queues for ease of searching later on).  As the elevator is moving in it's direction, if any call button requests or elevator button request come in that are along the direction the elevator and hasn't passed yet, it will dynamically add this to the Elevator's queue in the correct position.  When the elevator reaches the end of it's direction queue, it re evaluates what queue it should take on next.  If the variance of the Up or Down queue is greater then 20% it chooses that queue.  If less then 20% then it chooses a queue based on the closest location.

A bug in the games design is used to keep track of Elevator occupany by counting the number of Elevator button pushes. Even if a floor is pressed, a rider will press it again inside the elevator.  Unfornutely, this is not the case on Call button presses from floors wo we can't estimate riders waiting there.

Init
	* Create Up & Dwn Floor Queue

Elevator Init:
	* Create Elevator Direction Bool
	* Create Elevator Occupany Count Array

Call Button Event:
	* Elevator Selector to route Floor Event to appropriate elevator
	* Add to selected Elevator's Dest Queue
	* Set Elevator Indicator
	* If no elevator found: Add to Up or Down Floor Queue & Sort

Elevator Button Event:
	* Calculate Elevator Occupancy
	* If Vacancy: Add to Elevator's Dest Queue
	* Set Elevator Indicator

Passing Floor Event:
	* If floor exists anywhere in destination Queue, Stop here.
	* If elevator has vacany & floor exists anywhere in floor appropriate Up & Down queue, stop here.

Reached Floor Event:
	* Calculate Elevator Occupancy
	* If vacany: Pop off Floor Queue. Add to Elevator's Dest Queue
	* Set Elevator Indicator

Elevator Idle Event:
	* Calculate next direction. If difference of Up & Down Queue size is significant, go with higher queue.  If around same, determine based off current floor.
	* If all queues are empty, go to Floor 0 since higher percentage of people start here.

Elevator Selector:
	* Finds Elevator going same direction + has not passed yet + has space + closest

Elevator Occupany:
	* On elevator button press, increment count for that floor in array
	* On reach floor event, clear out value for that floor in array
	* Sum up all array values to determine Occupancy count

------

### Enhacements:
Weighted Voting Algorithm. Rather then move incrementally in a direction. Skip to floor with most entrees in Elevator Queue. Also weight if people are waiting on that floor.  Optimizes throughput.
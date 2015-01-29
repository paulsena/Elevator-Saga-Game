## My Elevator Saga Algorithm for the game http://www.elevatorsaga.com

####Game Background####

This is a web based algorithm game where the user programs the movement and control of a series of elevators.  The goal is to transport people the most efficiently. Depending on how good your algorithm is, you can progress though more difficult levels.


####My Algorithm's Summary####

 For each Call button press on a floor this algorithm will determine the best elevator to use based off which elevator is going in that direction compared to the direction of the floor button push, if the Elevatar hasn't passed yet, has vacany, and finally if still have multiple elvators to choose from at this point, picks the closest. If no eligible elevators are found, the request goes into either the Up or Down direction back log queue.  As the elevator is moving in it's direction, if any floor's call button is pressed that are along the direction the elevator and hasn't passed yet, it will dynamically add this to the Elevator's queue. As the elevator is passing floors, if that floor is anywhere in it's queue, it will also stop.  When the elevator reaches the end of of it's queue, it reevaluates what backlog queue it should take on next.  If the variance of the Up or Down queue is greater then 20% of the total floors, it chooses the larger queue.  If less then 20% then it chooses a queue based on the closest current location.

A bug in the games design is used to keep track of an exact Elevator occupany by counting the number of Elevator button pushes. Even if a floor is alread pressed, a rider will press it again when entering the elevator.  Unfornutely, this is not the case on Call button presses from floors so we can't estimate riders waiting there.

####Event Driven Pseudo Code####
**Init:**
* Create Up & Dwn Floor Queue

**Elevator Init:**
* Create Elevator Direction Bool
* Create Elevator Occupany Count Array

**Call Button Event:**
* Elevator Selector to route Floor Event to appropriate elevator
* Add to selected Elevator's Dest Queue
* Set Elevator Indicator
* If no elevator found: Add to Up or Down Floor Queue & Sort

**Elevator Button Event:**
* Calculate Elevator Occupancy
* If Vacancy: Add to Elevator's Dest Queue
* Set Elevator Indicator

**Passing Floor Event:**
* If floor exists anywhere in destination Queue, Stop here.
* If elevator has vacany & floor exists anywhere in floor appropriate Up & Down queue, stop here.

**Reached Floor Event:**
* Calculate Elevator Occupancy
* If vacany: Pop off Floor Queue. Add to Elevator's Dest Queue
* Set Elevator Indicator

**Elevator Idle Event:**
* Calculate next direction. If difference of Up & Down Queue size is significant, go with higher queue.  If around same, determine based off current floor.
* If all queues are empty, go to Floor 0 since higher percentage of people start here.

**Elevator Selector:**
* Finds Elevator going same direction + has not passed yet + has space + closest

**Elevator Occupany:**
* On elevator button press, increment count for that floor in array
* On reach floor event, clear out value for that floor in array
* Sum up all array values to determine Occupancy count

------

###Future Enhancements:###
Weighted Voting Algorithm. Rather then move incrementally in a direction until at the end of the queue. Skip to floor with most entrees in Elevator Queue and/or has people waiting to enter to maximise throughput. A weight can be assigned for each rider going to a floor, riders waiting on that floor for pickup, and floor 0 which has a higher frequency of riders starting.  Once the weights are summed up, the highest can be picked.
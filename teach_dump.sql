BEGIN TRANSACTION;
CREATE TABLE class_plan_topics (
	id UUID NOT NULL, 
	class_plan_id UUID NOT NULL, 
	"order" INTEGER NOT NULL, 
	title VARCHAR(500) NOT NULL, 
	duration_minutes INTEGER NOT NULL, 
	base_material TEXT NOT NULL, 
	teaching_notes JSON NOT NULL, 
	miscellaneous_notes JSON, 
	created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL, 
	updated_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL, 
	is_active BOOLEAN DEFAULT TRUE, 
	CONSTRAINT pk_class_plan_topics PRIMARY KEY (id), 
	CONSTRAINT uq_class_plan_topics_plan_order UNIQUE (class_plan_id, "order"), 
	CONSTRAINT fk_class_plan_topics_class_plan_id_class_plans FOREIGN KEY(class_plan_id) REFERENCES class_plans (id)
);
INSERT INTO "class_plan_topics" VALUES('bb9e27fe3bb847fc9d2dfb9f200dc60e','48985aa8ed2a410aaec4ce5d82056b48',1,'Newton First Law',15,'Newton First Law states that an object remains at rest or in uniform motion unless acted upon by an external force.','["Start with bus example"]','["JEE relevant"]','2026-08-05 18:41:12','2026-08-05 18:41:12',1);
INSERT INTO "class_plan_topics" VALUES('cfcd29bf325a40a49d602299816bf727','b9d48f81a3894c43890bfa7c9811db9f',1,'Introduction to Motion',8,'What is Motion?

Motion is the change in the position of an object with respect to time relative to a reference point.

An object is said to be in motion if its position changes with time. If the position remains unchanged with respect to the chosen reference point, the object is said to be at rest.

Reference Frame

Motion is always measured with respect to another object called the reference frame.

Example

A passenger sitting inside a moving train is at rest with respect to the train.
The same passenger is in motion with respect to a person standing on the railway platform.

This shows that motion is relative and depends on the observer.

Types of Motion
1. Translational Motion

The entire object moves from one place to another.

Examples:

Car moving on a road
Ball rolling on a straight path
2. Rotational Motion

The object rotates about a fixed axis.

Examples:

Ceiling fan
Earth rotating about its axis
3. Circular Motion

The object moves along a circular path.

Examples:

Stone tied to a string
Satellite orbiting Earth
4. Oscillatory Motion

The object moves to and fro about a mean position.

Examples:

Swing
Pendulum
5. Random Motion

The motion has no fixed path.

Examples:

Dust particles
Gas molecules
Importance of Studying Motion

Motion describes how objects move.

However, it does not explain why they move.

To understand the cause of motion, we study Force and Newton''s Laws of Motion.','["Begin with students walking inside the classroom.", "Ask \"Are you moving?\"", "Introduce the train-passenger example.", "Draw each type of motion.", "at the end ask What causes an object to start moving?"]','["Prerequisite for Mechanics.", "Relative motion is frequently tested conceptually.", "Do not introduce velocity or acceleration here."]','2026-08-05 19:47:06','2026-08-05 19:47:06',1);
INSERT INTO "class_plan_topics" VALUES('74f982daf4cb4ebf8b664ad862cea8a3','b9d48f81a3894c43890bfa7c9811db9f',2,'Force',15,'Introduction

In our daily lives, we constantly experience forces. We push doors to open them, pull drawers to close them, kick a football, lift a school bag, and pull a suitcase. In each of these situations, an interaction occurs between two objects. This interaction is called force.

Force is one of the most fundamental concepts in physics because it explains why an object starts moving, stops moving, changes direction, or changes its shape.

Definition of Force

Force is an external push or pull acting on an object that can change or tend to change its state of rest, state of motion, or shape.

A force always arises due to the interaction between two objects. An object cannot experience a force unless another object exerts it.

Symbol of Force

The standard symbol used to represent force is:

F

Nature of Force

Force is a vector quantity.

A vector quantity has:

Magnitude
Direction

Both magnitude and direction are necessary to completely describe a force.

For example:

Applying 20 N towards the east is different from applying 20 N towards the west.
SI Unit of Force

The SI unit of force is the Newton (N).

Definition of One Newton

One Newton is the force required to produce an acceleration of 1 m/s² in a body of mass 1 kg.

Mathematically,

1 N = 1 kg × 1 m/s²

or

1 N = 1 kg·m/s²

Characteristics of Force

A force can:

1. Change the State of Rest

An object at rest can start moving when a force is applied.

Example:

Kicking a stationary football.
2. Change the State of Motion

A moving object can be stopped or slowed down.

Example:

Applying brakes on a bicycle.
3. Change the Speed of an Object

Force can increase or decrease the speed.

Examples:

Pressing the accelerator increases speed.
Applying brakes decreases speed.
4. Change the Direction of Motion

Force can alter the direction in which an object moves.

Example:

A cricket bat changes the direction of a moving ball.
5. Change the Shape or Size of an Object

Force may deform an object.

Examples:

Compressing a spring.
Stretching a rubber band.
Squeezing a sponge.
Effects of Force

The major effects of force are:

Start motion
Stop motion
Increase speed
Decrease speed
Change direction
Change shape
Produce acceleration
Force is an Interaction

A force cannot exist without interaction between two objects.

Examples:

Hand pushes a box.
Magnet attracts an iron nail.
Earth pulls objects due to gravity.
Rope pulls a bucket.

In every case, two objects interact.

Types of Force

Forces are broadly classified into two categories.

1. Contact Forces

These forces act only when two objects are in physical contact.

Examples include:

(a) Muscular Force

Force produced by muscles.

Examples:

Pushing a table
Lifting a bag
(b) Frictional Force

Force that opposes relative motion between two surfaces.

Examples:

Walking without slipping
Bicycle brakes
(c) Normal Force

The support force exerted by a surface on an object placed on it.

Example:

A book resting on a table experiences an upward normal force.
(d) Tension Force

Force transmitted through a stretched rope, string or cable.

Example:

Pulling a bucket from a well.
(e) Spring Force

Force exerted by a stretched or compressed spring.

Example:

A spring balance.
2. Non-Contact Forces

These forces act even when objects are not touching.

Examples include:

(a) Gravitational Force

The attractive force between any two masses.

Example:

Earth attracting all objects.
(b) Magnetic Force

Force exerted by magnets.

Example:

Magnet attracting iron pins.
(c) Electrostatic Force

Force between electrically charged bodies.

Example:

Rubbed balloon attracting small paper pieces.
Net Force (Resultant Force)

Often, more than one force acts on an object simultaneously.

The vector sum of all the forces acting on an object is called the net force or resultant force.

Case 1: Forces in the Same Direction

If two forces act in the same direction,

Net Force = Sum of the forces

Example:

10 N → + 5 N →

Net Force = 15 N →

Case 2: Forces in Opposite Directions

If forces act in opposite directions,

Net Force = Difference of the forces

Example:

12 N → and 8 N ←

Net Force = 4 N →

Balanced Forces

If the net force acting on an object is zero, the forces are called balanced forces.

Balanced forces do not change the state of motion of an object.

Examples:

A book resting on a table.
Tug of war where both teams pull equally.
Unbalanced Forces

If the net force is not zero, the forces are unbalanced.

Unbalanced forces produce acceleration.

Examples:

Kicking a football.
A car accelerating.
A cyclist applying brakes.
Everyday Examples of Force
Opening a door.
Pulling a suitcase.
Kicking a football.
Catching a cricket ball.
Stretching a rubber band.
Pushing a shopping trolley.
A magnet attracting iron nails.
Earth pulling an apple downward.
Key Points to Remember
Force is a push or pull.
Force is a vector quantity.
Symbol of force is F.
SI unit is Newton (N).
Force always results from the interaction between two objects.
A force may change the motion, direction, speed, or shape of an object.
Forces are classified into contact and non-contact forces.
Multiple forces combine to produce a net force.
Balanced forces have zero resultant force.
Unbalanced forces produce acceleration.','["Start with a classroom activity: ask students to push and pull a chair to introduce force as an interaction.", "Before giving the formal definition, ask students to list everyday actions involving pushing or pulling.", "Emphasize that force does not always produce motion; introduce the example of pushing a wall.", "Draw free-body diagrams while explaining multiple forces and net force.", "Demonstrate balanced forces using a book on a table and unbalanced forces by pushing a toy car.", "Use vector arrows consistently to reinforce that force has both magnitude and direction.", "Avoid introducing F = ma in this topic; reserve it for Newton''s Second Law.", "Encourage students to identify the forces acting in every real-life example."]','["This topic is the foundation for Newton''s Laws of Motion and Free Body Diagrams.", "Students commonly confuse force with energy, power, or momentum.", "Another common misconception is that a force is always required to keep an object moving.", "Understanding contact and non-contact forces is essential before studying friction, gravitation, and electromagnetism.", "Conceptual questions on identifying forces and calculating net force are common in JEE Main.", "Estimated teaching time: 10 minutes for theory, with an additional 5\u201310 minutes recommended for demonstrations and discussion."]','2026-08-05 19:47:06','2026-08-05 19:47:06',1);
INSERT INTO "class_plan_topics" VALUES('9c67502e78054d5081e0c0eb998362fe','11508c5e5b6742c39d11ed32b6ed9bd4',1,'Force',15,'Introduction

In our daily lives, we constantly experience forces. We push doors to open them, pull drawers to close them, kick a football, lift a school bag, and pull a suitcase. In each of these situations, an interaction occurs between two objects. This interaction is called force.

Force is one of the most fundamental concepts in physics because it explains why an object starts moving, stops moving, changes direction, or changes its shape.

Definition of Force

Force is an external push or pull acting on an object that can change or tend to change its state of rest, state of motion, or shape.

A force always arises due to the interaction between two objects. An object cannot experience a force unless another object exerts it.

Symbol of Force

The standard symbol used to represent force is:

F

Nature of Force

Force is a vector quantity.

A vector quantity has:

Magnitude
Direction

Both magnitude and direction are necessary to completely describe a force.

For example:

Applying 20 N towards the east is different from applying 20 N towards the west.
SI Unit of Force

The SI unit of force is the Newton (N).

Definition of One Newton

One Newton is the force required to produce an acceleration of 1 m/s² in a body of mass 1 kg.

Mathematically,

1 N = 1 kg × 1 m/s²

or

1 N = 1 kg·m/s²

Characteristics of Force

A force can:

1. Change the State of Rest

An object at rest can start moving when a force is applied.

Example:

Kicking a stationary football.
2. Change the State of Motion

A moving object can be stopped or slowed down.

Example:

Applying brakes on a bicycle.
3. Change the Speed of an Object

Force can increase or decrease the speed.

Examples:

Pressing the accelerator increases speed.
Applying brakes decreases speed.
4. Change the Direction of Motion

Force can alter the direction in which an object moves.

Example:

A cricket bat changes the direction of a moving ball.
5. Change the Shape or Size of an Object

Force may deform an object.

Examples:

Compressing a spring.
Stretching a rubber band.
Squeezing a sponge.
Effects of Force

The major effects of force are:

Start motion
Stop motion
Increase speed
Decrease speed
Change direction
Change shape
Produce acceleration
Force is an Interaction

A force cannot exist without interaction between two objects.

Examples:

Hand pushes a box.
Magnet attracts an iron nail.
Earth pulls objects due to gravity.
Rope pulls a bucket.

In every case, two objects interact.

Types of Force

Forces are broadly classified into two categories.

1. Contact Forces

These forces act only when two objects are in physical contact.

Examples include:

(a) Muscular Force

Force produced by muscles.

Examples:

Pushing a table
Lifting a bag
(b) Frictional Force

Force that opposes relative motion between two surfaces.

Examples:

Walking without slipping
Bicycle brakes
(c) Normal Force

The support force exerted by a surface on an object placed on it.

Example:

A book resting on a table experiences an upward normal force.
(d) Tension Force

Force transmitted through a stretched rope, string or cable.

Example:

Pulling a bucket from a well.
(e) Spring Force

Force exerted by a stretched or compressed spring.

Example:

A spring balance.
2. Non-Contact Forces

These forces act even when objects are not touching.

Examples include:

(a) Gravitational Force

The attractive force between any two masses.

Example:

Earth attracting all objects.
(b) Magnetic Force

Force exerted by magnets.

Example:

Magnet attracting iron pins.
(c) Electrostatic Force

Force between electrically charged bodies.

Example:

Rubbed balloon attracting small paper pieces.
Net Force (Resultant Force)

Often, more than one force acts on an object simultaneously.

The vector sum of all the forces acting on an object is called the net force or resultant force.

Case 1: Forces in the Same Direction

If two forces act in the same direction,

Net Force = Sum of the forces

Example:

10 N → + 5 N →

Net Force = 15 N →

Case 2: Forces in Opposite Directions

If forces act in opposite directions,

Net Force = Difference of the forces

Example:

12 N → and 8 N ←

Net Force = 4 N →

Balanced Forces

If the net force acting on an object is zero, the forces are called balanced forces.

Balanced forces do not change the state of motion of an object.

Examples:

A book resting on a table.
Tug of war where both teams pull equally.
Unbalanced Forces

If the net force is not zero, the forces are unbalanced.

Unbalanced forces produce acceleration.

Examples:

Kicking a football.
A car accelerating.
A cyclist applying brakes.
Everyday Examples of Force
Opening a door.
Pulling a suitcase.
Kicking a football.
Catching a cricket ball.
Stretching a rubber band.
Pushing a shopping trolley.
A magnet attracting iron nails.
Earth pulling an apple downward.
Key Points to Remember
Force is a push or pull.
Force is a vector quantity.
Symbol of force is F.
SI unit is Newton (N).
Force always results from the interaction between two objects.
A force may change the motion, direction, speed, or shape of an object.
Forces are classified into contact and non-contact forces.
Multiple forces combine to produce a net force.
Balanced forces have zero resultant force.
Unbalanced forces produce acceleration.','["Start with a classroom activity: ask students to push and pull a chair to introduce force as an interaction.", "Before giving the formal definition, ask students to list everyday actions involving pushing or pulling.", "Emphasize that force does not always produce motion; introduce the example of pushing a wall.", "Draw free-body diagrams while explaining multiple forces and net force.", "Demonstrate balanced forces using a book on a table and unbalanced forces by pushing a toy car.", "Use vector arrows consistently to reinforce that force has both magnitude and direction.", "Avoid introducing F = ma in this topic; reserve it for Newton''s Second Law.", "Encourage students to identify the forces acting in every real-life example."]','["This topic is the foundation for Newton''s Laws of Motion and Free Body Diagrams.", "Students commonly confuse force with energy, power, or momentum.", "Another common misconception is that a force is always required to keep an object moving.", "Understanding contact and non-contact forces is essential before studying friction, gravitation, and electromagnetism.", "Conceptual questions on identifying forces and calculating net force are common in JEE Main.", "Estimated teaching time: 10 minutes for theory, with an additional 5\u201310 minutes recommended for demonstrations and discussion."]','2026-08-05 20:01:26','2026-08-05 20:01:26',1);
CREATE TABLE class_plans (
	id UUID NOT NULL, 
	title VARCHAR(500) NOT NULL, 
	subject VARCHAR(100) NOT NULL, 
	grade VARCHAR(50) NOT NULL, 
	class_label VARCHAR(100) NOT NULL, 
	chapter_name VARCHAR(255) NOT NULL, 
	chapter_number INTEGER, 
	target_exam VARCHAR(100) NOT NULL, 
	language_code VARCHAR(10) NOT NULL, 
	total_duration_minutes INTEGER NOT NULL, 
	status VARCHAR(9) NOT NULL, 
	created_by VARCHAR(255), 
	created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL, 
	updated_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL, 
	is_active BOOLEAN DEFAULT TRUE, 
	CONSTRAINT pk_class_plans PRIMARY KEY (id)
);
INSERT INTO "class_plans" VALUES('48985aa8ed2a410aaec4ce5d82056b48','Laws of Motion','Physics','11','Class 11','Laws of Motion',NULL,'JEE Main','en-IN',15,'PUBLISHED',NULL,'2026-08-05 18:41:12','2026-08-05 18:41:12',1);
INSERT INTO "class_plans" VALUES('b9d48f81a3894c43890bfa7c9811db9f','Motion and Force ','Physics','11','Class 11','Laws of Motion',5,'JEE Main','en-IN',23,'PUBLISHED',NULL,'2026-08-05 19:47:06','2026-08-05 19:47:19',1);
INSERT INTO "class_plans" VALUES('11508c5e5b6742c39d11ed32b6ed9bd4','Force','Physics','11','Class 11','Laws of Motion',5,'JEE Main','en-IN',15,'PUBLISHED',NULL,'2026-08-05 20:01:26','2026-08-05 20:01:56',1);
CREATE TABLE classroom_sessions (
	id UUID NOT NULL, 
	generation_id UUID NOT NULL, 
	current_topic_id UUID, 
	current_state_id VARCHAR(100), 
	session_status VARCHAR(9) NOT NULL, 
	student_identifier VARCHAR(255), 
	created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL, 
	updated_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL, 
	is_active BOOLEAN DEFAULT TRUE, 
	CONSTRAINT pk_classroom_sessions PRIMARY KEY (id), 
	CONSTRAINT fk_classroom_sessions_generation_id_live_class_generations FOREIGN KEY(generation_id) REFERENCES live_class_generations (id), 
	CONSTRAINT fk_classroom_sessions_current_topic_id_class_plan_topics FOREIGN KEY(current_topic_id) REFERENCES class_plan_topics (id)
);
INSERT INTO "classroom_sessions" VALUES('c2f18f70a3be457d966b015f70ae9372','10e84832bd4c48cd824f97bbd7b571c9','bb9e27fe3bb847fc9d2dfb9f200dc60e','explain','ACTIVE',NULL,'2026-08-05 18:41:14','2026-08-05 18:41:14',1);
INSERT INTO "classroom_sessions" VALUES('cba5767a09e6477aa7ffaeb09368df44','dd5b7a4f8adb4bb1a3ff9d2f0f58e30c','bb9e27fe3bb847fc9d2dfb9f200dc60e','doubts','ACTIVE','student','2026-08-05 18:47:44','2026-08-05 18:48:28',1);
INSERT INTO "classroom_sessions" VALUES('b67de6d25526411c92d8012d71181588','dd5b7a4f8adb4bb1a3ff9d2f0f58e30c','bb9e27fe3bb847fc9d2dfb9f200dc60e','examples','ACTIVE','student','2026-08-05 18:50:29','2026-08-05 18:50:43',1);
INSERT INTO "classroom_sessions" VALUES('85492bcff79e4988b4d7befdfd709942','dd5b7a4f8adb4bb1a3ff9d2f0f58e30c','bb9e27fe3bb847fc9d2dfb9f200dc60e','explain','ACTIVE','student','2026-08-05 18:51:21','2026-08-05 18:51:21',1);
INSERT INTO "classroom_sessions" VALUES('0b3b647d223f4058a67494e9a613dbea','dd5b7a4f8adb4bb1a3ff9d2f0f58e30c','bb9e27fe3bb847fc9d2dfb9f200dc60e','examples','ACTIVE','student','2026-08-05 18:53:22','2026-08-05 18:53:37',1);
INSERT INTO "classroom_sessions" VALUES('155f59f3411043469a114ad945e19c96','2d7512db8d654ad595731ee3525de8d8','cfcd29bf325a40a49d602299816bf727','doubts','ACTIVE','student','2026-08-05 19:48:16','2026-08-05 19:49:06',1);
INSERT INTO "classroom_sessions" VALUES('d959f123b1894e28b3b3cd9b0da48599','caa6e5be8d1c48eea22bf6aacd711724',NULL,NULL,'COMPLETED','student','2026-08-05 20:22:31','2026-08-05 20:24:17',1);
INSERT INTO "classroom_sessions" VALUES('41feb7d9a2aa4e269dc687e2945164da','c549534b3cac4e218a77216ebd680157',NULL,NULL,'COMPLETED','student','2026-08-05 20:30:05','2026-08-05 20:37:02',1);
INSERT INTO "classroom_sessions" VALUES('888993bdd837431e87b9d983bb3949d0','c549534b3cac4e218a77216ebd680157','9c67502e78054d5081e0c0eb998362fe','WF002','ACTIVE','student','2026-08-05 20:37:36','2026-08-05 20:38:23',1);
INSERT INTO "classroom_sessions" VALUES('6258502d3bcd467daa9bfd8e096a2f62','c549534b3cac4e218a77216ebd680157',NULL,NULL,'COMPLETED','student','2026-08-06 09:16:05','2026-08-06 09:17:48',1);
CREATE TABLE doubt_messages (
	id UUID NOT NULL, 
	doubt_session_id UUID NOT NULL, 
	"order" INTEGER NOT NULL, 
	student_message TEXT NOT NULL, 
	ai_response TEXT NOT NULL, 
	created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL, 
	updated_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL, 
	is_active BOOLEAN DEFAULT TRUE, 
	CONSTRAINT pk_doubt_messages PRIMARY KEY (id), 
	CONSTRAINT fk_doubt_messages_doubt_session_id_doubt_sessions FOREIGN KEY(doubt_session_id) REFERENCES doubt_sessions (id)
);
INSERT INTO "doubt_messages" VALUES('343a723bd67e4a6796ccd70f081ea314','b61ab29817734a5883e3b63504484148',1,'what is motion?','Great question! Based on what we covered in Introduction to Motion, let me clarify: what is motion? relates to the core concepts we discussed. Remember the key points from the slides and examples we just went through.','2026-08-05 19:50:23','2026-08-05 19:50:23',1);
INSERT INTO "doubt_messages" VALUES('4a8fd2cbd8f644cfb0ad5b8cf66f980f','b61ab29817734a5883e3b63504484148',2,'give me the defination of motion','Great question! Based on what we covered in Introduction to Motion, let me clarify: give me the defination of motion relates to the core concepts we discussed. Remember the key points from the slides and examples we just went through.','2026-08-05 19:50:48','2026-08-05 19:50:48',1);
INSERT INTO "doubt_messages" VALUES('b137cd3bd5ed4da19348512d0fd418fb','5a8f157e65b44e7b91659fd8d0a4ac0a',1,'type of forces','The provided material for Newton''s First Law focuses on the concept that an object''s state of motion (at rest or in uniform motion) changes only if an "external force" acts upon it. However, it does not specify or elaborate on the different types of forces.','2026-08-05 20:23:34','2026-08-05 20:23:34',1);
CREATE TABLE doubt_sessions (
	id UUID NOT NULL, 
	classroom_session_id UUID NOT NULL, 
	topic_id UUID NOT NULL, 
	generation_id UUID NOT NULL, 
	status VARCHAR(6) NOT NULL, 
	topic_context JSON NOT NULL, 
	closed_at DATETIME, 
	created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL, 
	updated_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL, 
	is_active BOOLEAN DEFAULT TRUE, 
	CONSTRAINT pk_doubt_sessions PRIMARY KEY (id), 
	CONSTRAINT fk_doubt_sessions_classroom_session_id_classroom_sessions FOREIGN KEY(classroom_session_id) REFERENCES classroom_sessions (id), 
	CONSTRAINT fk_doubt_sessions_topic_id_class_plan_topics FOREIGN KEY(topic_id) REFERENCES class_plan_topics (id), 
	CONSTRAINT fk_doubt_sessions_generation_id_live_class_generations FOREIGN KEY(generation_id) REFERENCES live_class_generations (id)
);
INSERT INTO "doubt_sessions" VALUES('b61ab29817734a5883e3b63504484148','155f59f3411043469a114ad945e19c96','cfcd29bf325a40a49d602299816bf727','2d7512db8d654ad595731ee3525de8d8','ACTIVE','{"topic_title": "Introduction to Motion", "base_material": "What is Motion?\n\nMotion is the change in the position of an object with respect to time relative to a reference point.\n\nAn object is said to be in motion if its position changes with time. If the position remains unchanged with respect to the chosen reference point, the object is said to be at rest.\n\nReference Frame\n\nMotion is always measured with respect to another object called the reference frame.\n\nExample\n\nA passenger sitting inside a moving train is at rest with respect to the train.\nThe same passenger is in motion with respect to a person standing on the railway platform.\n\nThis shows that motion is relative and depends on the observer.\n\nTypes of Motion\n1. Translational Motion\n\nThe entire object moves from one place to another.\n\nExamples:\n\nCar moving on a road\nBall rolling on a straight path\n2. Rotational Motion\n\nThe object rotates about a fixed axis.\n\nExamples:\n\nCeiling fan\nEarth rotating about its axis\n3. Circular Motion\n\nThe object moves along a circular path.\n\nExamples:\n\nStone tied to a string\nSatellite orbiting Earth\n4. Oscillatory Motion\n\nThe object moves to and fro about a mean position.\n\nExamples:\n\nSwing\nPendulum\n5. Random Motion\n\nThe motion has no fixed path.\n\nExamples:\n\nDust particles\nGas molecules\nImportance of Studying Motion\n\nMotion describes how objects move.\n\nHowever, it does not explain why they move.\n\nTo understand the cause of motion, we study Force and Newton''s Laws of Motion.", "slides": [{"id": "389f7a1a-9a2b-42cf-958f-587effdf53a9", "generation_id": "2d7512db-8d65-4ad5-9573-1ee3525de8d8", "topic_id": "cfcd29bf-325a-40a4-9d60-2299816bf727", "workflow_state_id": "explain", "order": 1, "layout": "title_content", "duration_seconds": 40, "elements": [{"element_id": "55b1ace3-3628-4883-b4fe-ff1ffd168f15", "type": "heading", "content": "Introduction to Motion", "generation_prompt": null, "asset_url": null}, {"element_id": "b5d73d06-0690-48b2-b509-8e0144a9ffcb", "type": "text", "content": "What is Motion?\n\nMotion is the change in the position of an object with respect to time relative to a reference point.\n\nAn object is said to be in motion if its position changes with time. If the posi...", "generation_prompt": null, "asset_url": null}], "is_active": true, "created_at": "2026-08-05T19:47:31", "updated_at": "2026-08-05T19:47:31"}], "quiz_attempts": [{"id": "10cb570e-8e66-4891-a805-10397830e193", "session_id": "155f59f3-4110-4346-9a11-4ad945e19c96", "question_id": "0e3632cb-de72-4987-9e0d-99d39d2346f3", "selected_option_id": "b", "is_correct": true, "feedback_explanation": "Correct! This is a foundational idea that other concepts build upon.", "is_active": true, "created_at": "2026-08-05T19:49:04"}]}',NULL,'2026-08-05 19:50:10','2026-08-05 19:50:10',1);
INSERT INTO "doubt_sessions" VALUES('5a8f157e65b44e7b91659fd8d0a4ac0a','d959f123b1894e28b3b3cd9b0da48599','bb9e27fe3bb847fc9d2dfb9f200dc60e','caa6e5be8d1c48eea22bf6aacd711724','CLOSED','{"topic_title": "Newton First Law", "base_material": "Newton First Law states that an object remains at rest or in uniform motion unless acted upon by an external force.", "slides": [{"id": "071d92b6-f24d-49e3-bd26-adb344f681f3", "generation_id": "caa6e5be-8d1c-48ee-a22b-f6aacd711724", "topic_id": "bb9e27fe-3bb8-47fc-9d2d-fb9f200dc60e", "workflow_state_id": "explain", "order": 1, "layout": "title_content", "duration_seconds": 40, "elements": [{"element_id": "9ab4f1c9-8388-43a9-a089-04beb6314266", "type": "heading", "content": "Newton First Law", "generation_prompt": null, "asset_url": null}, {"element_id": "b9e1e1ea-4daf-4b33-bbc3-9e919c7fdeda", "type": "text", "content": "Newton First Law states that an object remains at rest or in uniform motion unless acted upon by an external force.", "generation_prompt": null, "asset_url": null}], "is_active": true, "created_at": "2026-08-05T18:59:47", "updated_at": "2026-08-05T18:59:47"}], "quiz_attempts": [{"id": "ce458bc9-809a-4b2e-8b15-dd136d1c89ef", "session_id": "d959f123-b189-4e28-b3b3-cd9b0da48599", "question_id": "d75c4fac-dd07-44a1-9f30-babdf6736d2d", "selected_option_id": "b", "is_correct": true, "feedback_explanation": "Correct! This is a foundational idea that other concepts build upon.", "is_active": true, "created_at": "2026-08-05T20:23:18"}]}','2026-08-05 20:24:17.713745','2026-08-05 20:23:25','2026-08-05 20:24:17',1);
INSERT INTO "doubt_sessions" VALUES('62b91b2bc0f84aeea6d71e44e1d1ff05','6258502d3bcd467daa9bfd8e096a2f62','9c67502e78054d5081e0c0eb998362fe','c549534b3cac4e218a77216ebd680157','CLOSED','{"topic_title": "Force", "base_material": "Introduction\n\nIn our daily lives, we constantly experience forces. We push doors to open them, pull drawers to close them, kick a football, lift a school bag, and pull a suitcase. In each of these situations, an interaction occurs between two objects. This interaction is called force.\n\nForce is one of the most fundamental concepts in physics because it explains why an object starts moving, stops moving, changes direction, or changes its shape.\n\nDefinition of Force\n\nForce is an external push or pull acting on an object that can change or tend to change its state of rest, state of motion, or shape.\n\nA force always arises due to the interaction between two objects. An object cannot experience a force unless another object exerts it.\n\nSymbol of Force\n\nThe standard symbol used to represent force is:\n\nF\n\nNature of Force\n\nForce is a vector quantity.\n\nA vector quantity has:\n\nMagnitude\nDirection\n\nBoth magnitude and direction are necessary to completely describe a force.\n\nFor example:\n\nApplying 20 N towards the east is different from applying 20 N towards the west.\nSI Unit of Force\n\nThe SI unit of force is the Newton (N).\n\nDefinition of One Newton\n\nOne Newton is the force required to produce an acceleration of 1 m/s\u00b2 in a body of mass 1 kg.\n\nMathematically,\n\n1 N = 1 kg \u00d7 1 m/s\u00b2\n\nor\n\n1 N = 1 kg\u00b7m/s\u00b2\n\nCharacteristics of Force\n\nA force can:\n\n1. Change the State of Rest\n\nAn object at rest can start moving when a force is applied.\n\nExample:\n\nKicking a stationary football.\n2. Change the State of Motion\n\nA moving object can be stopped or slowed down.\n\nExample:\n\nApplying brakes on a bicycle.\n3. Change the Speed of an Object\n\nForce can increase or decrease the speed.\n\nExamples:\n\nPressing the accelerator increases speed.\nApplying brakes decreases speed.\n4. Change the Direction of Motion\n\nForce can alter the direction in which an object moves.\n\nExample:\n\nA cricket bat changes the direction of a moving ball.\n5. Change the Shape or Size of an Object\n\nForce may deform an object.\n\nExamples:\n\nCompressing a spring.\nStretching a rubber band.\nSqueezing a sponge.\nEffects of Force\n\nThe major effects of force are:\n\nStart motion\nStop motion\nIncrease speed\nDecrease speed\nChange direction\nChange shape\nProduce acceleration\nForce is an Interaction\n\nA force cannot exist without interaction between two objects.\n\nExamples:\n\nHand pushes a box.\nMagnet attracts an iron nail.\nEarth pulls objects due to gravity.\nRope pulls a bucket.\n\nIn every case, two objects interact.\n\nTypes of Force\n\nForces are broadly classified into two categories.\n\n1. Contact Forces\n\nThese forces act only when two objects are in physical contact.\n\nExamples include:\n\n(a) Muscular Force\n\nForce produced by muscles.\n\nExamples:\n\nPushing a table\nLifting a bag\n(b) Frictional Force\n\nForce that opposes relative motion between two surfaces.\n\nExamples:\n\nWalking without slipping\nBicycle brakes\n(c) Normal Force\n\nThe support force exerted by a surface on an object placed on it.\n\nExample:\n\nA book resting on a table experiences an upward normal force.\n(d) Tension Force\n\nForce transmitted through a stretched rope, string or cable.\n\nExample:\n\nPulling a bucket from a well.\n(e) Spring Force\n\nForce exerted by a stretched or compressed spring.\n\nExample:\n\nA spring balance.\n2. Non-Contact Forces\n\nThese forces act even when objects are not touching.\n\nExamples include:\n\n(a) Gravitational Force\n\nThe attractive force between any two masses.\n\nExample:\n\nEarth attracting all objects.\n(b) Magnetic Force\n\nForce exerted by magnets.\n\nExample:\n\nMagnet attracting iron pins.\n(c) Electrostatic Force\n\nForce between electrically charged bodies.\n\nExample:\n\nRubbed balloon attracting small paper pieces.\nNet Force (Resultant Force)\n\nOften, more than one force acts on an object simultaneously.\n\nThe vector sum of all the forces acting on an object is called the net force or resultant force.\n\nCase 1: Forces in the Same Direction\n\nIf two forces act in the same direction,\n\nNet Force = Sum of the forces\n\nExample:\n\n10 N \u2192 + 5 N \u2192\n\nNet Force = 15 N \u2192\n\nCase 2: Forces in Opposite Directions\n\nIf forces act in opposite directions,\n\nNet Force = Difference of the forces\n\nExample:\n\n12 N \u2192 and 8 N \u2190\n\nNet Force = 4 N \u2192\n\nBalanced Forces\n\nIf the net force acting on an object is zero, the forces are called balanced forces.\n\nBalanced forces do not change the state of motion of an object.\n\nExamples:\n\nA book resting on a table.\nTug of war where both teams pull equally.\nUnbalanced Forces\n\nIf the net force is not zero, the forces are unbalanced.\n\nUnbalanced forces produce acceleration.\n\nExamples:\n\nKicking a football.\nA car accelerating.\nA cyclist applying brakes.\nEveryday Examples of Force\nOpening a door.\nPulling a suitcase.\nKicking a football.\nCatching a cricket ball.\nStretching a rubber band.\nPushing a shopping trolley.\nA magnet attracting iron nails.\nEarth pulling an apple downward.\nKey Points to Remember\nForce is a push or pull.\nForce is a vector quantity.\nSymbol of force is F.\nSI unit is Newton (N).\nForce always results from the interaction between two objects.\nA force may change the motion, direction, speed, or shape of an object.\nForces are classified into contact and non-contact forces.\nMultiple forces combine to produce a net force.\nBalanced forces have zero resultant force.\nUnbalanced forces produce acceleration.", "slides": [], "quiz_attempts": [{"id": "aeab27a3-6a03-48df-82ff-150afdfe6cde", "session_id": "6258502d-3bcd-467d-aa9b-fd8e096a2f62", "question_id": "5d22c231-f3da-471e-a7f5-625ea24dbcc2", "selected_option_id": "Q1O1", "is_correct": false, "feedback_explanation": "This statement is correct. Force has both magnitude and direction.", "is_active": true, "created_at": "2026-08-06T09:17:31"}, {"id": "55a285f7-b713-4420-8eeb-d3d1ba3c537b", "session_id": "6258502d-3bcd-467d-aa9b-fd8e096a2f62", "question_id": "5f743816-feed-4aa4-8da5-4ee635a67d57", "selected_option_id": "Q2O2", "is_correct": false, "feedback_explanation": "Incorrect. The net force is the difference, and it acts in the direction of the larger force (East).", "is_active": true, "created_at": "2026-08-06T09:17:36"}]}','2026-08-06 09:17:48.123889','2026-08-06 09:17:42','2026-08-06 09:17:48',1);
CREATE TABLE generated_assets (
	id UUID NOT NULL, 
	generation_id UUID NOT NULL, 
	slide_id UUID NOT NULL, 
	element_id VARCHAR(100) NOT NULL, 
	generation_prompt TEXT NOT NULL, 
	storage_url VARCHAR(1000), 
	status VARCHAR(10) NOT NULL, 
	error_message TEXT, 
	created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL, 
	updated_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL, 
	is_active BOOLEAN DEFAULT TRUE, 
	CONSTRAINT pk_generated_assets PRIMARY KEY (id), 
	CONSTRAINT fk_generated_assets_generation_id_live_class_generations FOREIGN KEY(generation_id) REFERENCES live_class_generations (id), 
	CONSTRAINT fk_generated_assets_slide_id_live_class_slides FOREIGN KEY(slide_id) REFERENCES live_class_slides (id)
);
CREATE TABLE live_class_generations (
	id UUID NOT NULL, 
	class_plan_id UUID NOT NULL, 
	status VARCHAR(23) NOT NULL, 
	error_message TEXT, 
	gemini_model VARCHAR(100) NOT NULL, 
	started_at DATETIME, 
	completed_at DATETIME, 
	created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL, 
	updated_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL, 
	is_active BOOLEAN DEFAULT TRUE, 
	CONSTRAINT pk_live_class_generations PRIMARY KEY (id), 
	CONSTRAINT fk_live_class_generations_class_plan_id_class_plans FOREIGN KEY(class_plan_id) REFERENCES class_plans (id)
);
INSERT INTO "live_class_generations" VALUES('10e84832bd4c48cd824f97bbd7b571c9','48985aa8ed2a410aaec4ce5d82056b48','COMPLETED',NULL,'gemini-2.0-flash','2026-08-05 18:41:12.416796','2026-08-05 18:41:12.441813','2026-08-05 18:41:12','2026-08-05 18:41:12',1);
INSERT INTO "live_class_generations" VALUES('e97b0679287a4f648e82ff96f2686551','48985aa8ed2a410aaec4ce5d82056b48','COMPLETED',NULL,'gemini-2.0-flash','2026-08-05 18:47:23.208760','2026-08-05 18:47:23.233811','2026-08-05 18:47:23','2026-08-05 18:47:23',1);
INSERT INTO "live_class_generations" VALUES('dd5b7a4f8adb4bb1a3ff9d2f0f58e30c','48985aa8ed2a410aaec4ce5d82056b48','COMPLETED',NULL,'gemini-2.0-flash','2026-08-05 18:47:27.662595','2026-08-05 18:47:27.678824','2026-08-05 18:47:27','2026-08-05 18:47:27',1);
INSERT INTO "live_class_generations" VALUES('611311a2612c4c94b6c91b9a08d54ad1','48985aa8ed2a410aaec4ce5d82056b48','COMPLETED',NULL,'gemini-2.0-flash','2026-08-05 18:56:18.106165','2026-08-05 18:56:18.131861','2026-08-05 18:56:18','2026-08-05 18:56:18',1);
INSERT INTO "live_class_generations" VALUES('1fe547983ac2460d8acbc75ed486545c','48985aa8ed2a410aaec4ce5d82056b48','COMPLETED',NULL,'gemini-2.0-flash','2026-08-05 18:56:18.842771','2026-08-05 18:56:18.858719','2026-08-05 18:56:18','2026-08-05 18:56:18',1);
INSERT INTO "live_class_generations" VALUES('637bf29d1ca543fb8585b3860d829388','48985aa8ed2a410aaec4ce5d82056b48','COMPLETED',NULL,'gemini-2.0-flash','2026-08-05 18:56:19.020835','2026-08-05 18:56:19.036002','2026-08-05 18:56:19','2026-08-05 18:56:19',1);
INSERT INTO "live_class_generations" VALUES('caa6e5be8d1c48eea22bf6aacd711724','48985aa8ed2a410aaec4ce5d82056b48','COMPLETED',NULL,'gemini-2.0-flash','2026-08-05 18:59:47.163722','2026-08-05 18:59:47.180119','2026-08-05 18:59:47','2026-08-05 18:59:47',1);
INSERT INTO "live_class_generations" VALUES('2d7512db8d654ad595731ee3525de8d8','b9d48f81a3894c43890bfa7c9811db9f','COMPLETED',NULL,'gemini-2.0-flash','2026-08-05 19:47:31.233288','2026-08-05 19:47:31.275943','2026-08-05 19:47:31','2026-08-05 19:47:31',1);
INSERT INTO "live_class_generations" VALUES('22d91abf62364f24aba39c77b4baf2e1','11508c5e5b6742c39d11ed32b6ed9bd4','FAILED','''The approach is interactive, activity-based, and conceptual, designed to build a strong foundational understanding of force. It begins with real-world experiences, progresses to formal definitions, and then categorizes and explains the different manifestations and effects of force. Emphasis is placed on the vector nature of force and the concept of interaction. Visual aids and conceptual examples are used throughout to reinforce learning, without delving into mathematical formulas (like F=ma) prematurely.'' is not a valid TeachingApproach','gemini-2.5-flash','2026-08-05 20:02:02.042101','2026-08-05 20:02:34.109337','2026-08-05 20:02:02','2026-08-05 20:02:34',1);
INSERT INTO "live_class_generations" VALUES('dfcf0e0f548a4cbfacc285300f69debd','11508c5e5b6742c39d11ed32b6ed9bd4','FAILED','400 INVALID_ARGUMENT. {''error'': {''code'': 400, ''message'': ''* GenerateContentRequest.generation_config.response_schema.properties[pop_quiz_questions].items: missing field.\n* GenerateContentRequest.generation_config.response_schema.properties[workflow].properties[states].items: missing field.\n* GenerateContentRequest.generation_config.response_schema.properties[slides].items: missing field.\n'', ''status'': ''INVALID_ARGUMENT''}}','gemini-2.5-flash','2026-08-05 20:06:39.731367','2026-08-05 20:06:40.713626','2026-08-05 20:06:39','2026-08-05 20:06:40',1);
INSERT INTO "live_class_generations" VALUES('b1999f1d0ac743ef88ff58fe4ef3a0ee','11508c5e5b6742c39d11ed32b6ed9bd4','FAILED','''slide_id''','gemini-2.5-flash','2026-08-05 20:09:21.870085','2026-08-05 20:09:46.061059','2026-08-05 20:09:21','2026-08-05 20:09:46',1);
INSERT INTO "live_class_generations" VALUES('d32ed09065a44fe3bf92986b5690648e','11508c5e5b6742c39d11ed32b6ed9bd4','FAILED','Gemini generation failed: ''NoneType'' object has no attribute ''upper''','gemini-2.5-flash','2026-08-05 20:11:12.323428','2026-08-05 20:11:12.922108','2026-08-05 20:11:12','2026-08-05 20:11:12',1);
INSERT INTO "live_class_generations" VALUES('f84eb5f7acbf47f4ac928a99c8696a66','11508c5e5b6742c39d11ed32b6ed9bd4','FAILED','Gemini generation failed: ''NoneType'' object has no attribute ''upper''','gemini-2.5-flash','2026-08-05 20:12:04.399295','2026-08-05 20:12:05.004157','2026-08-05 20:12:04','2026-08-05 20:12:05',1);
INSERT INTO "live_class_generations" VALUES('4084fdc48cc440deafb6b36f4f251c36','11508c5e5b6742c39d11ed32b6ed9bd4','FAILED','badly formed hexadecimal UUID string','gemini-2.5-flash','2026-08-05 20:18:39.531700','2026-08-05 20:19:13.362958','2026-08-05 20:18:39','2026-08-05 20:19:13',1);
INSERT INTO "live_class_generations" VALUES('c549534b3cac4e218a77216ebd680157','11508c5e5b6742c39d11ed32b6ed9bd4','COMPLETED',NULL,'gemini-2.5-flash','2026-08-05 20:21:18.561514','2026-08-05 20:21:47.180770','2026-08-05 20:21:18','2026-08-05 20:21:47',1);
CREATE TABLE live_class_slides (
	id UUID NOT NULL, 
	generation_id UUID NOT NULL, 
	topic_id UUID NOT NULL, 
	workflow_state_id VARCHAR(100) NOT NULL, 
	"order" INTEGER NOT NULL, 
	layout VARCHAR(100) NOT NULL, 
	duration_seconds INTEGER NOT NULL, 
	elements JSON NOT NULL, 
	created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL, 
	updated_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL, 
	is_active BOOLEAN DEFAULT TRUE, 
	CONSTRAINT pk_live_class_slides PRIMARY KEY (id), 
	CONSTRAINT fk_live_class_slides_generation_id_live_class_generations FOREIGN KEY(generation_id) REFERENCES live_class_generations (id), 
	CONSTRAINT fk_live_class_slides_topic_id_class_plan_topics FOREIGN KEY(topic_id) REFERENCES class_plan_topics (id)
);
INSERT INTO "live_class_slides" VALUES('2bf0473993d346b2b16cbaa58d999e76','10e84832bd4c48cd824f97bbd7b571c9','bb9e27fe3bb847fc9d2dfb9f200dc60e','explain',1,'title_content',40,'[{"element_id": "1aa18ef3-9b27-442e-8ff7-f6bb023b56c3", "type": "heading", "content": "Newton First Law", "generation_prompt": null, "asset_url": null}, {"element_id": "dc70128f-6849-4148-aca3-0b378f421d32", "type": "text", "content": "Newton First Law states that an object remains at rest or in uniform motion unless acted upon by an external force.", "generation_prompt": null, "asset_url": null}]','2026-08-05 18:41:12','2026-08-05 18:41:12',1);
INSERT INTO "live_class_slides" VALUES('f99cf18c077f46c7b119116d21a47485','10e84832bd4c48cd824f97bbd7b571c9','bb9e27fe3bb847fc9d2dfb9f200dc60e','examples',2,'title_content',35,'[{"element_id": "907e893e-f2b4-4193-b3f4-b2a721310e4f", "type": "heading", "content": "Examples", "generation_prompt": null, "asset_url": null}, {"element_id": "0c33a01f-a28d-435b-8aaf-3a8bc74cba07", "type": "text", "content": "Real-life examples help connect theory to practice.", "generation_prompt": null, "asset_url": null}]','2026-08-05 18:41:12','2026-08-05 18:41:12',1);
INSERT INTO "live_class_slides" VALUES('f1338bef631e47ddbfbff4282a00342e','e97b0679287a4f648e82ff96f2686551','bb9e27fe3bb847fc9d2dfb9f200dc60e','explain',1,'title_content',40,'[{"element_id": "8870e603-85b6-4bf2-96be-dc1fd4cea3f4", "type": "heading", "content": "Newton First Law", "generation_prompt": null, "asset_url": null}, {"element_id": "5eb72893-bc9c-4b2c-a22d-986659081599", "type": "text", "content": "Newton First Law states that an object remains at rest or in uniform motion unless acted upon by an external force.", "generation_prompt": null, "asset_url": null}]','2026-08-05 18:47:23','2026-08-05 18:47:23',1);
INSERT INTO "live_class_slides" VALUES('eeb7dde7828c4d51ab6f05567c11dbda','e97b0679287a4f648e82ff96f2686551','bb9e27fe3bb847fc9d2dfb9f200dc60e','examples',2,'title_content',35,'[{"element_id": "086f2fcf-f420-439c-83f8-04a4760e137c", "type": "heading", "content": "Examples", "generation_prompt": null, "asset_url": null}, {"element_id": "57779024-aad9-4080-9f99-b5d3eb80e590", "type": "text", "content": "Real-life examples help connect theory to practice.", "generation_prompt": null, "asset_url": null}]','2026-08-05 18:47:23','2026-08-05 18:47:23',1);
INSERT INTO "live_class_slides" VALUES('7fdb1f26112b4049b465097c61c3398b','dd5b7a4f8adb4bb1a3ff9d2f0f58e30c','bb9e27fe3bb847fc9d2dfb9f200dc60e','explain',1,'title_content',40,'[{"element_id": "bf732c34-6422-492c-b730-763dec927715", "type": "heading", "content": "Newton First Law", "generation_prompt": null, "asset_url": null}, {"element_id": "1213db9e-a8a2-41b8-9fd0-46c7310af0e2", "type": "text", "content": "Newton First Law states that an object remains at rest or in uniform motion unless acted upon by an external force.", "generation_prompt": null, "asset_url": null}]','2026-08-05 18:47:27','2026-08-05 18:47:27',1);
INSERT INTO "live_class_slides" VALUES('84777caf618946ae9e5de1b342b72ed8','dd5b7a4f8adb4bb1a3ff9d2f0f58e30c','bb9e27fe3bb847fc9d2dfb9f200dc60e','examples',2,'title_content',35,'[{"element_id": "a7ae0b92-b182-4d4e-bba5-2841c65e305c", "type": "heading", "content": "Examples", "generation_prompt": null, "asset_url": null}, {"element_id": "47709232-05dd-4742-aa08-69db7fbaa480", "type": "text", "content": "Real-life examples help connect theory to practice.", "generation_prompt": null, "asset_url": null}]','2026-08-05 18:47:27','2026-08-05 18:47:27',1);
INSERT INTO "live_class_slides" VALUES('211b8cdcf5ec40a5a0bac64fa9e890b0','611311a2612c4c94b6c91b9a08d54ad1','bb9e27fe3bb847fc9d2dfb9f200dc60e','explain',1,'title_content',40,'[{"element_id": "425d5fe9-2fa9-46a4-8d13-d0029a99c637", "type": "heading", "content": "Newton First Law", "generation_prompt": null, "asset_url": null}, {"element_id": "9dc435ea-c734-49ce-86f7-01af97205c66", "type": "text", "content": "Newton First Law states that an object remains at rest or in uniform motion unless acted upon by an external force.", "generation_prompt": null, "asset_url": null}]','2026-08-05 18:56:18','2026-08-05 18:56:18',1);
INSERT INTO "live_class_slides" VALUES('9fdb0989106e4bd59fee0ef48a39b721','611311a2612c4c94b6c91b9a08d54ad1','bb9e27fe3bb847fc9d2dfb9f200dc60e','examples',2,'title_content',35,'[{"element_id": "26671f60-7571-422e-85eb-097027a81888", "type": "heading", "content": "Examples", "generation_prompt": null, "asset_url": null}, {"element_id": "dfd0fb71-9974-426b-91a9-f25fc91e327d", "type": "text", "content": "Real-life examples help connect theory to practice.", "generation_prompt": null, "asset_url": null}]','2026-08-05 18:56:18','2026-08-05 18:56:18',1);
INSERT INTO "live_class_slides" VALUES('2942da10fdc345d28cb6ddd39e521285','1fe547983ac2460d8acbc75ed486545c','bb9e27fe3bb847fc9d2dfb9f200dc60e','explain',1,'title_content',40,'[{"element_id": "ae20f777-5c31-4a0f-9dcb-2410c19a7230", "type": "heading", "content": "Newton First Law", "generation_prompt": null, "asset_url": null}, {"element_id": "a042160e-8ea2-435a-afdd-125a9c48a6b4", "type": "text", "content": "Newton First Law states that an object remains at rest or in uniform motion unless acted upon by an external force.", "generation_prompt": null, "asset_url": null}]','2026-08-05 18:56:18','2026-08-05 18:56:18',1);
INSERT INTO "live_class_slides" VALUES('2af41d3289964e509fbc076c901f380f','1fe547983ac2460d8acbc75ed486545c','bb9e27fe3bb847fc9d2dfb9f200dc60e','examples',2,'title_content',35,'[{"element_id": "ddc188ff-e155-4621-abf5-b9f89164e196", "type": "heading", "content": "Examples", "generation_prompt": null, "asset_url": null}, {"element_id": "2c4124ac-5f89-4c78-9d19-62c6098cc85d", "type": "text", "content": "Real-life examples help connect theory to practice.", "generation_prompt": null, "asset_url": null}]','2026-08-05 18:56:18','2026-08-05 18:56:18',1);
INSERT INTO "live_class_slides" VALUES('cce7479b42b64bf2b766fd60238aac9c','637bf29d1ca543fb8585b3860d829388','bb9e27fe3bb847fc9d2dfb9f200dc60e','explain',1,'title_content',40,'[{"element_id": "0c995ecd-8dc7-4dca-a854-2e7764c8d59b", "type": "heading", "content": "Newton First Law", "generation_prompt": null, "asset_url": null}, {"element_id": "9b433de9-f238-4150-9756-1e7c2e1338c9", "type": "text", "content": "Newton First Law states that an object remains at rest or in uniform motion unless acted upon by an external force.", "generation_prompt": null, "asset_url": null}]','2026-08-05 18:56:19','2026-08-05 18:56:19',1);
INSERT INTO "live_class_slides" VALUES('c9d292fb013146b282711afae20862ec','637bf29d1ca543fb8585b3860d829388','bb9e27fe3bb847fc9d2dfb9f200dc60e','examples',2,'title_content',35,'[{"element_id": "b89cb61e-2b47-46b2-ae46-df404af61328", "type": "heading", "content": "Examples", "generation_prompt": null, "asset_url": null}, {"element_id": "f1a1cbe0-376c-4c62-9e4c-28e7f2a833d4", "type": "text", "content": "Real-life examples help connect theory to practice.", "generation_prompt": null, "asset_url": null}]','2026-08-05 18:56:19','2026-08-05 18:56:19',1);
INSERT INTO "live_class_slides" VALUES('071d92b6f24d49e3bd26adb344f681f3','caa6e5be8d1c48eea22bf6aacd711724','bb9e27fe3bb847fc9d2dfb9f200dc60e','explain',1,'title_content',40,'[{"element_id": "9ab4f1c9-8388-43a9-a089-04beb6314266", "type": "heading", "content": "Newton First Law", "generation_prompt": null, "asset_url": null}, {"element_id": "b9e1e1ea-4daf-4b33-bbc3-9e919c7fdeda", "type": "text", "content": "Newton First Law states that an object remains at rest or in uniform motion unless acted upon by an external force.", "generation_prompt": null, "asset_url": null}]','2026-08-05 18:59:47','2026-08-05 18:59:47',1);
INSERT INTO "live_class_slides" VALUES('208119a0e9fc48df9bda841be2e0d887','caa6e5be8d1c48eea22bf6aacd711724','bb9e27fe3bb847fc9d2dfb9f200dc60e','examples',2,'title_content',35,'[{"element_id": "6c9fbb0f-8334-4168-b00b-4736aa6b8abe", "type": "heading", "content": "Examples", "generation_prompt": null, "asset_url": null}, {"element_id": "d7bdc4e6-8aa3-48c1-907f-ab2e14c2a4ba", "type": "text", "content": "Real-life examples help connect theory to practice.", "generation_prompt": null, "asset_url": null}]','2026-08-05 18:59:47','2026-08-05 18:59:47',1);
INSERT INTO "live_class_slides" VALUES('389f7a1a9a2b42cf958f587effdf53a9','2d7512db8d654ad595731ee3525de8d8','cfcd29bf325a40a49d602299816bf727','explain',1,'title_content',40,'[{"element_id": "55b1ace3-3628-4883-b4fe-ff1ffd168f15", "type": "heading", "content": "Introduction to Motion", "generation_prompt": null, "asset_url": null}, {"element_id": "b5d73d06-0690-48b2-b509-8e0144a9ffcb", "type": "text", "content": "What is Motion?\n\nMotion is the change in the position of an object with respect to time relative to a reference point.\n\nAn object is said to be in motion if its position changes with time. If the posi...", "generation_prompt": null, "asset_url": null}]','2026-08-05 19:47:31','2026-08-05 19:47:31',1);
INSERT INTO "live_class_slides" VALUES('08f62120f8e341fea08e9801cfbbd7a1','2d7512db8d654ad595731ee3525de8d8','cfcd29bf325a40a49d602299816bf727','examples',2,'title_content',35,'[{"element_id": "e829dc54-842b-4eed-affc-40285f959242", "type": "heading", "content": "Examples", "generation_prompt": null, "asset_url": null}, {"element_id": "c999c289-888b-4bc7-b37a-5d6190131089", "type": "text", "content": "Real-life examples help connect theory to practice.", "generation_prompt": null, "asset_url": null}]','2026-08-05 19:47:31','2026-08-05 19:47:31',1);
INSERT INTO "live_class_slides" VALUES('23c148268ce940229d75c690f5152c02','2d7512db8d654ad595731ee3525de8d8','74f982daf4cb4ebf8b664ad862cea8a3','explain',1,'title_content',40,'[{"element_id": "91d6a580-9462-4130-b140-96b9920fa16a", "type": "heading", "content": "Force", "generation_prompt": null, "asset_url": null}, {"element_id": "8e93e0d5-33f8-4573-b710-826c05ceef1a", "type": "text", "content": "Introduction\n\nIn our daily lives, we constantly experience forces. We push doors to open them, pull drawers to close them, kick a football, lift a school bag, and pull a suitcase. In each of these sit...", "generation_prompt": null, "asset_url": null}]','2026-08-05 19:47:31','2026-08-05 19:47:31',1);
INSERT INTO "live_class_slides" VALUES('da44b48092cc4f9294b5b4f94992d4ff','2d7512db8d654ad595731ee3525de8d8','74f982daf4cb4ebf8b664ad862cea8a3','examples',2,'title_content',35,'[{"element_id": "71540f28-48f8-4398-9cbe-d34583a032a5", "type": "heading", "content": "Examples", "generation_prompt": null, "asset_url": null}, {"element_id": "4c2cc94b-32b9-4b0e-a29f-dacf234ca7e5", "type": "text", "content": "Real-life examples help connect theory to practice.", "generation_prompt": null, "asset_url": null}]','2026-08-05 19:47:31','2026-08-05 19:47:31',1);
INSERT INTO "live_class_slides" VALUES('f9ea54e401cd4217832c3aac7845a8f8','c549534b3cac4e218a77216ebd680157','9c67502e78054d5081e0c0eb998362fe','WF001',1,'title_content',60,'[{"element_id": "SE001", "type": "heading", "content": "Introduction to Force", "generation_prompt": null, "asset_url": null}, {"element_id": "SE002", "type": "bullet_list", "content": ["Forces are an everyday experience: pushing, pulling, kicking, lifting.", "An interaction between two objects always occurs.", "Force is fundamental in physics, explaining changes in motion or shape."], "generation_prompt": null, "asset_url": null}]','2026-08-05 20:21:47','2026-08-05 20:21:47',1);
INSERT INTO "live_class_slides" VALUES('c640b43035984eeea2fc8ceeeacef625','c549534b3cac4e218a77216ebd680157','9c67502e78054d5081e0c0eb998362fe','WF001',2,'title_content',60,'[{"element_id": "SE003", "type": "heading", "content": "What is Force?", "generation_prompt": null, "asset_url": null}, {"element_id": "SE004", "type": "text", "content": "Force is an external push or pull acting on an object that can change or tend to change its state of rest, state of motion, or shape.", "generation_prompt": null, "asset_url": null}, {"element_id": "SE005", "type": "bullet_list", "content": ["Always arises due to interaction between two objects.", "An object cannot experience a force unless another object exerts it."], "generation_prompt": null, "asset_url": null}]','2026-08-05 20:21:47','2026-08-05 20:21:47',1);
INSERT INTO "live_class_slides" VALUES('d3e91c44bd1d440385df101731b2ad01','c549534b3cac4e218a77216ebd680157','9c67502e78054d5081e0c0eb998362fe','WF002',3,'title_content',75,'[{"element_id": "SE006", "type": "heading", "content": "Symbol and Nature of Force", "generation_prompt": null, "asset_url": null}, {"element_id": "SE007", "type": "bullet_list", "content": ["**Symbol:** F", "**Nature:** Vector Quantity", "A vector quantity has both **Magnitude** and **Direction**.", "Both are necessary for a complete description."], "generation_prompt": null, "asset_url": null}, {"element_id": "SE008", "type": "text", "content": "Example: 20 N towards East is different from 20 N towards West.", "generation_prompt": null, "asset_url": null}]','2026-08-05 20:21:47','2026-08-05 20:21:47',1);
INSERT INTO "live_class_slides" VALUES('c42fef65b62946eaaa1c0ac4abc0cc4e','c549534b3cac4e218a77216ebd680157','9c67502e78054d5081e0c0eb998362fe','WF002',4,'formula_focus',75,'[{"element_id": "SE009", "type": "heading", "content": "SI Unit of Force: Newton (N)", "generation_prompt": null, "asset_url": null}, {"element_id": "SE010", "type": "text", "content": "One Newton (N) is defined as the force required to produce an acceleration of 1 m/s\u00b2 in a body of mass 1 kg.", "generation_prompt": null, "asset_url": null}, {"element_id": "SE011", "type": "latex", "content": "1 \\text{ N} = 1 \\text{ kg} \\times 1 \\text{ m/s}^2 \\\\ \\text{or} \\\\ 1 \\text{ N} = 1 \\text{ kg} \\cdot \\text{m/s}^2", "generation_prompt": null, "asset_url": null}]','2026-08-05 20:21:47','2026-08-05 20:21:47',1);
INSERT INTO "live_class_slides" VALUES('b4732c1125d340539f424722c3a845c9','c549534b3cac4e218a77216ebd680157','9c67502e78054d5081e0c0eb998362fe','WF003',5,'title_content',90,'[{"element_id": "SE012", "type": "heading", "content": "Characteristics / Effects of Force", "generation_prompt": null, "asset_url": null}, {"element_id": "SE013", "type": "bullet_list", "content": ["1. Change the State of Rest (e.g., kicking a stationary football).", "2. Change the State of Motion (e.g., applying brakes on a bicycle).", "3. Change the Speed of an Object (increase/decrease, e.g., accelerator/brakes).", "4. Change the Direction of Motion (e.g., cricket bat hitting a ball).", "5. Change the Shape or Size of an Object (e.g., compressing a spring, stretching a rubber band)."], "generation_prompt": null, "asset_url": null}]','2026-08-05 20:21:47','2026-08-05 20:21:47',1);
INSERT INTO "live_class_slides" VALUES('59dfa68d72a94ebcaf2f099e2a4159f9','c549534b3cac4e218a77216ebd680157','9c67502e78054d5081e0c0eb998362fe','WF003',6,'title_content',60,'[{"element_id": "SE014", "type": "heading", "content": "Force is an Interaction", "generation_prompt": null, "asset_url": null}, {"element_id": "SE015", "type": "text", "content": "A force cannot exist without interaction between two objects.", "generation_prompt": null, "asset_url": null}, {"element_id": "SE016", "type": "bullet_list", "content": ["Hand pushes a box.", "Magnet attracts an iron nail.", "Earth pulls objects due to gravity.", "Rope pulls a bucket."], "generation_prompt": null, "asset_url": null}]','2026-08-05 20:21:47','2026-08-05 20:21:47',1);
INSERT INTO "live_class_slides" VALUES('2388e10e2c0a4a25b6832f6822963761','c549534b3cac4e218a77216ebd680157','9c67502e78054d5081e0c0eb998362fe','WF004',7,'title_content',90,'[{"element_id": "SE017", "type": "heading", "content": "Types of Force: Contact Forces", "generation_prompt": null, "asset_url": null}, {"element_id": "SE018", "type": "text", "content": "These forces act only when two objects are in physical contact.", "generation_prompt": null, "asset_url": null}, {"element_id": "SE019", "type": "bullet_list", "content": ["**(a) Muscular Force:** Force produced by muscles (e.g., pushing a table).", "**(b) Frictional Force:** Opposes relative motion between surfaces (e.g., walking, bicycle brakes).", "**(c) Normal Force:** Support force exerted by a surface perpendicular to it (e.g., book on a table).", "**(d) Tension Force:** Transmitted through a stretched rope/string (e.g., pulling a bucket).", "**(e) Spring Force:** Exerted by a stretched or compressed spring (e.g., spring balance)."], "generation_prompt": null, "asset_url": null}]','2026-08-05 20:21:47','2026-08-05 20:21:47',1);
INSERT INTO "live_class_slides" VALUES('5235a2762e9a41bbba9d8e323017ad2b','c549534b3cac4e218a77216ebd680157','9c67502e78054d5081e0c0eb998362fe','WF005',8,'title_content',90,'[{"element_id": "SE020", "type": "heading", "content": "Types of Force: Non-Contact Forces", "generation_prompt": null, "asset_url": null}, {"element_id": "SE021", "type": "text", "content": "These forces act even when objects are not touching.", "generation_prompt": null, "asset_url": null}, {"element_id": "SE022", "type": "bullet_list", "content": ["**(a) Gravitational Force:** Attractive force between any two masses (e.g., Earth attracting objects).", "**(b) Magnetic Force:** Force exerted by magnets on magnetic materials (e.g., magnet attracting iron pins).", "**(c) Electrostatic Force:** Force between electrically charged bodies (e.g., rubbed balloon attracting paper)."], "generation_prompt": null, "asset_url": null}]','2026-08-05 20:21:47','2026-08-05 20:21:47',1);
INSERT INTO "live_class_slides" VALUES('770d2a71fb6648caae182e4691ced71e','c549534b3cac4e218a77216ebd680157','9c67502e78054d5081e0c0eb998362fe','WF006',9,'title_content',90,'[{"element_id": "SE023", "type": "heading", "content": "Net Force (Resultant Force)", "generation_prompt": null, "asset_url": null}, {"element_id": "SE024", "type": "text", "content": "The vector sum of all forces acting on an object.", "generation_prompt": null, "asset_url": null}, {"element_id": "SE025", "type": "bullet_list", "content": ["**Case 1: Forces in the Same Direction**", "Net Force = Sum of the forces (e.g., 10 N \u2192 + 5 N \u2192 = 15 N \u2192)", "**Case 2: Forces in Opposite Directions**", "Net Force = Difference of the forces (e.g., 12 N \u2192 and 8 N \u2190 = 4 N \u2192)"], "generation_prompt": null, "asset_url": null}]','2026-08-05 20:21:47','2026-08-05 20:21:47',1);
INSERT INTO "live_class_slides" VALUES('79c9837aa2574a768ba1a0daa554675b','c549534b3cac4e218a77216ebd680157','9c67502e78054d5081e0c0eb998362fe','WF006',10,'title_content',90,'[{"element_id": "SE026", "type": "heading", "content": "Balanced vs. Unbalanced Forces", "generation_prompt": null, "asset_url": null}, {"element_id": "SE027", "type": "bullet_list", "content": ["**Balanced Forces:** Net force acting on an object is zero.", "Do not change the state of motion (object remains at rest or moves with constant velocity).", "*Examples:* A book on a table, tug-of-war with equal pull.", "**Unbalanced Forces:** Net force acting on an object is not zero.", "Produce acceleration (change in state of motion).", "*Examples:* Kicking a football, a car accelerating, a cyclist braking."], "generation_prompt": null, "asset_url": null}]','2026-08-05 20:21:47','2026-08-05 20:21:47',1);
CREATE TABLE pop_quiz_attempts (
	id UUID NOT NULL, 
	session_id UUID NOT NULL, 
	question_id UUID NOT NULL, 
	selected_option_id VARCHAR(10) NOT NULL, 
	is_correct BOOLEAN NOT NULL, 
	feedback_explanation TEXT NOT NULL, 
	created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL, 
	updated_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL, 
	is_active BOOLEAN DEFAULT TRUE, 
	CONSTRAINT pk_pop_quiz_attempts PRIMARY KEY (id), 
	CONSTRAINT fk_pop_quiz_attempts_session_id_classroom_sessions FOREIGN KEY(session_id) REFERENCES classroom_sessions (id), 
	CONSTRAINT fk_pop_quiz_attempts_question_id_pop_quiz_questions FOREIGN KEY(question_id) REFERENCES pop_quiz_questions (id)
);
INSERT INTO "pop_quiz_attempts" VALUES('7693d97a198e4f37ad25a0b18ff64919','cba5767a09e6477aa7ffaeb09368df44','151526529f584b4185b06bad53a1c1d6','a',0,'Not quite — this topic is central to the chapter we are studying.','2026-08-05 18:48:25','2026-08-05 18:48:25',1);
INSERT INTO "pop_quiz_attempts" VALUES('10cb570e8e664891a80510397830e193','155f59f3411043469a114ad945e19c96','0e3632cbde7249879e0d99d39d2346f3','b',1,'Correct! This is a foundational idea that other concepts build upon.','2026-08-05 19:49:04','2026-08-05 19:49:04',1);
INSERT INTO "pop_quiz_attempts" VALUES('ce458bc9809a4b2e8b15dd136d1c89ef','d959f123b1894e28b3b3cd9b0da48599','d75c4facdd0744a19f30babdf6736d2d','b',1,'Correct! This is a foundational idea that other concepts build upon.','2026-08-05 20:23:18','2026-08-05 20:23:18',1);
INSERT INTO "pop_quiz_attempts" VALUES('1e6e386fd5ee47ce84f6793f2ea9f2df','41feb7d9a2aa4e269dc687e2945164da','5d22c231f3da471ea7f5625ea24dbcc2','Q1O2',0,'This statement is correct. Newton is the SI unit for force.','2026-08-05 20:35:59','2026-08-05 20:35:59',1);
INSERT INTO "pop_quiz_attempts" VALUES('1a7c2f7ad5f147fb8f88271245eed41f','41feb7d9a2aa4e269dc687e2945164da','5f743816feed4aa48da54ee635a67d57','Q2O1',0,'Incorrect. Forces in opposite directions subtract, not add.','2026-08-05 20:36:57','2026-08-05 20:36:57',1);
INSERT INTO "pop_quiz_attempts" VALUES('aeab27a36a0348df82ff150afdfe6cde','6258502d3bcd467daa9bfd8e096a2f62','5d22c231f3da471ea7f5625ea24dbcc2','Q1O1',0,'This statement is correct. Force has both magnitude and direction.','2026-08-06 09:17:31','2026-08-06 09:17:31',1);
INSERT INTO "pop_quiz_attempts" VALUES('55a285f7b71344208eebd3d1ba3c537b','6258502d3bcd467daa9bfd8e096a2f62','5f743816feed4aa48da54ee635a67d57','Q2O2',0,'Incorrect. The net force is the difference, and it acts in the direction of the larger force (East).','2026-08-06 09:17:36','2026-08-06 09:17:36',1);
CREATE TABLE pop_quiz_questions (
	id UUID NOT NULL, 
	generation_id UUID NOT NULL, 
	topic_id UUID NOT NULL, 
	question_text TEXT NOT NULL, 
	options JSON NOT NULL, 
	"order" INTEGER NOT NULL, 
	created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL, 
	updated_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL, 
	is_active BOOLEAN DEFAULT TRUE, 
	CONSTRAINT pk_pop_quiz_questions PRIMARY KEY (id), 
	CONSTRAINT fk_pop_quiz_questions_generation_id_live_class_generations FOREIGN KEY(generation_id) REFERENCES live_class_generations (id), 
	CONSTRAINT fk_pop_quiz_questions_topic_id_class_plan_topics FOREIGN KEY(topic_id) REFERENCES class_plan_topics (id)
);
INSERT INTO "pop_quiz_questions" VALUES('4454a0d915b04860927711654d176cd5','10e84832bd4c48cd824f97bbd7b571c9','bb9e27fe3bb847fc9d2dfb9f200dc60e','Which statement best describes Newton First Law?','[{"option_id": "a", "text": "It is unrelated to the chapter", "is_correct": false, "feedback_explanation": "Not quite \u2014 this topic is central to the chapter we are studying."}, {"option_id": "b", "text": "It is a foundational concept for this topic", "is_correct": true, "feedback_explanation": "Correct! This is a foundational idea that other concepts build upon."}, {"option_id": "c", "text": "It only applies in special cases", "is_correct": false, "feedback_explanation": "This concept applies broadly, not just in edge cases."}, {"option_id": "d", "text": "It contradicts the base material", "is_correct": false, "feedback_explanation": "The correct understanding aligns with what we taught in class."}]',1,'2026-08-05 18:41:12','2026-08-05 18:41:12',1);
INSERT INTO "pop_quiz_questions" VALUES('89a43513dfc64cb9b526d10a94f84c32','e97b0679287a4f648e82ff96f2686551','bb9e27fe3bb847fc9d2dfb9f200dc60e','Which statement best describes Newton First Law?','[{"option_id": "a", "text": "It is unrelated to the chapter", "is_correct": false, "feedback_explanation": "Not quite \u2014 this topic is central to the chapter we are studying."}, {"option_id": "b", "text": "It is a foundational concept for this topic", "is_correct": true, "feedback_explanation": "Correct! This is a foundational idea that other concepts build upon."}, {"option_id": "c", "text": "It only applies in special cases", "is_correct": false, "feedback_explanation": "This concept applies broadly, not just in edge cases."}, {"option_id": "d", "text": "It contradicts the base material", "is_correct": false, "feedback_explanation": "The correct understanding aligns with what we taught in class."}]',1,'2026-08-05 18:47:23','2026-08-05 18:47:23',1);
INSERT INTO "pop_quiz_questions" VALUES('151526529f584b4185b06bad53a1c1d6','dd5b7a4f8adb4bb1a3ff9d2f0f58e30c','bb9e27fe3bb847fc9d2dfb9f200dc60e','Which statement best describes Newton First Law?','[{"option_id": "a", "text": "It is unrelated to the chapter", "is_correct": false, "feedback_explanation": "Not quite \u2014 this topic is central to the chapter we are studying."}, {"option_id": "b", "text": "It is a foundational concept for this topic", "is_correct": true, "feedback_explanation": "Correct! This is a foundational idea that other concepts build upon."}, {"option_id": "c", "text": "It only applies in special cases", "is_correct": false, "feedback_explanation": "This concept applies broadly, not just in edge cases."}, {"option_id": "d", "text": "It contradicts the base material", "is_correct": false, "feedback_explanation": "The correct understanding aligns with what we taught in class."}]',1,'2026-08-05 18:47:27','2026-08-05 18:47:27',1);
INSERT INTO "pop_quiz_questions" VALUES('aa2193e1ce8a41ccb7e9ac84ba4932d8','611311a2612c4c94b6c91b9a08d54ad1','bb9e27fe3bb847fc9d2dfb9f200dc60e','Which statement best describes Newton First Law?','[{"option_id": "a", "text": "It is unrelated to the chapter", "is_correct": false, "feedback_explanation": "Not quite \u2014 this topic is central to the chapter we are studying."}, {"option_id": "b", "text": "It is a foundational concept for this topic", "is_correct": true, "feedback_explanation": "Correct! This is a foundational idea that other concepts build upon."}, {"option_id": "c", "text": "It only applies in special cases", "is_correct": false, "feedback_explanation": "This concept applies broadly, not just in edge cases."}, {"option_id": "d", "text": "It contradicts the base material", "is_correct": false, "feedback_explanation": "The correct understanding aligns with what we taught in class."}]',1,'2026-08-05 18:56:18','2026-08-05 18:56:18',1);
INSERT INTO "pop_quiz_questions" VALUES('cab06781d5f84857a6225348d0958544','1fe547983ac2460d8acbc75ed486545c','bb9e27fe3bb847fc9d2dfb9f200dc60e','Which statement best describes Newton First Law?','[{"option_id": "a", "text": "It is unrelated to the chapter", "is_correct": false, "feedback_explanation": "Not quite \u2014 this topic is central to the chapter we are studying."}, {"option_id": "b", "text": "It is a foundational concept for this topic", "is_correct": true, "feedback_explanation": "Correct! This is a foundational idea that other concepts build upon."}, {"option_id": "c", "text": "It only applies in special cases", "is_correct": false, "feedback_explanation": "This concept applies broadly, not just in edge cases."}, {"option_id": "d", "text": "It contradicts the base material", "is_correct": false, "feedback_explanation": "The correct understanding aligns with what we taught in class."}]',1,'2026-08-05 18:56:18','2026-08-05 18:56:18',1);
INSERT INTO "pop_quiz_questions" VALUES('a156b068642849069eb31422a1cbb4a2','637bf29d1ca543fb8585b3860d829388','bb9e27fe3bb847fc9d2dfb9f200dc60e','Which statement best describes Newton First Law?','[{"option_id": "a", "text": "It is unrelated to the chapter", "is_correct": false, "feedback_explanation": "Not quite \u2014 this topic is central to the chapter we are studying."}, {"option_id": "b", "text": "It is a foundational concept for this topic", "is_correct": true, "feedback_explanation": "Correct! This is a foundational idea that other concepts build upon."}, {"option_id": "c", "text": "It only applies in special cases", "is_correct": false, "feedback_explanation": "This concept applies broadly, not just in edge cases."}, {"option_id": "d", "text": "It contradicts the base material", "is_correct": false, "feedback_explanation": "The correct understanding aligns with what we taught in class."}]',1,'2026-08-05 18:56:19','2026-08-05 18:56:19',1);
INSERT INTO "pop_quiz_questions" VALUES('d75c4facdd0744a19f30babdf6736d2d','caa6e5be8d1c48eea22bf6aacd711724','bb9e27fe3bb847fc9d2dfb9f200dc60e','Which statement best describes Newton First Law?','[{"option_id": "a", "text": "It is unrelated to the chapter", "is_correct": false, "feedback_explanation": "Not quite \u2014 this topic is central to the chapter we are studying."}, {"option_id": "b", "text": "It is a foundational concept for this topic", "is_correct": true, "feedback_explanation": "Correct! This is a foundational idea that other concepts build upon."}, {"option_id": "c", "text": "It only applies in special cases", "is_correct": false, "feedback_explanation": "This concept applies broadly, not just in edge cases."}, {"option_id": "d", "text": "It contradicts the base material", "is_correct": false, "feedback_explanation": "The correct understanding aligns with what we taught in class."}]',1,'2026-08-05 18:59:47','2026-08-05 18:59:47',1);
INSERT INTO "pop_quiz_questions" VALUES('0e3632cbde7249879e0d99d39d2346f3','2d7512db8d654ad595731ee3525de8d8','cfcd29bf325a40a49d602299816bf727','Which statement best describes Introduction to Motion?','[{"option_id": "a", "text": "It is unrelated to the chapter", "is_correct": false, "feedback_explanation": "Not quite \u2014 this topic is central to the chapter we are studying."}, {"option_id": "b", "text": "It is a foundational concept for this topic", "is_correct": true, "feedback_explanation": "Correct! This is a foundational idea that other concepts build upon."}, {"option_id": "c", "text": "It only applies in special cases", "is_correct": false, "feedback_explanation": "This concept applies broadly, not just in edge cases."}, {"option_id": "d", "text": "It contradicts the base material", "is_correct": false, "feedback_explanation": "The correct understanding aligns with what we taught in class."}]',1,'2026-08-05 19:47:31','2026-08-05 19:47:31',1);
INSERT INTO "pop_quiz_questions" VALUES('200d3ec935ca40169185b9e9f7aabece','2d7512db8d654ad595731ee3525de8d8','74f982daf4cb4ebf8b664ad862cea8a3','Which statement best describes Force?','[{"option_id": "a", "text": "It is unrelated to the chapter", "is_correct": false, "feedback_explanation": "Not quite \u2014 this topic is central to the chapter we are studying."}, {"option_id": "b", "text": "It is a foundational concept for this topic", "is_correct": true, "feedback_explanation": "Correct! This is a foundational idea that other concepts build upon."}, {"option_id": "c", "text": "It only applies in special cases", "is_correct": false, "feedback_explanation": "This concept applies broadly, not just in edge cases."}, {"option_id": "d", "text": "It contradicts the base material", "is_correct": false, "feedback_explanation": "The correct understanding aligns with what we taught in class."}]',1,'2026-08-05 19:47:31','2026-08-05 19:47:31',1);
INSERT INTO "pop_quiz_questions" VALUES('5d22c231f3da471ea7f5625ea24dbcc2','c549534b3cac4e218a77216ebd680157','9c67502e78054d5081e0c0eb998362fe','Which of the following statements about force is incorrect?','[{"option_id": "Q1O1", "text": "Force is a vector quantity.", "is_correct": false, "feedback_explanation": "This statement is correct. Force has both magnitude and direction."}, {"option_id": "Q1O2", "text": "The SI unit of force is the Newton (N).", "is_correct": false, "feedback_explanation": "This statement is correct. Newton is the SI unit for force."}, {"option_id": "Q1O3", "text": "A force can exist without an interaction between two objects.", "is_correct": true, "feedback_explanation": "This statement is incorrect. Force always arises due to the interaction between two objects. An object cannot experience a force unless another object exerts it."}, {"option_id": "Q1O4", "text": "Force can change the shape of an object.", "is_correct": false, "feedback_explanation": "This statement is correct. Force can deform an object, changing its shape or size."}]',1,'2026-08-05 20:21:47','2026-08-05 20:21:47',1);
INSERT INTO "pop_quiz_questions" VALUES('5f743816feed4aa48da54ee635a67d57','c549534b3cac4e218a77216ebd680157','9c67502e78054d5081e0c0eb998362fe','An object is subjected to two forces: 15 N acting to the East and 7 N acting to the West. What is the net force on the object?','[{"option_id": "Q2O1", "text": "22 N to the East", "is_correct": false, "feedback_explanation": "Incorrect. Forces in opposite directions subtract, not add."}, {"option_id": "Q2O2", "text": "8 N to the West", "is_correct": false, "feedback_explanation": "Incorrect. The net force is the difference, and it acts in the direction of the larger force (East)."}, {"option_id": "Q2O3", "text": "8 N to the East", "is_correct": true, "feedback_explanation": "Correct! When forces act in opposite directions, you subtract their magnitudes. 15 N - 7 N = 8 N. The net force is in the direction of the larger force, which is East."}, {"option_id": "Q2O4", "text": "22 N to the West", "is_correct": false, "feedback_explanation": "Incorrect. The forces are in opposite directions, and the net force acts East."}]',2,'2026-08-05 20:21:47','2026-08-05 20:21:47',1);
CREATE TABLE slide_explanations (
	id UUID NOT NULL, 
	generation_id UUID NOT NULL, 
	slide_id UUID NOT NULL, 
	"order" INTEGER NOT NULL, 
	duration_seconds INTEGER NOT NULL, 
	explanation_text TEXT NOT NULL, 
	created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL, 
	updated_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL, 
	is_active BOOLEAN DEFAULT TRUE, 
	CONSTRAINT pk_slide_explanations PRIMARY KEY (id), 
	CONSTRAINT fk_slide_explanations_generation_id_live_class_generations FOREIGN KEY(generation_id) REFERENCES live_class_generations (id), 
	CONSTRAINT uq_slide_explanations_slide_id UNIQUE (slide_id), 
	CONSTRAINT fk_slide_explanations_slide_id_live_class_slides FOREIGN KEY(slide_id) REFERENCES live_class_slides (id)
);
INSERT INTO "slide_explanations" VALUES('59d457f2cdb94a8698297f88eddb2800','10e84832bd4c48cd824f97bbd7b571c9','2bf0473993d346b2b16cbaa58d999e76',1,40,'Let''s explore Newton First Law. This is a key concept for JEE Main.','2026-08-05 18:41:12','2026-08-05 18:41:12',1);
INSERT INTO "slide_explanations" VALUES('b2b779989a604ea28fe45c537124e1eb','10e84832bd4c48cd824f97bbd7b571c9','f99cf18c077f46c7b119116d21a47485',2,35,'Here are examples that make this concept easy to remember during exams.','2026-08-05 18:41:12','2026-08-05 18:41:12',1);
INSERT INTO "slide_explanations" VALUES('2873585532fb4911b429976601b5eeba','e97b0679287a4f648e82ff96f2686551','f1338bef631e47ddbfbff4282a00342e',1,40,'Let''s explore Newton First Law. This is a key concept for JEE Main.','2026-08-05 18:47:23','2026-08-05 18:47:23',1);
INSERT INTO "slide_explanations" VALUES('f16085d4896d4727a9a7d2bbed6db516','e97b0679287a4f648e82ff96f2686551','eeb7dde7828c4d51ab6f05567c11dbda',2,35,'Here are examples that make this concept easy to remember during exams.','2026-08-05 18:47:23','2026-08-05 18:47:23',1);
INSERT INTO "slide_explanations" VALUES('c0ef24251ac64fdab18a381bced92fbc','dd5b7a4f8adb4bb1a3ff9d2f0f58e30c','7fdb1f26112b4049b465097c61c3398b',1,40,'Let''s explore Newton First Law. This is a key concept for JEE Main.','2026-08-05 18:47:27','2026-08-05 18:47:27',1);
INSERT INTO "slide_explanations" VALUES('3fbf6e6bcdcf425cbce3d42d1472f0ef','dd5b7a4f8adb4bb1a3ff9d2f0f58e30c','84777caf618946ae9e5de1b342b72ed8',2,35,'Here are examples that make this concept easy to remember during exams.','2026-08-05 18:47:27','2026-08-05 18:47:27',1);
INSERT INTO "slide_explanations" VALUES('40701bc706474b8cb42b3e904692126e','611311a2612c4c94b6c91b9a08d54ad1','211b8cdcf5ec40a5a0bac64fa9e890b0',1,40,'Let''s explore Newton First Law. This is a key concept for JEE Main.','2026-08-05 18:56:18','2026-08-05 18:56:18',1);
INSERT INTO "slide_explanations" VALUES('b3c9f520a7744e2792b753e63dc5a4d6','611311a2612c4c94b6c91b9a08d54ad1','9fdb0989106e4bd59fee0ef48a39b721',2,35,'Here are examples that make this concept easy to remember during exams.','2026-08-05 18:56:18','2026-08-05 18:56:18',1);
INSERT INTO "slide_explanations" VALUES('7ee4c01fe0c4474099514ea14d9f63bc','1fe547983ac2460d8acbc75ed486545c','2942da10fdc345d28cb6ddd39e521285',1,40,'Let''s explore Newton First Law. This is a key concept for JEE Main.','2026-08-05 18:56:18','2026-08-05 18:56:18',1);
INSERT INTO "slide_explanations" VALUES('69766aaa60924ddb9bbf3924c068ab1c','1fe547983ac2460d8acbc75ed486545c','2af41d3289964e509fbc076c901f380f',2,35,'Here are examples that make this concept easy to remember during exams.','2026-08-05 18:56:18','2026-08-05 18:56:18',1);
INSERT INTO "slide_explanations" VALUES('c083caf9beae40b89a1e8546adcabd37','637bf29d1ca543fb8585b3860d829388','cce7479b42b64bf2b766fd60238aac9c',1,40,'Let''s explore Newton First Law. This is a key concept for JEE Main.','2026-08-05 18:56:19','2026-08-05 18:56:19',1);
INSERT INTO "slide_explanations" VALUES('28675b4a19004341b18209b216029306','637bf29d1ca543fb8585b3860d829388','c9d292fb013146b282711afae20862ec',2,35,'Here are examples that make this concept easy to remember during exams.','2026-08-05 18:56:19','2026-08-05 18:56:19',1);
INSERT INTO "slide_explanations" VALUES('8c392d245aa543a5aaefe1ce63b25703','caa6e5be8d1c48eea22bf6aacd711724','071d92b6f24d49e3bd26adb344f681f3',1,40,'Let''s explore Newton First Law. This is a key concept for JEE Main.','2026-08-05 18:59:47','2026-08-05 18:59:47',1);
INSERT INTO "slide_explanations" VALUES('80bd07a623a64a1f9dd186063b049180','caa6e5be8d1c48eea22bf6aacd711724','208119a0e9fc48df9bda841be2e0d887',2,35,'Here are examples that make this concept easy to remember during exams.','2026-08-05 18:59:47','2026-08-05 18:59:47',1);
INSERT INTO "slide_explanations" VALUES('df19ab97e6404db6a9664cdcbdcb01e3','2d7512db8d654ad595731ee3525de8d8','389f7a1a9a2b42cf958f587effdf53a9',1,40,'Let''s explore Introduction to Motion. This is a key concept for JEE Main.','2026-08-05 19:47:31','2026-08-05 19:47:31',1);
INSERT INTO "slide_explanations" VALUES('c8228587e8534bcbb8fd3734347d1a0a','2d7512db8d654ad595731ee3525de8d8','08f62120f8e341fea08e9801cfbbd7a1',2,35,'Here are examples that make this concept easy to remember during exams.','2026-08-05 19:47:31','2026-08-05 19:47:31',1);
INSERT INTO "slide_explanations" VALUES('e4e78fc47bdd4b2e99a1962b5ea388b2','2d7512db8d654ad595731ee3525de8d8','23c148268ce940229d75c690f5152c02',1,40,'Let''s explore Force. This is a key concept for JEE Main.','2026-08-05 19:47:31','2026-08-05 19:47:31',1);
INSERT INTO "slide_explanations" VALUES('4ca1647fb78641f794c20b1d3f338c6a','2d7512db8d654ad595731ee3525de8d8','da44b48092cc4f9294b5b4f94992d4ff',2,35,'Here are examples that make this concept easy to remember during exams.','2026-08-05 19:47:31','2026-08-05 19:47:31',1);
INSERT INTO "slide_explanations" VALUES('a9871a4e4ba246779fb12c626a7e17f2','c549534b3cac4e218a77216ebd680157','f9ea54e401cd4217832c3aac7845a8f8',1,60,'Hello everyone! To start, let''s do a quick activity. Push a chair, then pull it. What do you feel you are doing? You are applying a ''force''. Every day, we encounter forces when we push a door, pull a drawer, kick a ball, or lift a bag. In all these scenarios, there''s an interaction between two objects. This interaction is precisely what we call force. It''s a fundamental concept in physics because it helps us understand why things start moving, stop, change direction, or even change their shape.','2026-08-05 20:21:47','2026-08-05 20:21:47',1);
INSERT INTO "slide_explanations" VALUES('e8374ed236094923956b065899bb5e61','c549534b3cac4e218a77216ebd680157','c640b43035984eeea2fc8ceeeacef625',2,60,'Let''s formally define it. Force is an external push or pull that acts on an object. Its effect is either to change, or attempt to change, the object''s state of rest, state of motion, or its physical shape. Importantly, a force never exists in isolation. It always requires an interaction between two objects. One object exerts the force, and the other experiences it. For example, when you push a wall, even if the wall doesn''t move, you are exerting a force, and the wall is exerting an equal and opposite force back on you.','2026-08-05 20:21:47','2026-08-05 20:21:47',1);
INSERT INTO "slide_explanations" VALUES('52c0e0995ba5482db10a43cb41eceef5','c549534b3cac4e218a77216ebd680157','d3e91c44bd1d440385df101731b2ad01',3,75,'The standard symbol for force is ''F''. Now, regarding its nature, force is a vector quantity. This means that to fully describe a force, you need two pieces of information: its magnitude, which tells us ''how much'' force is applied, and its direction, which tells us ''in what way'' it''s applied. Imagine applying a force of 20 Newtons. If you apply it towards the East, the effect is entirely different than if you apply it towards the West, even though the magnitude is the same. Therefore, both magnitude and direction are crucial.','2026-08-05 20:21:47','2026-08-05 20:21:47',1);
INSERT INTO "slide_explanations" VALUES('e9f0291e989f42bcaace1f20ab94a6e9','c549534b3cac4e218a77216ebd680157','c42fef65b62946eaaa1c0ac4abc0cc4e',4,75,'The international standard unit for force is the Newton, abbreviated as ''N''. It''s named after Sir Isaac Newton, whose laws govern motion and force. One Newton is precisely defined as the amount of force needed to accelerate a 1-kilogram mass at a rate of 1 meter per second squared. This definition mathematically links force to mass and acceleration, which we''ll explore more when we discuss Newton''s Second Law later on. For now, remember this fundamental definition and its units.','2026-08-05 20:21:47','2026-08-05 20:21:47',1);
INSERT INTO "slide_explanations" VALUES('ede0ff510e24467f85aecf3ec2e70e8d','c549534b3cac4e218a77216ebd680157','b4732c1125d340539f424722c3a845c9',5,90,'Force is a powerful agent of change. Firstly, it can initiate motion, like when you kick a football from rest. Secondly, it can alter existing motion, either stopping a moving object, like applying bicycle brakes, or changing its speed, such as pressing the accelerator to speed up or brakes to slow down. Thirdly, force can change the direction of an object, like a cricket bat redirecting a ball. Finally, a force can even deform an object, altering its shape or size, for instance, when you compress a spring or stretch a rubber band. These are the primary effects of force.','2026-08-05 20:21:47','2026-08-05 20:21:47',1);
INSERT INTO "slide_explanations" VALUES('3ca590cf57f64434a86eef4702e3b5dc','c549534b3cac4e218a77216ebd680157','59dfa68d72a94ebcaf2f099e2a4159f9',6,60,'Let''s reiterate a crucial point: force is always an interaction. It''s not something an object ''has'' inherently; it''s what happens between two or more objects. Whether it''s your hand pushing a box, a magnet attracting a nail, the Earth pulling you downwards, or a rope pulling a bucket, there are always at least two entities involved in the force interaction. This is a fundamental principle in understanding forces.','2026-08-05 20:21:47','2026-08-05 20:21:47',1);
INSERT INTO "slide_explanations" VALUES('25e0c807d9bf4b71a622deee8fc7e73f','c549534b3cac4e218a77216ebd680157','2388e10e2c0a4a25b6832f6822963761',7,90,'Forces can be categorized into two main types. The first are ''Contact Forces'', which, as the name suggests, require direct physical contact between objects. Examples include muscular force, like when you lift a bag. Frictional force is crucial for daily activities, opposing motion between surfaces; without it, walking would be impossible. The normal force is the support a surface provides to an object on it, always perpendicular to the surface. Tension is the force in a taut rope or cable, like pulling a bucket from a well. And finally, spring force is the restorative force from a deformed spring.','2026-08-05 20:21:47','2026-08-05 20:21:47',1);
INSERT INTO "slide_explanations" VALUES('8fb885e5030e437ca2b4727c04e5f185','c549534b3cac4e218a77216ebd680157','5235a2762e9a41bbba9d8e323017ad2b',8,90,'The second category is ''Non-Contact Forces'', which act over a distance without direct physical touch. The most familiar is gravitational force, the attractive force between any two objects with mass, like the Earth pulling an apple down. Magnetic force is what you see when a magnet attracts iron pins from a distance. And electrostatic force occurs between charged objects; for instance, a rubbed balloon can pick up small pieces of paper without touching them. These forces demonstrate that interaction can happen even without physical contact.','2026-08-05 20:21:47','2026-08-05 20:21:47',1);
INSERT INTO "slide_explanations" VALUES('86275e4a047c4836a5f91d01b76dad78','c549534b3cac4e218a77216ebd680157','770d2a71fb6648caae182e4691ced71e',9,90,'Often, an object experiences multiple forces simultaneously. The ''net force'' or ''resultant force'' is the single equivalent force that represents the combined effect of all these individual forces. Since force is a vector, we perform a vector sum. If forces act in the same direction, they add up. For example, if you push a box with 10 N and a friend pushes it with 5 N in the same direction, the net force is 15 N. If forces act in opposite directions, you subtract them. For instance, if you push with 12 N to the right and someone pushes with 8 N to the left, the net force is 4 N to the right. It''s crucial to draw free-body diagrams to visualize these forces accurately.','2026-08-05 20:21:47','2026-08-05 20:21:47',1);
INSERT INTO "slide_explanations" VALUES('480ae20377fa48ff8466c773d38c7091','c549534b3cac4e218a77216ebd680157','79c9837aa2574a768ba1a0daa554675b',10,90,'Understanding net force leads us to balanced and unbalanced forces. When the net force on an object is zero, the forces are ''balanced''. Balanced forces do not cause any change in the object''s state of motion; an object at rest stays at rest, and an object moving continues to move at a constant velocity. Think of a book resting on a table – gravity pulls it down, but the table pushes it up with an equal and opposite normal force, resulting in zero net force. Conversely, ''unbalanced forces'' occur when the net force is not zero. These forces *always* produce an acceleration, meaning they change the object''s speed or direction. Kicking a football, a car accelerating, or a cyclist applying brakes are all examples of unbalanced forces causing a change in motion.','2026-08-05 20:21:47','2026-08-05 20:21:47',1);
CREATE TABLE topic_workflows (
	id UUID NOT NULL, 
	generation_id UUID NOT NULL, 
	topic_id UUID NOT NULL, 
	teaching_approach VARCHAR(18) NOT NULL, 
	approach_rationale TEXT NOT NULL, 
	workflow_definition JSON NOT NULL, 
	created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL, 
	updated_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL, 
	is_active BOOLEAN DEFAULT TRUE, 
	CONSTRAINT pk_topic_workflows PRIMARY KEY (id), 
	CONSTRAINT uq_topic_workflows_generation_topic UNIQUE (generation_id, topic_id), 
	CONSTRAINT fk_topic_workflows_generation_id_live_class_generations FOREIGN KEY(generation_id) REFERENCES live_class_generations (id), 
	CONSTRAINT fk_topic_workflows_topic_id_class_plan_topics FOREIGN KEY(topic_id) REFERENCES class_plan_topics (id)
);
INSERT INTO "topic_workflows" VALUES('d7d22a2913b4446c9be0ebff0addc431','10e84832bd4c48cd824f97bbd7b571c9','bb9e27fe3bb847fc9d2dfb9f200dc60e','DIRECT_INSTRUCTION','Selected direct_instruction for Newton First Law based on content complexity.','{"states": [{"state_id": "explain", "phase": "teach", "state_type": "explain", "order": 1, "label": "Newton First Law", "slide_ids": ["2bf04739-93d3-46b2-b16c-baa58d999e76"], "advance_trigger": "auto"}, {"state_id": "examples", "phase": "teach", "state_type": "examples", "order": 2, "label": "Examples", "slide_ids": ["f99cf18c-077f-46c7-b119-116d21a47485"], "advance_trigger": "auto"}, {"state_id": "pop_quiz", "phase": "pop_quiz", "state_type": "pop_quiz", "order": 3, "label": "Pop Quiz", "quiz_question_ids": ["4454a0d9-15b0-4860-9277-11654d176cd5"], "advance_trigger": "all_questions_attempted"}, {"state_id": "doubts", "phase": "doubts_resolution", "state_type": "doubts_resolution", "order": 4, "label": "Have a doubt?", "advance_trigger": "doubt_session_closed_or_skipped"}]}','2026-08-05 18:41:12','2026-08-05 18:41:12',1);
INSERT INTO "topic_workflows" VALUES('1fca4e15777342b882afcf60f279aef6','e97b0679287a4f648e82ff96f2686551','bb9e27fe3bb847fc9d2dfb9f200dc60e','DIRECT_INSTRUCTION','Selected direct_instruction for Newton First Law based on content complexity.','{"states": [{"state_id": "explain", "phase": "teach", "state_type": "explain", "order": 1, "label": "Newton First Law", "slide_ids": ["f1338bef-631e-47dd-bfbf-f4282a00342e"], "advance_trigger": "auto"}, {"state_id": "examples", "phase": "teach", "state_type": "examples", "order": 2, "label": "Examples", "slide_ids": ["eeb7dde7-828c-4d51-ab6f-05567c11dbda"], "advance_trigger": "auto"}, {"state_id": "pop_quiz", "phase": "pop_quiz", "state_type": "pop_quiz", "order": 3, "label": "Pop Quiz", "quiz_question_ids": ["89a43513-dfc6-4cb9-b526-d10a94f84c32"], "advance_trigger": "all_questions_attempted"}, {"state_id": "doubts", "phase": "doubts_resolution", "state_type": "doubts_resolution", "order": 4, "label": "Have a doubt?", "advance_trigger": "doubt_session_closed_or_skipped"}]}','2026-08-05 18:47:23','2026-08-05 18:47:23',1);
INSERT INTO "topic_workflows" VALUES('724be42c42824c82908f78344ecad496','dd5b7a4f8adb4bb1a3ff9d2f0f58e30c','bb9e27fe3bb847fc9d2dfb9f200dc60e','DIRECT_INSTRUCTION','Selected direct_instruction for Newton First Law based on content complexity.','{"states": [{"state_id": "explain", "phase": "teach", "state_type": "explain", "order": 1, "label": "Newton First Law", "slide_ids": ["7fdb1f26-112b-4049-b465-097c61c3398b"], "advance_trigger": "auto"}, {"state_id": "examples", "phase": "teach", "state_type": "examples", "order": 2, "label": "Examples", "slide_ids": ["84777caf-6189-46ae-9e5d-e1b342b72ed8"], "advance_trigger": "auto"}, {"state_id": "pop_quiz", "phase": "pop_quiz", "state_type": "pop_quiz", "order": 3, "label": "Pop Quiz", "quiz_question_ids": ["15152652-9f58-4b41-85b0-6bad53a1c1d6"], "advance_trigger": "all_questions_attempted"}, {"state_id": "doubts", "phase": "doubts_resolution", "state_type": "doubts_resolution", "order": 4, "label": "Have a doubt?", "advance_trigger": "doubt_session_closed_or_skipped"}]}','2026-08-05 18:47:27','2026-08-05 18:47:27',1);
INSERT INTO "topic_workflows" VALUES('696469f2aca24933b6c5330572208cd8','611311a2612c4c94b6c91b9a08d54ad1','bb9e27fe3bb847fc9d2dfb9f200dc60e','DIRECT_INSTRUCTION','Selected direct_instruction for Newton First Law based on content complexity.','{"states": [{"state_id": "explain", "phase": "teach", "state_type": "explain", "order": 1, "label": "Newton First Law", "slide_ids": ["211b8cdc-f5ec-40a5-a0ba-c64fa9e890b0"], "advance_trigger": "auto"}, {"state_id": "examples", "phase": "teach", "state_type": "examples", "order": 2, "label": "Examples", "slide_ids": ["9fdb0989-106e-4bd5-9fee-0ef48a39b721"], "advance_trigger": "auto"}, {"state_id": "pop_quiz", "phase": "pop_quiz", "state_type": "pop_quiz", "order": 3, "label": "Pop Quiz", "quiz_question_ids": ["aa2193e1-ce8a-41cc-b7e9-ac84ba4932d8"], "advance_trigger": "all_questions_attempted"}, {"state_id": "doubts", "phase": "doubts_resolution", "state_type": "doubts_resolution", "order": 4, "label": "Have a doubt?", "advance_trigger": "doubt_session_closed_or_skipped"}]}','2026-08-05 18:56:18','2026-08-05 18:56:18',1);
INSERT INTO "topic_workflows" VALUES('4fbaa133ec2441a68f2e51cb9359ce25','1fe547983ac2460d8acbc75ed486545c','bb9e27fe3bb847fc9d2dfb9f200dc60e','DIRECT_INSTRUCTION','Selected direct_instruction for Newton First Law based on content complexity.','{"states": [{"state_id": "explain", "phase": "teach", "state_type": "explain", "order": 1, "label": "Newton First Law", "slide_ids": ["2942da10-fdc3-45d2-8cb6-ddd39e521285"], "advance_trigger": "auto"}, {"state_id": "examples", "phase": "teach", "state_type": "examples", "order": 2, "label": "Examples", "slide_ids": ["2af41d32-8996-4e50-9fbc-076c901f380f"], "advance_trigger": "auto"}, {"state_id": "pop_quiz", "phase": "pop_quiz", "state_type": "pop_quiz", "order": 3, "label": "Pop Quiz", "quiz_question_ids": ["cab06781-d5f8-4857-a622-5348d0958544"], "advance_trigger": "all_questions_attempted"}, {"state_id": "doubts", "phase": "doubts_resolution", "state_type": "doubts_resolution", "order": 4, "label": "Have a doubt?", "advance_trigger": "doubt_session_closed_or_skipped"}]}','2026-08-05 18:56:18','2026-08-05 18:56:18',1);
INSERT INTO "topic_workflows" VALUES('51ac9213f19e4ee493986325140a8113','637bf29d1ca543fb8585b3860d829388','bb9e27fe3bb847fc9d2dfb9f200dc60e','DIRECT_INSTRUCTION','Selected direct_instruction for Newton First Law based on content complexity.','{"states": [{"state_id": "explain", "phase": "teach", "state_type": "explain", "order": 1, "label": "Newton First Law", "slide_ids": ["cce7479b-42b6-4bf2-b766-fd60238aac9c"], "advance_trigger": "auto"}, {"state_id": "examples", "phase": "teach", "state_type": "examples", "order": 2, "label": "Examples", "slide_ids": ["c9d292fb-0131-46b2-8271-1afae20862ec"], "advance_trigger": "auto"}, {"state_id": "pop_quiz", "phase": "pop_quiz", "state_type": "pop_quiz", "order": 3, "label": "Pop Quiz", "quiz_question_ids": ["a156b068-6428-4906-9eb3-1422a1cbb4a2"], "advance_trigger": "all_questions_attempted"}, {"state_id": "doubts", "phase": "doubts_resolution", "state_type": "doubts_resolution", "order": 4, "label": "Have a doubt?", "advance_trigger": "doubt_session_closed_or_skipped"}]}','2026-08-05 18:56:19','2026-08-05 18:56:19',1);
INSERT INTO "topic_workflows" VALUES('07ba7263405e401eaea91c6db8ae92a1','caa6e5be8d1c48eea22bf6aacd711724','bb9e27fe3bb847fc9d2dfb9f200dc60e','DIRECT_INSTRUCTION','Selected direct_instruction for Newton First Law based on content complexity.','{"states": [{"state_id": "explain", "phase": "teach", "state_type": "explain", "order": 1, "label": "Newton First Law", "slide_ids": ["071d92b6-f24d-49e3-bd26-adb344f681f3"], "advance_trigger": "auto"}, {"state_id": "examples", "phase": "teach", "state_type": "examples", "order": 2, "label": "Examples", "slide_ids": ["208119a0-e9fc-48df-9bda-841be2e0d887"], "advance_trigger": "auto"}, {"state_id": "pop_quiz", "phase": "pop_quiz", "state_type": "pop_quiz", "order": 3, "label": "Pop Quiz", "quiz_question_ids": ["d75c4fac-dd07-44a1-9f30-babdf6736d2d"], "advance_trigger": "all_questions_attempted"}, {"state_id": "doubts", "phase": "doubts_resolution", "state_type": "doubts_resolution", "order": 4, "label": "Have a doubt?", "advance_trigger": "doubt_session_closed_or_skipped"}]}','2026-08-05 18:59:47','2026-08-05 18:59:47',1);
INSERT INTO "topic_workflows" VALUES('bf5540f4471f473cbc559e6dd401d589','2d7512db8d654ad595731ee3525de8d8','cfcd29bf325a40a49d602299816bf727','DIRECT_INSTRUCTION','Selected direct_instruction for Introduction to Motion based on content complexity.','{"states": [{"state_id": "explain", "phase": "teach", "state_type": "explain", "order": 1, "label": "Introduction to Motion", "slide_ids": ["389f7a1a-9a2b-42cf-958f-587effdf53a9"], "advance_trigger": "auto"}, {"state_id": "examples", "phase": "teach", "state_type": "examples", "order": 2, "label": "Examples", "slide_ids": ["08f62120-f8e3-41fe-a08e-9801cfbbd7a1"], "advance_trigger": "auto"}, {"state_id": "pop_quiz", "phase": "pop_quiz", "state_type": "pop_quiz", "order": 3, "label": "Pop Quiz", "quiz_question_ids": ["0e3632cb-de72-4987-9e0d-99d39d2346f3"], "advance_trigger": "all_questions_attempted"}, {"state_id": "doubts", "phase": "doubts_resolution", "state_type": "doubts_resolution", "order": 4, "label": "Have a doubt?", "advance_trigger": "doubt_session_closed_or_skipped"}]}','2026-08-05 19:47:31','2026-08-05 19:47:31',1);
INSERT INTO "topic_workflows" VALUES('456844ccc63f47adbca85046d21d2765','2d7512db8d654ad595731ee3525de8d8','74f982daf4cb4ebf8b664ad862cea8a3','DIRECT_INSTRUCTION','Selected direct_instruction for Force based on content complexity.','{"states": [{"state_id": "explain", "phase": "teach", "state_type": "explain", "order": 1, "label": "Force", "slide_ids": ["23c14826-8ce9-4022-9d75-c690f5152c02"], "advance_trigger": "auto"}, {"state_id": "examples", "phase": "teach", "state_type": "examples", "order": 2, "label": "Examples", "slide_ids": ["da44b480-92cc-4f92-94b5-b4f94992d4ff"], "advance_trigger": "auto"}, {"state_id": "pop_quiz", "phase": "pop_quiz", "state_type": "pop_quiz", "order": 3, "label": "Pop Quiz", "quiz_question_ids": ["200d3ec9-35ca-4016-9185-b9e9f7aabece"], "advance_trigger": "all_questions_attempted"}, {"state_id": "doubts", "phase": "doubts_resolution", "state_type": "doubts_resolution", "order": 4, "label": "Have a doubt?", "advance_trigger": "doubt_session_closed_or_skipped"}]}','2026-08-05 19:47:31','2026-08-05 19:47:31',1);
INSERT INTO "topic_workflows" VALUES('f4d3f0baffbf41209d09f1935554e504','c549534b3cac4e218a77216ebd680157','9c67502e78054d5081e0c0eb998362fe','DIRECT_INSTRUCTION','Direct instruction is chosen for its efficiency in conveying fundamental concepts and definitions in physics, such as force. This approach ensures all students receive clear, structured information, which is crucial for building a strong foundation. It allows for a systematic presentation of definitions, characteristics, types, and mathematical representations of force, followed by immediate application through examples and a quiz to reinforce learning.','{"states": [{"state_id": "WF001", "phase": "teach", "state_type": "introduction", "order": 1, "label": "Introduction to Force", "advance_trigger": "user_next", "slide_ids": ["f9ea54e4-01cd-4217-832c-3aac7845a8f8", "c640b430-3598-4eee-a2fc-8ceeeacef625"], "requires_student_input": false}, {"state_id": "WF002", "phase": "teach", "state_type": "concept_explanation", "order": 2, "label": "Definition, Nature & Unit of Force", "advance_trigger": "user_next", "slide_ids": ["d3e91c44-bd1d-4403-85df-101731b2ad01", "c42fef65-b629-46ea-aa1c-0ac4abc0cc4e"], "requires_student_input": false}, {"state_id": "WF003", "phase": "teach", "state_type": "concept_explanation", "order": 3, "label": "Characteristics and Effects of Force", "advance_trigger": "user_next", "slide_ids": ["b4732c11-25d3-4053-9f42-4722c3a845c9", "59dfa68d-72a9-4ebc-af2f-099e2a4159f9"], "requires_student_input": false}, {"state_id": "WF004", "phase": "teach", "state_type": "concept_explanation", "order": 4, "label": "Types of Force: Contact Forces", "advance_trigger": "user_next", "slide_ids": ["2388e10e-2c0a-4a25-b683-2f6822963761"], "requires_student_input": false}, {"state_id": "WF005", "phase": "teach", "state_type": "concept_explanation", "order": 5, "label": "Types of Force: Non-Contact Forces", "advance_trigger": "user_next", "slide_ids": ["5235a276-2e9a-41bb-ba9d-8e323017ad2b"], "requires_student_input": false}, {"state_id": "WF006", "phase": "teach", "state_type": "concept_explanation", "order": 6, "label": "Net Force, Balanced & Unbalanced Forces", "advance_trigger": "user_next", "slide_ids": ["770d2a71-fb66-48ca-ae18-2e4691ced71e", "79c9837a-a257-4a76-8ba1-a0daa554675b"], "requires_student_input": false}, {"state_id": "WF007", "phase": "pop_quiz", "state_type": "assessment", "order": 7, "label": "Check Your Understanding", "advance_trigger": "user_submit", "quiz_question_ids": ["5d22c231-f3da-471e-a7f5-625ea24dbcc2", "5f743816-feed-4aa4-8da5-4ee635a67d57"], "requires_student_input": true, "student_input_type": "multiple_choice"}, {"state_id": "WF008", "phase": "doubts_resolution", "state_type": "interactive", "order": 8, "label": "Doubt Clarification", "advance_trigger": "user_next", "requires_student_input": true, "student_input_type": "free_text"}]}','2026-08-05 20:21:47','2026-08-05 20:21:47',1);
COMMIT;

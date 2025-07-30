### **Curated Views**

## **(Generic)**

## **(Ubiquitous)**
* The system shall store view definitions in a views table.
* The system shall link views to premises via a view_premises junction table.
* The system shall use the display_order column in the view_premises table to determine the sequence of premises within a view.

## **(State driven)**
* While a user is browsing a curated view, the system shall display the list of associated premises in the sequence defined by display_order.

## **(Event driven)**
* When a user selects a curated view from a list, the system shall query the database and display the ordered list of premises for that view.
* When a user creates a new view, the system shall add a new entry to the views table.
* When a user adds a premise to a view, the system shall create a new entry in the view_premises table with the correct view_id, premise_id, and display_order.

## **(Optional feature)**

## **(Unwanted behaviour)**
* If a user tries to add the same premise to the same view twice, then the system shall prevent the duplicate entry (via the UNIQUE constraint or composite primary key).

## **(Complex)**
* While a user is viewing the "Intro to Derivatives" learning path, when they select it, the system shall execute a SQL query joining premises and view_premises to fetch the content in the order specified by the display_order column.
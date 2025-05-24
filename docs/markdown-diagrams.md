# Markdown Diagrams

This editor supports creating diagrams in your markdown using [Mermaid.js](https://mermaidjs.github.io/).

## How to Use

To create a diagram, use a code fence with the language set to "mermaid":

````
```mermaid
graph TD
    A[Start] --> B{Is it?}
    B -->|Yes| C[OK]
    C --> D[Rethink]
    D --> B
    B ---->|No| E[End]
```
````

## Diagram Types

### Sequence Diagrams

Sequence diagrams show how processes interact with each other and in what order.

````
```mermaid
sequenceDiagram
    participant Alice
    participant Bob
    Alice->>John: Hello John, how are you?
    loop Healthcheck
        John->>John: Fight against hypochondria
    end
    Note right of John: Rational thoughts <br/>prevail!
    John-->>Alice: Great!
    John->>Bob: How about you?
    Bob-->>John: Jolly good!
```
````

### Flowcharts

Flowcharts are diagrams that represent workflows or processes.

````
```mermaid
graph LR
    A[Square Rect] -- Link text --> B((Circle))
    A --> C(Round Rect)
    B --> D{Rhombus}
    C --> D
```
````

### Class Diagrams

Class diagrams show the structure of object-oriented systems.

````
```mermaid
classDiagram
    Animal <|-- Duck
    Animal <|-- Fish
    Animal <|-- Zebra
    Animal : +int age
    Animal : +String gender
    Animal: +isMammal()
    Animal: +mate()
    class Duck{
        +String beakColor
        +swim()
        +quack()
    }
    class Fish{
        -int sizeInFeet
        -canEat()
    }
    class Zebra{
        +bool is_wild
        +run()
    }
```
````

### State Diagrams

State diagrams show how an entity responds to various events.

````
```mermaid
stateDiagram-v2
    [*] --> Still
    Still --> [*]
    Still --> Moving
    Moving --> Still
    Moving --> Crash
    Crash --> [*]
```
````

## Notes

- Diagrams are rendered client-side only to avoid SSR issues
- Diagram theme automatically matches your current editor theme (light/dark)
- For complex diagrams, consider writing them in a dedicated editor and pasting into the markdown when complete
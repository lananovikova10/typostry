# Mermaid Diagrams

This document demonstrates various types of diagrams using Mermaid syntax.

## Flowchart

```mermaid
graph TD
    A[Start] --> B{Is it working?}
    B -->|Yes| C[Great!]
    B -->|No| D[Debug]
    D --> E[Fix bugs]
    E --> B
    C --> F[End]
```

## Sequence Diagram

```mermaid
sequenceDiagram
    participant User
    participant Browser
    participant Server
    participant Database

    User->>Browser: Enter URL
    Browser->>Server: HTTP Request
    Server->>Database: Query data
    Database-->>Server: Return results
    Server-->>Browser: HTTP Response
    Browser-->>User: Display page
```

## Class Diagram

```mermaid
classDiagram
    class Animal {
        +String name
        +int age
        +makeSound()
    }
    class Dog {
        +String breed
        +bark()
    }
    class Cat {
        +String color
        +meow()
    }

    Animal <|-- Dog
    Animal <|-- Cat
```

## State Diagram

```mermaid
stateDiagram-v2
    [*] --> Idle
    Idle --> Processing: Start
    Processing --> Success: Complete
    Processing --> Error: Fail
    Success --> [*]
    Error --> Idle: Retry
    Error --> [*]: Give up
```

## Entity Relationship Diagram

```mermaid
erDiagram
    CUSTOMER ||--o{ ORDER : places
    ORDER ||--|{ LINE-ITEM : contains
    CUSTOMER }|..|{ DELIVERY-ADDRESS : uses

    CUSTOMER {
        string name
        string email
        string phone
    }
    ORDER {
        int orderNumber
        date orderDate
        float total
    }
    LINE-ITEM {
        int quantity
        float price
    }
```

## Gantt Chart

```mermaid
gantt
    title Project Timeline
    dateFormat  YYYY-MM-DD
    section Planning
    Requirements       :a1, 2024-01-01, 7d
    Design            :a2, after a1, 10d
    section Development
    Backend           :b1, after a2, 20d
    Frontend          :b2, after a2, 25d
    section Testing
    Integration Tests :c1, after b1, 10d
    User Testing      :c2, after b2, 7d
    section Deployment
    Production        :d1, after c1, 3d
```

## Pie Chart

```mermaid
pie title Programming Languages Usage
    "JavaScript" : 35
    "Python" : 25
    "Java" : 20
    "TypeScript" : 15
    "Other" : 5
```

## Git Graph

```mermaid
gitGraph
    commit id: "Initial commit"
    commit id: "Add features"
    branch develop
    checkout develop
    commit id: "Dev work"
    commit id: "More dev work"
    checkout main
    merge develop
    commit id: "Release v1.0"
    branch hotfix
    checkout hotfix
    commit id: "Fix critical bug"
    checkout main
    merge hotfix
    commit id: "Release v1.0.1"
```

## User Journey

```mermaid
journey
    title My working day
    section Go to work
      Make tea: 5: Me
      Go upstairs: 3: Me
      Do work: 1: Me, Cat
    section Go home
      Go downstairs: 5: Me
      Sit down: 5: Me
```

## Requirement Diagram

```mermaid
requirementDiagram
    requirement test_req {
    id: 1
    text: the test text.
    risk: high
    verifymethod: test
    }

    element test_entity {
    type: simulation
    }

    test_entity - satisfies -> test_req
```

## Mind Map

```mermaid
mindmap
  root((Markdown Editor))
    Features
      Syntax Highlighting
      Live Preview
      Auto-save
    Performance
      Virtual Scrolling
      Web Workers
      Debounced Rendering
    UI Components
      Toolbar
      Sidebar
      Preview Pane
```

## Timeline

```mermaid
timeline
    title History of Web Development
    2000 : HTML 4.01
         : CSS 2
    2005 : AJAX becomes popular
         : Web 2.0 era
    2010 : HTML5 released
         : Responsive design
    2015 : ES6 / ECMAScript 2015
         : React.js popularity
    2020 : Modern frameworks
         : JAMstack architecture
         : WebAssembly adoption
```

## Architecture Diagram (C4 Model Style)

```mermaid
graph TB
    subgraph "Web Application"
        A[React Frontend]
        B[API Gateway]
        C[Auth Service]
        D[User Service]
        E[Data Service]
    end

    subgraph "Data Layer"
        F[(PostgreSQL)]
        G[(Redis Cache)]
        H[(S3 Storage)]
    end

    A -->|HTTPS| B
    B --> C
    B --> D
    B --> E
    D --> F
    E --> F
    C --> G
    E --> H
```

## Complex Flowchart

```mermaid
graph LR
    A[User Request] --> B{Authenticated?}
    B -->|No| C[Login Page]
    C --> D[Enter Credentials]
    D --> E{Valid?}
    E -->|No| C
    E -->|Yes| F[Generate Token]
    B -->|Yes| G{Authorized?}
    G -->|No| H[403 Forbidden]
    G -->|Yes| I[Process Request]
    F --> I
    I --> J{Success?}
    J -->|Yes| K[Return Data]
    J -->|No| L[Error Handler]
    L --> M[Log Error]
    M --> N[Return Error Response]
```

## Network Diagram

```mermaid
graph TB
    subgraph "DMZ"
        LB[Load Balancer]
        FW[Firewall]
    end

    subgraph "Application Layer"
        WEB1[Web Server 1]
        WEB2[Web Server 2]
        WEB3[Web Server 3]
    end

    subgraph "Business Layer"
        APP1[App Server 1]
        APP2[App Server 2]
    end

    subgraph "Data Layer"
        DB1[(Primary DB)]
        DB2[(Replica DB)]
    end

    Internet --> FW
    FW --> LB
    LB --> WEB1
    LB --> WEB2
    LB --> WEB3
    WEB1 --> APP1
    WEB2 --> APP1
    WEB3 --> APP2
    APP1 --> DB1
    APP2 --> DB1
    DB1 -.->|Replication| DB2
```

## Testing Flow

```mermaid
sequenceDiagram
    participant Dev as Developer
    participant Git as Git
    participant CI as CI/CD
    participant Test as Test Suite
    participant Deploy as Deployment

    Dev->>Git: Push code
    Git->>CI: Trigger pipeline
    CI->>Test: Run unit tests
    Test-->>CI: Test results

    alt Tests pass
        CI->>Test: Run integration tests
        Test-->>CI: All tests pass
        CI->>Deploy: Deploy to staging
        Deploy-->>CI: Deployment successful
        CI->>Dev: Notify success
    else Tests fail
        Test-->>CI: Tests failed
        CI->>Dev: Notify failure
    end
```

## End Notes

This document demonstrates the various types of Mermaid diagrams supported by the markdown editor. Each diagram type serves different visualization needs for documentation and technical communication.

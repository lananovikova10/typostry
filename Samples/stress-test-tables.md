# Stress Test: Large Tables and Diagrams

This document tests the measurement cache with large tables and complex diagrams to validate that layout thrash is reduced during scrolling.

## Large Table 1

| Column 1 | Column 2 | Column 3 | Column 4 | Column 5 | Column 6 | Column 7 | Column 8 |
|----------|----------|----------|----------|----------|----------|----------|----------|
| Data 1-1 | Data 1-2 | Data 1-3 | Data 1-4 | Data 1-5 | Data 1-6 | Data 1-7 | Data 1-8 |
| Data 2-1 | Data 2-2 | Data 2-3 | Data 2-4 | Data 2-5 | Data 2-6 | Data 2-7 | Data 2-8 |
| Data 3-1 | Data 3-2 | Data 3-3 | Data 3-4 | Data 3-5 | Data 3-6 | Data 3-7 | Data 3-8 |
| Data 4-1 | Data 4-2 | Data 4-3 | Data 4-4 | Data 4-5 | Data 4-6 | Data 4-7 | Data 4-8 |
| Data 5-1 | Data 5-2 | Data 5-3 | Data 5-4 | Data 5-5 | Data 5-6 | Data 5-7 | Data 5-8 |
| Data 6-1 | Data 6-2 | Data 6-3 | Data 6-4 | Data 6-5 | Data 6-6 | Data 6-7 | Data 6-8 |
| Data 7-1 | Data 7-2 | Data 7-3 | Data 7-4 | Data 7-5 | Data 7-6 | Data 7-7 | Data 7-8 |
| Data 8-1 | Data 8-2 | Data 8-3 | Data 8-4 | Data 8-5 | Data 8-6 | Data 8-7 | Data 8-8 |
| Data 9-1 | Data 9-2 | Data 9-3 | Data 9-4 | Data 9-5 | Data 9-6 | Data 9-7 | Data 9-8 |
| Data 10-1 | Data 10-2 | Data 10-3 | Data 10-4 | Data 10-5 | Data 10-6 | Data 10-7 | Data 10-8 |

## Code Block with Many Lines

```javascript
// Line 1
function testFunction() {
  // Line 3
  const variable1 = "test";
  // Line 5
  const variable2 = "test2";
  // Line 7
  const variable3 = "test3";
  // Line 9
  const variable4 = "test4";
  // Line 11
  const variable5 = "test5";
  // Line 13
  const variable6 = "test6";
  // Line 15
  const variable7 = "test7";
  // Line 17
  const variable8 = "test8";
  // Line 19
  const variable9 = "test9";
  // Line 21
  const variable10 = "test10";
  // Line 23
  return variable1 + variable2 + variable3 + variable4 + variable5;
  // Line 25
}
// Line 27
```

## Large Table 2 (Different Structure)

| ID | Name | Email | Phone | Address | City | State | ZIP |
|----|------|-------|-------|---------|------|-------|-----|
| 1 | John Doe | john@example.com | 555-0001 | 123 Main St | Boston | MA | 02101 |
| 2 | Jane Smith | jane@example.com | 555-0002 | 456 Oak Ave | Seattle | WA | 98101 |
| 3 | Bob Johnson | bob@example.com | 555-0003 | 789 Pine Rd | Austin | TX | 73301 |
| 4 | Alice Williams | alice@example.com | 555-0004 | 321 Elm St | Portland | OR | 97201 |
| 5 | Charlie Brown | charlie@example.com | 555-0005 | 654 Maple Dr | Denver | CO | 80201 |
| 6 | Diana Prince | diana@example.com | 555-0006 | 987 Cedar Ln | Phoenix | AZ | 85001 |
| 7 | Ethan Hunt | ethan@example.com | 555-0007 | 147 Birch Ct | Miami | FL | 33101 |
| 8 | Fiona Apple | fiona@example.com | 555-0008 | 258 Spruce Way | Chicago | IL | 60601 |
| 9 | George Martin | george@example.com | 555-0009 | 369 Aspen Blvd | Atlanta | GA | 30301 |
| 10 | Helen Mirren | helen@example.com | 555-0010 | 741 Willow Pkwy | Dallas | TX | 75201 |
| 11 | Ivan Drago | ivan@example.com | 555-0011 | 852 Cherry St | Houston | TX | 77001 |
| 12 | Julia Roberts | julia@example.com | 555-0012 | 963 Poplar Ave | LA | CA | 90001 |

## Nested Lists

- Top level item 1
  - Nested item 1.1
    - Deeply nested 1.1.1
    - Deeply nested 1.1.2
  - Nested item 1.2
- Top level item 2
  - Nested item 2.1
    - Deeply nested 2.1.1
    - Deeply nested 2.1.2
    - Deeply nested 2.1.3
  - Nested item 2.2
  - Nested item 2.3
- Top level item 3
  - Nested item 3.1
  - Nested item 3.2
    - Deeply nested 3.2.1
    - Deeply nested 3.2.2
    - Deeply nested 3.2.3
    - Deeply nested 3.2.4
  - Nested item 3.3

## Large Table 3 (Same Structure as Table 1 - Should Use Cache)

| Column 1 | Column 2 | Column 3 | Column 4 | Column 5 | Column 6 | Column 7 | Column 8 |
|----------|----------|----------|----------|----------|----------|----------|----------|
| Data 1-1 | Data 1-2 | Data 1-3 | Data 1-4 | Data 1-5 | Data 1-6 | Data 1-7 | Data 1-8 |
| Data 2-1 | Data 2-2 | Data 2-3 | Data 2-4 | Data 2-5 | Data 2-6 | Data 2-7 | Data 2-8 |
| Data 3-1 | Data 3-2 | Data 3-3 | Data 3-4 | Data 3-5 | Data 3-6 | Data 3-7 | Data 3-8 |
| Data 4-1 | Data 4-2 | Data 4-3 | Data 4-4 | Data 4-5 | Data 4-6 | Data 4-7 | Data 4-8 |
| Data 5-1 | Data 5-2 | Data 5-3 | Data 5-4 | Data 5-5 | Data 5-6 | Data 5-7 | Data 5-8 |
| Data 6-1 | Data 6-2 | Data 6-3 | Data 6-4 | Data 6-5 | Data 6-6 | Data 6-7 | Data 6-8 |
| Data 7-1 | Data 7-2 | Data 7-3 | Data 7-4 | Data 7-5 | Data 7-6 | Data 7-7 | Data 7-8 |
| Data 8-1 | Data 8-2 | Data 8-3 | Data 8-4 | Data 8-5 | Data 8-6 | Data 8-7 | Data 8-8 |
| Data 9-1 | Data 9-2 | Data 9-3 | Data 9-4 | Data 9-5 | Data 9-6 | Data 9-7 | Data 9-8 |
| Data 10-1 | Data 10-2 | Data 10-3 | Data 10-4 | Data 10-5 | Data 10-6 | Data 10-7 | Data 10-8 |

## Another Code Block (Different Size - Should Not Use Same Cache Entry)

```python
def another_function():
    print("Line 1")
    print("Line 2")
    print("Line 3")
    return True
```

## Large Table 4 (Different Column Count)

| A | B | C | D |
|---|---|---|---|
| 1 | 2 | 3 | 4 |
| 5 | 6 | 7 | 8 |
| 9 | 10 | 11 | 12 |
| 13 | 14 | 15 | 16 |
| 17 | 18 | 19 | 20 |
| 21 | 22 | 23 | 24 |
| 25 | 26 | 27 | 28 |
| 29 | 30 | 31 | 32 |

This document should demonstrate:
1. Tables with same structure reuse cached heights
2. Tables with different structures get different cache entries
3. Code blocks with different line counts get different cache entries
4. Scrolling performance is improved by reducing layout measurements

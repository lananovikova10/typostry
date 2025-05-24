import { fireEvent, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import React from "react"

import { MarkdownInput } from "../markdown-input"

describe("MarkdownInput", () => {
  it("renders a textarea with the provided value", () => {
    const value = "Test content"
    render(<MarkdownInput value={value} onChange={() => {}} />)

    const textarea = screen.getByTestId("markdown-input")
    expect(textarea).toBeInTheDocument()
    expect(textarea).toHaveValue(value)
  })

  it("calls onChange when text is entered", async () => {
    const handleChange = jest.fn()
    const user = userEvent.setup()

    render(<MarkdownInput value="" onChange={handleChange} />)

    const textarea = screen.getByTestId("markdown-input")

    // Type each character individually and check that onChange is called
    for (const char of "New text") {
      await user.type(textarea, char)
    }

    expect(handleChange).toHaveBeenCalled()
    // With userEvent, each character triggers onChange separately
    // So we can verify the handler is called with correct values
    expect(handleChange).toHaveBeenCalledTimes("New text".length)
  })

  it("applies the provided className", () => {
    const testClass = "test-class"
    render(<MarkdownInput value="" onChange={() => {}} className={testClass} />)

    const container = screen.getByTestId("markdown-input").parentElement
    expect(container).toHaveClass(testClass)
  })

  it("has the correct accessibility attributes", () => {
    render(<MarkdownInput value="" onChange={() => {}} />)

    const textarea = screen.getByTestId("markdown-input")
    expect(textarea).toHaveAttribute("aria-label", "Markdown editor")
    expect(textarea).toHaveAttribute("spellCheck", "false")
  })

  it("has a placeholder text", () => {
    render(<MarkdownInput value="" onChange={() => {}} />)

    const textarea = screen.getByTestId("markdown-input")
    expect(textarea).toHaveAttribute(
      "placeholder",
      "Write your markdown here..."
    )
  })

  it("handles image paste events correctly", () => {
    const handleChange = jest.fn()
    render(<MarkdownInput value="" onChange={handleChange} />)

    const textarea = screen.getByTestId("markdown-input")

    // Create a mock clipboard event with image data
    const mockImageDataUrl =
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="
    const file = new File(["dummy content"], "image.png", { type: "image/png" })

    // Create a mock FileReader that returns our test image data
    const originalFileReader = global.FileReader
    global.FileReader = jest.fn(() => ({
      readAsDataURL: jest.fn(),
      onload: null,
      result: mockImageDataUrl,
    }))

    // Create a mock clipboard event
    const clipboardData = {
      items: [
        {
          type: "image/png",
          getAsFile: () => file,
        },
      ],
    }

    // Trigger the paste event
    fireEvent.paste(textarea, {
      clipboardData,
      preventDefault: jest.fn(),
    })

    // Manually trigger the FileReader onload event
    const reader = global.FileReader.mock.instances[0]
    reader.onload({ target: { result: mockImageDataUrl } })

    // Check that onChange was called with the correct Markdown syntax
    expect(handleChange).toHaveBeenCalledWith(`![](${mockImageDataUrl})`)

    // Restore the original FileReader
    global.FileReader = originalFileReader
  })

  it("handles URL paste events correctly", () => {
    const handleChange = jest.fn()
    render(<MarkdownInput value="" onChange={handleChange} />)

    const textarea = screen.getByTestId("markdown-input")

    // Create a mock clipboard event with URL data
    const mockUrl = "https://example.com"
    const clipboardData = {
      items: [],
      getData: () => mockUrl,
    }

    // Set up the textarea with selection properties
    Object.defineProperty(textarea, "selectionStart", { value: 0 })
    Object.defineProperty(textarea, "selectionEnd", { value: 0 })

    // Trigger the paste event
    fireEvent.paste(textarea, {
      clipboardData,
      preventDefault: jest.fn(),
      currentTarget: textarea,
    })

    // Check that onChange was called with the correct Markdown link syntax
    expect(handleChange).toHaveBeenCalledWith(`[Link](${mockUrl})`)
  })

  it("handles regular text paste events correctly", () => {
    const handleChange = jest.fn()
    const initialValue = "Initial text"
    render(<MarkdownInput value={initialValue} onChange={handleChange} />)

    const textarea = screen.getByTestId("markdown-input")

    // Create a mock clipboard event with regular text data
    const pastedText = "Pasted text"
    const clipboardData = {
      items: [],
      getData: () => pastedText,
    }

    // Set up the textarea with selection properties
    // Simulate cursor at position 7 (after "Initial")
    Object.defineProperty(textarea, "selectionStart", { value: 7 })
    Object.defineProperty(textarea, "selectionEnd", { value: 7 })

    // Trigger the paste event
    fireEvent.paste(textarea, {
      clipboardData,
      preventDefault: jest.fn(),
      currentTarget: textarea,
    })

    // Check that onChange was called with the correct combined text
    expect(handleChange).toHaveBeenCalledWith("Initial Pasted text text")
  })

  it("handleEmojiSelect inserts emoji at cursor position", async () => {
    const handleChange = jest.fn();
    const initialValue = "Start  end";
    
    // Create a ref to access the component methods
    const ref = React.createRef<any>();
    
    render(<MarkdownInput value={initialValue} onChange={handleChange} ref={ref} />);
    
    const textarea = screen.getByTestId("markdown-input");
    
    // Set cursor position after "Start "
    Object.defineProperty(textarea, "selectionStart", { value: 6, configurable: true });
    Object.defineProperty(textarea, "selectionEnd", { value: 6, configurable: true });
    
    // Mock focus and setSelectionRange methods
    const mockFocus = jest.fn();
    const mockSetSelectionRange = jest.fn();
    Object.defineProperty(textarea, "focus", { 
      value: mockFocus,
      configurable: true,
      writable: true
    });
    Object.defineProperty(textarea, "setSelectionRange", { 
      value: mockSetSelectionRange,
      configurable: true,
      writable: true
    });
    
    // Mock requestAnimationFrame
    jest.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      cb(0);
      return 0;
    });
    
    // Create mock emoji object
    const mockEmoji = { shortcodes: ["smile"] };
    
    // Call handleEmojiSelect with the mock emoji
    ref.current.handleEmojiSelect(mockEmoji);
    
    // Verify onChange called with correct text
    expect(handleChange).toHaveBeenCalledWith("Start :smile: end");
    expect(handleChange).toHaveBeenCalledTimes(1);
    
    // Verify focus was restored
    expect(mockFocus).toHaveBeenCalled();
    
    // Verify cursor position was set after the inserted emoji
    expect(mockSetSelectionRange).toHaveBeenCalledWith(13, 13);
    
    // Cleanup
    jest.restoreAllMocks();
  });
  
  it("handleEmojiSelect works with different emoji data formats", async () => {
    const handleChange = jest.fn();
    const initialValue = "Test";
    
    const ref = React.createRef<any>();
    render(<MarkdownInput value={initialValue} onChange={handleChange} ref={ref} />);
    
    const textarea = screen.getByTestId("markdown-input");
    
    // Set cursor position at end
    Object.defineProperty(textarea, "selectionStart", { value: 4, configurable: true });
    Object.defineProperty(textarea, "selectionEnd", { value: 4, configurable: true });
    
    // Mock focus and setSelectionRange methods
    const mockFocus = jest.fn();
    const mockSetSelectionRange = jest.fn();
    Object.defineProperty(textarea, "focus", { 
      value: mockFocus,
      configurable: true,
      writable: true
    });
    Object.defineProperty(textarea, "setSelectionRange", { 
      value: mockSetSelectionRange,
      configurable: true,
      writable: true
    });
    
    // Mock requestAnimationFrame
    jest.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      cb(0);
      return 0;
    });
    
    // Test with id format
    ref.current.handleEmojiSelect({ id: "heart" });
    expect(handleChange).toHaveBeenCalledWith("Test:heart:");
    
    // Test with name format
    ref.current.handleEmojiSelect({ name: "Smiling Face" });
    expect(handleChange).toHaveBeenCalledWith("Test:smiling_face:");
    
    // Verify focus and cursor position was set correctly
    expect(mockFocus).toHaveBeenCalledTimes(2);
    
    // Cleanup
    jest.restoreAllMocks();
  });
  
  it("handleEmojiSelect replaces selected text", async () => {
    const handleChange = jest.fn();
    const initialValue = "Replace this text";
    
    const ref = React.createRef<any>();
    render(<MarkdownInput value={initialValue} onChange={handleChange} ref={ref} />);
    
    const textarea = screen.getByTestId("markdown-input");
    
    // Set selection to "this"
    Object.defineProperty(textarea, "selectionStart", { value: 8, configurable: true });
    Object.defineProperty(textarea, "selectionEnd", { value: 12, configurable: true });
    
    // Mock focus and setSelectionRange methods
    const mockFocus = jest.fn();
    const mockSetSelectionRange = jest.fn();
    Object.defineProperty(textarea, "focus", { 
      value: mockFocus,
      configurable: true,
      writable: true
    });
    Object.defineProperty(textarea, "setSelectionRange", { 
      value: mockSetSelectionRange,
      configurable: true,
      writable: true
    });
    
    // Mock requestAnimationFrame
    jest.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      cb(0);
      return 0;
    });
    
    // Call handleEmojiSelect
    ref.current.handleEmojiSelect({ shortcodes: ["thumbsup"] });
    
    // Verify text replacement
    expect(handleChange).toHaveBeenCalledWith("Replace :thumbsup: text");
    
    // Verify focus and cursor position
    expect(mockFocus).toHaveBeenCalled();
    expect(mockSetSelectionRange).toHaveBeenCalledWith(18, 18);
    
    // Cleanup
    jest.restoreAllMocks();
  });
})